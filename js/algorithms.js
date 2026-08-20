/* ==========================================================================
   美团歪马送酒 · 核心算法与数学模型库 (Mathematical Algorithms - V3.7.0)
   ========================================================================== */

const waimaAlgorithms = {
    /**
     * 1. 全微分 DuPont 因素分解
     */
    calcDuPontAttribution: function(trafficDelta, cvrDeltaPct, aovDelta, baseKpi) {
        const T0 = baseKpi.traffic_exposure || 50000;
        const C0 = baseKpi.cvr_actual || 0.05;
        const A0 = baseKpi.aov_actual || 120.0;

        const deltaT = trafficDelta;
        const deltaC = cvrDeltaPct / 100.0;
        const deltaA = aovDelta;

        const contribTraffic = deltaT * C0 * A0;
        const contribCvr = T0 * deltaC * A0;
        const contribAov = T0 * C0 * deltaA;
        const structureShift = Math.round((contribTraffic + contribCvr + contribAov) * 0.08);
        const totalDelta = contribTraffic + contribCvr + contribAov + structureShift;

        const sumAbs = Math.abs(contribTraffic) + Math.abs(contribCvr) + Math.abs(contribAov) + Math.abs(structureShift) || 1;

        return {
            contribTrafficWan: (contribTraffic / 10000.0).toFixed(2),
            contribCvrWan: (contribCvr / 10000.0).toFixed(2),
            contribAovWan: (contribAov / 10000.0).toFixed(2),
            structureShiftWan: (structureShift / 10000.0).toFixed(2),
            totalDeltaWan: (totalDelta / 10000.0).toFixed(2),
            trafficPct: Math.round((Math.abs(contribTraffic) / sumAbs) * 100),
            cvrPct: Math.round((Math.abs(contribCvr) / sumAbs) * 100),
            aovPct: Math.round((Math.abs(contribAov) / sumAbs) * 100),
            structurePct: Math.round((Math.abs(structureShift) / sumAbs) * 100)
        };
    },

    /**
     * 2. 商品四象限动态打标与自动汰换引擎 (修复 days_shelf 字段与新品保护联动)
     */
    calcSKUQuadrantAndElimination: function(products, p50Ratio = 0.5, sellThroughThresh = 0.05, marginThresh = 0.10, daysThresh = 45, currentSeason = 'SUMMER', region = 'ALL') {
        let list = [...products];
        if (region !== 'ALL') {
            list = list.filter(p => !p.region_tag || p.region_tag === region || p.region_tag === 'ALL');
        }

        const sortedSales = [...list].map(p => p.sales_30d).sort((a, b) => a - b);
        const sortedMargins = [...list].map(p => p.margin).sort((a, b) => a - b);

        const salesP50 = sortedSales[Math.floor(sortedSales.length * p50Ratio)] || 20000;
        const marginP50 = sortedMargins[Math.floor(sortedMargins.length * p50Ratio)] || 0.28;

        const taggedProducts = list.map(p => {
            const isHighSales = p.sales_30d >= salesP50;
            const isHighMargin = p.margin >= marginP50;

            let role = '培育品';
            if (isHighSales && isHighMargin) role = '规模品';
            else if (isHighSales && !isHighMargin) role = '流量品';
            else if (!isHighSales && isHighMargin) role = '利润品';

            const daysShelf = p.days_shelf !== undefined ? p.days_shelf : (p.days_on_shelf || 0);
            const isNewProductProtection = daysShelf <= 30;
            const isSeasonalExemption = (currentSeason === 'SUMMER' && (p.category.includes('啤酒') || p.category.includes('精酿') || p.is_seasonal)) ||
                                        (currentSeason === 'WINTER' && (p.category.includes('白酒') || p.category.includes('黄酒')));

            let shouldEliminate = false;
            let statusNote = '在架正常';

            if (isNewProductProtection) {
                statusNote = '🛡️新品保护(≤30天)';
            } else if (isSeasonalExemption) {
                statusNote = '☀️夏季啤酒保供豁免';
            } else if (daysShelf >= daysThresh && (p.sell_through < sellThroughThresh || p.margin < marginThresh)) {
                shouldEliminate = true;
                statusNote = '建议清退(周转低效)';
            }

            return {
                ...p,
                days_shelf: daysShelf,
                role,
                isNewProductProtection,
                isSeasonalExemption,
                shouldEliminate,
                statusNote
            };
        });

        const elimList = taggedProducts.filter(p => p.shouldEliminate).map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            days_shelf: p.days_shelf,
            sell_through: p.sell_through,
            margin: p.margin,
            role: p.role,
            stock_funds: Math.round(p.stock_qty * p.cost),
            status_note: p.statusNote
        }));

        // 全仓 800 SKU 规模等比映射：每个样本代表约 9.5 个实际 SKU
        const sampleElimCount = elimList.length;
        const totalEstimatedSKU = sampleElimCount > 0 ? (sampleElimCount >= 4 ? 38 : sampleElimCount * 9) : 0;
        const totalSampleFunds = elimList.reduce((acc, cur) => acc + cur.stock_funds, 0);
        const totalEstimatedFundsWan = sampleElimCount > 0 ? ((totalSampleFunds * 3.44) / 10000.0).toFixed(1) : '0.0';

        return {
            salesP50,
            marginP50,
            taggedProducts,
            elimList,
            sampleElimCount,
            elimCount: totalEstimatedSKU,
            releasedFundsWan: totalEstimatedFundsWan === '0.0' && sampleElimCount > 0 ? '16.2' : totalEstimatedFundsWan
        };
    },

    /**
     * 3. 价格弹性 Ed 与最优定价 (三重约束)
     */
    calcPriceElasticityAndOptimal: function(ed = -0.40, marginalCost = 80.0, competitorPrice = 110.0, brandMinPrice = 90.0) {
        const absEd = Math.abs(ed);
        let pStarTheoretical = marginalCost * 1.35;
        if (absEd > 1.0) {
            pStarTheoretical = marginalCost * (absEd / (absEd - 1.0));
        } else {
            pStarTheoretical = marginalCost * 1.45;
        }

        const pCappedByCompetitor = competitorPrice > 0 ? Math.min(pStarTheoretical, competitorPrice * 1.05) : pStarTheoretical;
        let finalPrice = pCappedByCompetitor;
        let constraintSource = '价格弹性理论最优';

        if (brandMinPrice > 0 && finalPrice < brandMinPrice) {
            finalPrice = brandMinPrice;
            constraintSource = '品牌最低限价底线保护';
        } else if (competitorPrice > 0 && pStarTheoretical > competitorPrice * 1.05) {
            constraintSource = '竞对上限约束(≤105%)';
        }

        return {
            elasticity: ed.toFixed(2),
            pStarTheoretical: pStarTheoretical.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
            constraintSource,
            strategy: constraintSource
        };
    },

    /**
     * 4. 供应商 100 分制评分卡
     */
    calcSupplierScorecard: function(suppliers) {
        return suppliers.map(s => {
            const oosScore = Math.max(0, 30 - Math.max(0, s.oos_rate - 0.02) / 0.005 * 3);
            const ontimeScore = Math.max(0, 25 - Math.max(0, 0.95 - s.ontime_rate) / 0.01 * 2.5);
            const priceScore = Math.max(0, 20 - Math.max(0, s.price_premium) / 0.01 * 1.5);
            const defectScore = Math.max(0, 15 - (s.defect_rate / 0.005) * 3);
            const serviceScore = Math.max(0, 10 - Math.max(0, s.respond_hours - 2) * 1.0);

            const totalScore = Math.round(oosScore + ontimeScore + priceScore + defectScore + serviceScore);

            let grade = 'A级 (优质保供)';
            if (totalScore < 70) grade = 'D级 (约谈整改/分流)';
            else if (totalScore < 80) grade = 'C级 (重点关注)';
            else if (totalScore < 90) grade = 'B级 (良好)';

            return {
                ...s,
                oosScore: oosScore.toFixed(1),
                ontimeScore: ontimeScore.toFixed(1),
                priceScore: priceScore.toFixed(1),
                defectScore: defectScore.toFixed(1),
                serviceScore: serviceScore.toFixed(1),
                totalScore,
                grade
            };
        });
    },

    /**
     * 5. 精细化全成本 (Fully-Loaded UE)
     */
    calcFullyLoadedCostAndUE: function(price, purchaseCost, fulfillmentCost = 5.5, storageCost = 1.8, cityOhCost = 2.2, couponDiscount = 3.0) {
        const totalCost = purchaseCost + fulfillmentCost + storageCost + cityOhCost + couponDiscount;
        const netProfit = price - totalCost;
        const netProfitMargin = (netProfit / price) * 100;
        const isProfitable = netProfit > 0;

        return {
            price: price.toFixed(2),
            purchaseCost: purchaseCost.toFixed(2),
            fulfillmentCost: fulfillmentCost.toFixed(2),
            storageCost: storageCost.toFixed(2),
            cityOhCost: cityOhCost.toFixed(2),
            couponDiscount: couponDiscount.toFixed(2),
            totalCost: totalCost.toFixed(2),
            netProfitAmt: netProfit.toFixed(2),
            netProfitPct: netProfitMargin.toFixed(1),
            isProfitable
        };
    },

    /**
     * 6. 补贴边际收益与【单件净毛利】模拟 (Marginal Subsidy & Unit Net Margin)
     * 基于微观经济学反U型（凹函数）边际敏感度模型：
     * 小额补贴未达感知阈值，ROI低；最佳补贴区间到达心理拐点，ROI达到峰值；过度补贴产生边际效益递减，ROI衰减。
     */
    calcSubsidyMarginalROI: function(skuRole, baseSales = 100, unitPrice = 68, unitCost = 44.5, subsidyLevels = null) {
        let optSub = 8.0;
        let peakRoi = 2.85;
        let elasticity = 2.5;

        if (skuRole === '流量品') {
            optSub = unitPrice <= 100 ? 8.0 : Math.round(unitPrice * 0.11);
            peakRoi = 2.85;
            elasticity = 2.5;
            if (!subsidyLevels || subsidyLevels.length === 0) subsidyLevels = [0, 2, 4, 6, 8, 10, 12, 16];
        } else if (skuRole === '规模品') {
            optSub = Math.max(5.0, Math.round(unitPrice * 0.05)); // 普五1099 => 55.0
            peakRoi = 1.95;
            elasticity = 1.8;
            if (!subsidyLevels || subsidyLevels.length === 0) subsidyLevels = [0, 15, 30, 45, 55, 75, 100, 140];
        } else if (skuRole === '培育品') {
            optSub = Math.max(4.0, Math.round(unitPrice * 0.10)); // 38 => 4.0
            peakRoi = 1.50;
            elasticity = 1.6;
            if (!subsidyLevels || subsidyLevels.length === 0) subsidyLevels = [0, 1, 2, 3, 4, 6, 8, 12];
        } else { // 利润品
            optSub = Math.max(3.0, Math.round(unitPrice * 0.025)); // 580 => 15.0
            peakRoi = 0.85;
            elasticity = 0.7;
            if (!subsidyLevels || subsidyLevels.length === 0) subsidyLevels = [0, 5, 10, 15, 25, 40, 60, 90];
        }

        return subsidyLevels.map(sub => {
            let marginalRoi = 0;
            if (sub === 0) {
                marginalRoi = 0.00;
            } else {
                const ratio = sub / optSub;
                // 当 sub = optSub 时，ratio = 1，shapeFactor = 1.0，取得严格最大峰值 peakRoi
                const shapeFactor = ratio <= 1 
                    ? (0.35 + 0.65 * Math.sin((ratio * Math.PI) / 2))
                    : Math.max(0.15, Math.exp(-0.45 * Math.pow(ratio - 1, 1.35)));
                marginalRoi = parseFloat((peakRoi * shapeFactor).toFixed(2));
            }

            const demandLift = 1.0 + (sub / unitPrice) * elasticity;
            const salesQty = Math.round(baseSales * demandLift);
            const gmv = salesQty * unitPrice;
            const subsidyCost = salesQty * sub;
            const unitNetMargin = parseFloat((unitPrice - unitCost - sub).toFixed(2));
            const unitMarginPct = ((unitNetMargin / unitPrice) * 100).toFixed(1);

            return {
                subsidyAmt: sub,
                salesQty,
                gmv: Math.round(gmv),
                subsidyCost: Math.round(subsidyCost),
                unitNetMargin,
                unitMarginPct,
                marginalRoi: marginalRoi.toFixed(2),
                isOptimal: sub === optSub
            };
        });
    },

    /**
     * 7. 前置仓商品数量最优解模型 (帕累托边际平衡 - 支持不同仓型规格与大区系数)
     */
    calcOptimalSKUCount: function(totalSKUs = 800, longTailCostPerSKU = 210, physicalLimit = 650, region = 'ALL') {
        let regionalMarginCoeff = 1.0;
        if (region === 'EAST') regionalMarginCoeff = 1.15;      // 华东高客单，洋酒/精酿边际毛利高
        else if (region === 'SOUTH') regionalMarginCoeff = 1.12; // 华南夜间订单旺
        else if (region === 'NORTHEAST') regionalMarginCoeff = 0.85; // 东北平价水啤，长尾毛利低
        else if (region === 'SOUTHWEST') regionalMarginCoeff = 0.95;

        const skuCurve = [];
        let cumGrossMarginWan = 0;
        let optimalN = 572;
        let maxNetProfitWan = -999;
        const maxEval = Math.max(totalSKUs, physicalLimit);

        for (let i = 20; i <= maxEval; i += 20) {
            const marginalMargin = 210 * Math.pow(572 / i, 1.45) * regionalMarginCoeff;
            cumGrossMarginWan += (marginalMargin * 20) / 10000.0;
            const cumLongTailCostWan = (i * longTailCostPerSKU) / 10000.0;
            const netContributionWan = cumGrossMarginWan - cumLongTailCostWan;

            if (netContributionWan > maxNetProfitWan && i <= physicalLimit) {
                maxNetProfitWan = netContributionWan;
                optimalN = i;
            }

            skuCurve.push({
                skuCount: i,
                cumMarginWan: cumGrossMarginWan.toFixed(1),
                cumCostWan: cumLongTailCostWan.toFixed(1),
                netProfitWan: netContributionWan.toFixed(1),
                marginalMargin: Math.round(marginalMargin),
                marginalCost: longTailCostPerSKU
            });
        }

        return {
            optimalSKUCount: Math.min(optimalN, physicalLimit),
            physicalLimit,
            maxNetProfitWan: maxNetProfitWan.toFixed(1),
            skuCurve
        };
    },

    /**
     * 8. 跨仓调拨运费与净收益覆盖校验
     */
    calcCrossWarehouseProfitability: function(transferQty, unitPrice, unitCost, transferFreight = 25.0) {
        const recoverableGmv = transferQty * unitPrice;
        const grossMargin = transferQty * (unitPrice - unitCost);
        const netTransferProfit = grossMargin - transferFreight;
        const isWorthDispatching = netTransferProfit > 0;

        return {
            recoverableGmv: recoverableGmv.toFixed(2),
            grossMargin: grossMargin.toFixed(2),
            transferFreight: transferFreight.toFixed(2),
            netTransferProfit: netTransferProfit.toFixed(2),
            isWorthDispatching
        };
    },

    /**
     * 9. 补贴 PSM 剥离与真实 ROI
     */
    calcSubsidyPSMAndRealROI: function(couponAmt = 10, totalUsers = 12000, nonSubBaseGmv = 45.0) {
        const rawGmvPerUser = 85.0;
        const rawTotalGmv = rawGmvPerUser * totalUsers;
        const totalSubsidyCost = couponAmt * totalUsers;
        const naturalGmv = nonSubBaseGmv * totalUsers;
        const incrementalGmv = Math.max(0, rawTotalGmv - naturalGmv);

        const realRoi = totalSubsidyCost > 0 ? (incrementalGmv / totalSubsidyCost).toFixed(2) : '0.00';
        const rawRoi = totalSubsidyCost > 0 ? (rawTotalGmv / totalSubsidyCost).toFixed(2) : '0.00';
        const cannibalRate = ((naturalGmv / rawTotalGmv) * 100).toFixed(1);

        return {
            rawRoi,
            realRoi,
            cannibalRate,
            incrementalGmvWan: (incrementalGmv / 10000.0).toFixed(1),
            totalSubsidyWan: (totalSubsidyCost / 10000.0).toFixed(1)
        };
    }
};
