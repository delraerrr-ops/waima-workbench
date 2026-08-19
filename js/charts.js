/* ==========================================================================
   美团歪马送酒 · 可视化图表驱动库 (Chart.js Renderers - V3.4.2 单件毛利校准版)
   ========================================================================== */

const waimaCharts = {
    instances: {},

    /**
     * 1. 渲染 DuPont 归因瀑布图 (Waterfall)
     */
    renderDuPontChart: function(trafficWan, cvrWan, aovWan, totalWan) {
        const ctx = document.getElementById('chart-dupont-waterfall');
        if (!ctx) return;

        if (this.instances['dupont']) this.instances['dupont'].destroy();

        this.instances['dupont'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['流量变动', '转化率变动', '客单价变动', '总GMV变动'],
                datasets: [{
                    label: '贡献金额 (万元)',
                    data: [trafficWan, cvrWan, aovWan, totalWan],
                    backgroundColor: [
                        trafficWan >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)',
                        cvrWan >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)',
                        aovWan >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)',
                        totalWan >= 0 ? 'rgba(52, 152, 219, 0.8)' : 'rgba(192, 57, 43, 0.8)'
                    ],
                    borderColor: [
                        trafficWan >= 0 ? '#2ecc71' : '#e74c3c',
                        cvrWan >= 0 ? '#2ecc71' : '#e74c3c',
                        aovWan >= 0 ? '#2ecc71' : '#e74c3c',
                        totalWan >= 0 ? '#3498db' : '#c0392b'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` 贡献: ${context.raw} 万元`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#f0f0f0' },
                        title: { display: true, text: '变动金额 (万元)', font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    },

    /**
     * 2. 渲染商品四象限散点图 (Quadrant Scatter)
     */
    renderQuadrantChart: function(taggedProducts, salesP50, marginP50) {
        const ctx = document.getElementById('chart-sku-quadrant');
        if (!ctx) return;

        if (this.instances['quadrant']) this.instances['quadrant'].destroy();

        const colorMap = {
            '规模品': 'rgba(46, 204, 113, 0.85)',
            '流量品': 'rgba(52, 152, 219, 0.85)',
            '利润品': 'rgba(241, 196, 15, 0.85)',
            '培育品': 'rgba(149, 165, 166, 0.85)'
        };

        const datasets = ['规模品', '流量品', '利润品', '培育品'].map(role => {
            return {
                label: role,
                data: taggedProducts.filter(p => p.role === role).map(p => ({
                    x: p.sales_30d,
                    y: (p.margin * 100).toFixed(1),
                    name: p.name,
                    id: p.id,
                    stock: p.stock_qty,
                    statusNote: p.isNewProductProtection ? '🛡️新品保护' : (p.isSeasonalExemption ? '☀️季节豁免' : '')
                })),
                backgroundColor: colorMap[role],
                borderColor: '#ffffff',
                borderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 8
            };
        });

        this.instances['quadrant'] = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const raw = context.raw;
                                return ` [${raw.id}] ${raw.name} | 销量: ${raw.x}件 | 毛利: ${raw.y}% ${raw.statusNote ? '('+raw.statusNote+')' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: `近30天销量 (件) - P50基准线: ${salesP50}件`, font: { size: 11 } },
                        grid: { color: '#f5f5f5' }
                    },
                    y: {
                        title: { display: true, text: `毛利率 (%) - P50基准线: ${(marginP50 * 100).toFixed(1)}%`, font: { size: 11 } },
                        grid: { color: '#f5f5f5' }
                    }
                }
            }
        });
    },

    /**
     * 3. 渲染价格弹性需求曲线 (Elasticity Curve)
     */
    renderElasticityCurve: function(ed) {
        const ctx = document.getElementById('chart-elasticity-curve');
        if (!ctx) return;

        if (this.instances['elasticity']) this.instances['elasticity'].destroy();

        const prices = [2200, 2400, 2499, 2600, 2800, 2899, 3000, 3200];
        const basePrice = 2899;
        const baseQty = 125;

        const quantities = prices.map(p => {
            const pctChange = (p - basePrice) / basePrice;
            const qPctChange = pctChange * ed;
            return Math.max(10, Math.round(baseQty * (1 + qPctChange)));
        });

        this.instances['elasticity'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: prices.map(p => `¥${p}`),
                datasets: [{
                    label: `需求曲线 (Ed = ${ed})`,
                    data: quantities,
                    borderColor: '#2f54eb',
                    backgroundColor: 'rgba(47, 84, 235, 0.1)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 5,
                    pointBackgroundColor: '#2f54eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` 预计日销量: ${context.raw} 件`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#f0f0f0' },
                        title: { display: true, text: '预计日销 (件)', font: { size: 11 } }
                    },
                    x: {
                        title: { display: true, text: '拟合售价区间 (元)', font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    /**
     * 4. 渲染前置仓最优 SKU 数量帕累托边际曲线 (572 最优容量)
     */
    renderOptimalSKUChart: function(skuCurveData, optimalN) {
        const ctx = document.getElementById('chart-optimal-sku-pareto');
        if (!ctx) return;

        if (this.instances['optimalSku']) this.instances['optimalSku'].destroy();

        const labels = skuCurveData.map(d => `${d.skuCount}个`);
        const cumMargin = skuCurveData.map(d => parseFloat(d.cumMarginWan));
        const cumCost = skuCurveData.map(d => parseFloat(d.cumCostWan));
        const netProfit = skuCurveData.map(d => parseFloat(d.netProfitWan));

        this.instances['optimalSku'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '累计毛利贡献 (万元)',
                        data: cumMargin,
                        borderColor: '#2ecc71',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 2
                    },
                    {
                        label: '长尾综合成本分摊 (万元)',
                        data: cumCost,
                        borderColor: '#e74c3c',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 2
                    },
                    {
                        label: '前置仓净贡献额 (毛利-成本)',
                        data: netProfit,
                        borderColor: '#2f54eb',
                        backgroundColor: 'rgba(47, 84, 235, 0.12)',
                        fill: true,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#2f54eb'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return `SKU 数量容量: ${context[0].label}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#f5f5f5' },
                        title: { display: true, text: '金额 (万元)', font: { size: 11 } }
                    },
                    x: {
                        title: { display: true, text: `SKU 数量梯度 (黄金交叉平衡点: ${optimalN} 个)`, font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    /**
     * 5. 渲染【当前选中单品】专属的补贴边际 ROI 仿真曲线 (单件净毛利元/件版)
     */
    renderMarginalSubsidyChart: function(marginalData, skuRole = '流量品') {
        const ctx = document.getElementById('chart-marginal-subsidy');
        if (!ctx) return;

        if (this.instances['marginalSub']) this.instances['marginalSub'].destroy();

        const labels = marginalData.map(d => `补¥${d.subsidyAmt}`);
        const rois = marginalData.map(d => parseFloat(d.marginalRoi));
        const unitMargins = marginalData.map(d => d.unitNetMargin);

        let mainColor = '#1890ff';
        let mainBg = 'rgba(24, 144, 255, 0.15)';
        if (skuRole.includes('规模')) {
            mainColor = '#faad14';
            mainBg = 'rgba(250, 173, 20, 0.15)';
        } else if (skuRole.includes('利润')) {
            mainColor = '#e74c3c';
            mainBg = 'rgba(231, 76, 60, 0.15)';
        }

        this.instances['marginalSub'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `【${skuRole}】边际拉新 ROI (左轴)`,
                        data: rois,
                        borderColor: mainColor,
                        backgroundColor: mainBg,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: mainColor,
                        borderWidth: 3,
                        yAxisID: 'y'
                    },
                    {
                        label: '单件商品净毛利 (元/件 - 右轴)',
                        data: unitMargins,
                        borderColor: '#2ecc71',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return ` 边际 ROI: ${context.raw} (每投入1元补贴带来的增量GMV转化)`;
                                } else {
                                    const rawVal = context.raw;
                                    return ` 单件净毛利: ¥${rawVal} 元/件 (扣除补贴后单件实际毛利)`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: '#f5f5f5' },
                        title: { display: true, text: '边际 ROI (增量GMV / 补贴成本)', font: { size: 11 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: '单件净毛利 (元/件)', font: { size: 11 } }
                    },
                    x: {
                        title: { display: true, text: '单件商品补贴金额 (元)', font: { size: 11 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};
