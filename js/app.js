/* ==========================================================================
   美团歪马送酒 · 采销中台工作台主交互驱动逻辑 (Application Main JS - V3.2 终极链路对齐版)
   ========================================================================== */

let currentRegionFilter = 'ALL';
let updateDuPontGlobal = null;
let updateSKUMatrixGlobal = null;
let updatePricingGlobal = null;
let updateSubsidyUEGlobal = null;

// 全局活跃策略列表 (支持跨模块动态注入与 PDCA 流转)
let globalStrategyList = [
    { 
        id: 'STR2026081701', 
        type: '跨仓应急急调', 
        operator: '李采销 (啤酒)', 
        status: '执行中', 
        expected: '天河仓【青岛纯生】调拨120箱，预计45min补齐', 
        actual: '在途运输中，挽回GMV ¥2.4万 (运费¥25, 净利+¥191)', 
        lark: true 
    },
    { 
        id: 'STR2026081702', 
        type: 'ROP 补货调拨', 
        operator: '张中台 (采销BP)', 
        status: '执行中', 
        expected: '全品类 14个爆款触发安全库存红线，加急调拨', 
        actual: '已下发华东/华南总仓调拨指令 (T+1回填中)', 
        lark: true 
    },
    { 
        id: 'STR2026081603', 
        type: '长尾 SKU 汰换', 
        operator: '王品类 (白酒/红酒)', 
        status: '已完成', 
        expected: '清退 38个长尾低效SKU，释放资金 16.2万元', 
        actual: '已完成下架清退，资金注入营销补贴池 (T+3回填)', 
        lark: false 
    },
    { 
        id: 'STR2026081604', 
        type: '品牌最低限价保底', 
        operator: '系统自动风控', 
        status: '已完成', 
        expected: '五粮液普五锁定 ¥999 品牌底线，防止品牌违规处罚', 
        actual: '已下发终端售价 ¥999，避免品牌处罚且日毛利+¥1.2万', 
        lark: true 
    },
    { 
        id: 'STR2026081505', 
        type: '用户分层防误伤', 
        operator: '赵运营 (用户增长)', 
        status: '已完成', 
        expected: '老客误伤率降至 <20%，聚焦新客首单立减', 
        actual: '真实增量 ROI 提升至 2.45，节约预算 ¥4.8万元', 
        lark: true 
    },
    { 
        id: 'STR2026081506', 
        type: '供应商约谈保供', 
        operator: '李采销 (啤酒)', 
        status: '已完成', 
        expected: '约谈 SUP003 (评分68.5/D级)，要求缺货率降至 <2%', 
        actual: '已签署保供协议，并启动备选供应商分流 20% 订单', 
        lark: false 
    }
];

document.addEventListener('DOMContentLoaded', function() {
    try { initPRDV2Features(); } catch(e) { console.error('initPRDV2Features error:', e); }
    try { initTabNavigation(); } catch(e) { console.error('initTabNavigation error:', e); }
    try { initTargetModal(); } catch(e) { console.error('initTargetModal error:', e); }
    try { initOverviewModule(); } catch(e) { console.error('initOverviewModule error:', e); }
    try { initSKUMatrixModule(); } catch(e) { console.error('initSKUMatrixModule error:', e); }
    try { initPricingModule(); } catch(e) { console.error('initPricingModule error:', e); }
    try { initSubsidyUEModule(); } catch(e) { console.error('initSubsidyUEModule error:', e); }
    try { initSupplierModule(); } catch(e) { console.error('initSupplierModule error:', e); }
    try { initStrategyTrackingModule(); } catch(e) { console.error('initStrategyTrackingModule error:', e); }
    try { initAICopilotModule(); } catch(e) { console.error('initAICopilotModule error:', e); }
    try { initCodeAccordions(); } catch(e) { console.error('initCodeAccordions error:', e); }
    try { initCrossModuleLinkage(); } catch(e) { console.error('initCrossModuleLinkage error:', e); }
    try { initGlobalFloatingAI(); } catch(e) { console.error('initGlobalFloatingAI error:', e); }
    try { initManualModal(); } catch(e) { console.error('initManualModal error:', e); }

    const defaultData = waimaData.regionalKpi[currentRegionFilter] || waimaData.regionalKpi['ALL'];
    refreshOverviewKpisByRegion(defaultData);
});

/**
 * 全局浮动 Toast 通知
 */
function showToast(message, icon = 'fa-solid fa-circle-check text-success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 全局二次确认弹窗
 */
function showConfirmModal(titleHtml, bodyHtml, onConfirmCallback) {
    const linkModal = document.getElementById('link-action-modal');
    const modalTitle = document.getElementById('link-modal-title');
    const modalBody = document.getElementById('link-modal-body');
    const btnConfirm = document.getElementById('btn-confirm-link-action');

    if (!linkModal || !modalTitle || !modalBody || !btnConfirm) return;

    modalTitle.innerHTML = titleHtml;
    modalBody.innerHTML = bodyHtml;

    btnConfirm.onclick = function() {
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
        linkModal.classList.add('hidden');
    };

    linkModal.classList.remove('hidden');
}

/**
 * 标签页切换逻辑
 */
function initTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            if (targetTab) switchTab(targetTab);
        });
    });

    const btnCloseLink = document.getElementById('btn-close-link-modal');
    const btnCancelLink = document.getElementById('btn-cancel-link-modal');
    const linkModal = document.getElementById('link-action-modal');
    [btnCloseLink, btnCancelLink].forEach(btn => {
        if (btn && linkModal) btn.onclick = () => linkModal.classList.add('hidden');
    });
}

function switchTab(targetTabId) {
    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.tab-panel');

    navItems.forEach(n => n.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${targetTabId}"]`);
    const activePanel = document.getElementById(targetTabId);

    if (activeNav) activeNav.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    setTimeout(() => {
        if (targetTabId === 'tab-overview' && typeof updateDuPontGlobal === 'function') {
            updateDuPontGlobal();
        } else if (targetTabId === 'tab-sku-matrix' && typeof updateSKUMatrixGlobal === 'function') {
            updateSKUMatrixGlobal();
        } else if (targetTabId === 'tab-pricing' && typeof updatePricingGlobal === 'function') {
            updatePricingGlobal();
        } else if (targetTabId === 'tab-subsidy-ue' && typeof updateSubsidyUEGlobal === 'function') {
            updateSubsidyUEGlobal();
        }
        window.dispatchEvent(new Event('resize'));
    }, 40);
}

function initPRDV2Features() {
    const regionSelect = document.getElementById('navbar-region-select');
    const modeSelect = document.getElementById('cfg-data-refresh-mode');
    const t0Badge = document.getElementById('t0-status-badge');
    const t0Label = document.getElementById('t0-label');

    if (regionSelect) {
        regionSelect.onchange = function() {
            currentRegionFilter = regionSelect.value;
            const dataObj = waimaData.regionalKpi[currentRegionFilter] || waimaData.regionalKpi['ALL'];
            
            const labelNode = document.getElementById('quadrant-region-label');
            if (labelNode) labelNode.innerText = `${dataObj.region_name} 维度`;

            refreshOverviewKpisByRegion(dataObj);
            if (typeof updateSKUMatrixGlobal === 'function') updateSKUMatrixGlobal();
            showToast(`已切换至【${dataObj.region_name}】数据视图`);
        };
    }

    if (modeSelect) {
        modeSelect.onchange = function() {
            if (modeSelect.value === 'T0') {
                if (t0Label) t0Label.innerText = 'T+0 实时流: 16:00 (Flink)';
                if (t0Badge) t0Badge.classList.add('live-badge');
                showToast('已切换至 Flink T+0 小时级流计算模式');
            } else {
                if (t0Label) t0Label.innerText = 'T+1 批处理: 2026-08-14 (Hive)';
                if (t0Badge) t0Badge.classList.remove('live-badge');
                showToast('已切换至 Hive T+1 离线批处理模式');
            }
        };
    }
}

function refreshOverviewKpisByRegion(kpiData) {
    if (!kpiData) return;

    const cardTitleNode = document.getElementById('kpi-gmv-card-title');
    if (cardTitleNode) cardTitleNode.innerText = `16:00 准实时 GMV (${kpiData.region_name})`;

    const dupontTitleNode = document.getElementById('dupont-region-title');
    if (dupontTitleNode) dupontTitleNode.innerText = kpiData.region_name;

    const affectedRegionNode = document.getElementById('kpi-affected-region');
    if (affectedRegionNode) affectedRegionNode.innerText = kpiData.region_name;

    const gmvActualWan = (kpiData.gmv_actual / 10000.0).toFixed(1);
    const gmvTargetWan = (kpiData.gmv_target / 10000.0).toFixed(1);
    const gmvRate = ((kpiData.gmv_actual / kpiData.gmv_target) * 100).toFixed(1);

    const elGmv = document.getElementById('kpi-gmv');
    if (elGmv) elGmv.innerText = `¥${gmvActualWan}万`;
    
    const elGmvTarget = document.getElementById('kpi-gmv-target');
    if (elGmvTarget) elGmvTarget.innerText = `¥${gmvTargetWan}万`;
    
    const gmvRateNode = document.getElementById('kpi-gmv-rate');
    if (gmvRateNode) {
        gmvRateNode.innerText = `${gmvRate}%`;
        gmvRateNode.className = gmvRate < 50 ? 'text-warning' : 'text-success';
    }

    const elNightPeak = document.getElementById('kpi-night-peak-pct');
    if (elNightPeak) elNightPeak.innerText = `${kpiData.night_peak_est_pct}%`;

    const ordersActualWan = (kpiData.order_cnt_actual / 10000.0).toFixed(2);
    const ordersTargetWan = (kpiData.order_cnt_target / 10000.0).toFixed(2);
    const ordersRate = ((kpiData.order_cnt_actual / kpiData.order_cnt_target) * 100).toFixed(1);

    const elOrders = document.getElementById('kpi-orders');
    if (elOrders) elOrders.innerText = `${ordersActualWan}万单`;
    
    const elOrdersTarget = document.getElementById('kpi-orders-target');
    if (elOrdersTarget) elOrdersTarget.innerText = `${ordersTargetWan}万单`;
    
    const ordersRateNode = document.getElementById('kpi-orders-rate');
    if (ordersRateNode) {
        ordersRateNode.innerText = `${ordersRate}%`;
        ordersRateNode.className = ordersRate < 50 ? 'text-warning' : 'text-success';
    }

    const cvrPct = (kpiData.cvr_actual * 100).toFixed(2);
    const elCvr = document.getElementById('kpi-cvr');
    if (elCvr) elCvr.innerHTML = `${cvrPct}% <i class="fa-solid fa-triangle-exclamation text-warning"></i>`;
    
    const elAov = document.getElementById('kpi-aov-val');
    if (elAov) elAov.innerText = `¥${kpiData.aov_actual.toFixed(2)}`;

    const oosPct = (kpiData.oos_rate * 100).toFixed(2);
    const elOos = document.getElementById('kpi-oos');
    if (elOos) elOos.innerText = `${oosPct}%`;

    const oosLossWan = (kpiData.oos_loss_est / 10000.0).toFixed(1);
    const elOosLoss = document.getElementById('kpi-oos-loss');
    if (elOosLoss) elOosLoss.innerText = `¥${oosLossWan}万`;

    if (typeof updateDuPontGlobal === 'function') updateDuPontGlobal();
}

function initTargetModal() {
    const modal = document.getElementById('target-modal');
    const btnOpen = document.getElementById('btn-edit-target');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnSave = document.getElementById('btn-save-target');

    if (btnOpen && modal) btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    [btnClose, btnCancel].forEach(b => {
        if (b && modal) b.addEventListener('click', () => modal.classList.add('hidden'));
    });

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const newTargetGmv = parseFloat(document.getElementById('modal-gmv-input').value) || 300.0;
            const newTargetOrders = parseFloat(document.getElementById('modal-orders-input').value) || 2.5;

            showConfirmModal(
                `<i class="fa-solid fa-sliders text-warning"></i> 经营目标校准二次确认`,
                `<p>确认将月度 GMV 目标调整为 <strong>¥${newTargetGmv}万元</strong>、订单量目标调整为 <strong>${newTargetOrders}万单</strong>？此校准记录将记入 Audit Log 日志留痕。</p>`,
                function() {
                    const kpiObj = waimaData.regionalKpi[currentRegionFilter] || waimaData.regionalKpi['ALL'];
                    kpiObj.gmv_target = newTargetGmv * 10000.0;
                    kpiObj.order_cnt_target = newTargetOrders * 10000.0;

                    refreshOverviewKpisByRegion(kpiObj);
                    showToast('经营目标校准保存成功！Audit Log 已留痕。');
                    if (modal) modal.classList.add('hidden');
                }
            );
        });
    }
}

function initOverviewModule() {
    const sldTraffic = document.getElementById('sld-traffic-delta');
    const sldCvr = document.getElementById('sld-cvr-delta');
    const sldAov = document.getElementById('sld-aov-delta');
    const btnCopyReport = document.getElementById('btn-copy-daily-report');

    function updateDuPont() {
        if (!sldTraffic || !sldCvr || !sldAov) return;
        const tDelta = parseInt(sldTraffic.value);
        const cDeltaPct = parseFloat(sldCvr.value);
        const aDelta = parseFloat(sldAov.value);

        const currentKpi = waimaData.regionalKpi[currentRegionFilter] || waimaData.regionalKpi['ALL'];

        const elLblT = document.getElementById('lbl-traffic-delta');
        if (elLblT) elLblT.innerText = `${tDelta > 0 ? '+' : ''}${tDelta} UV`;
        
        const elLblC = document.getElementById('lbl-cvr-delta');
        if (elLblC) elLblC.innerText = `${cDeltaPct > 0 ? '+' : ''}${cDeltaPct.toFixed(2)} pt`;
        
        const elLblA = document.getElementById('lbl-aov-delta');
        if (elLblA) elLblA.innerText = `${aDelta > 0 ? '+' : ''}¥${aDelta.toFixed(1)}`;

        const res = waimaAlgorithms.calcDuPontAttribution(tDelta, cDeltaPct, aDelta, currentKpi);

        const elResT = document.getElementById('res-traffic-contrib');
        if (elResT) elResT.innerText = `${res.contribTrafficWan > 0 ? '+' : ''}¥${res.contribTrafficWan}万元`;
        
        const elResTPct = document.getElementById('res-traffic-pct');
        if (elResTPct) elResTPct.innerText = `${res.trafficPct}% 影响比`;

        const elResC = document.getElementById('res-cvr-contrib');
        if (elResC) elResC.innerText = `${res.contribCvrWan > 0 ? '+' : ''}¥${res.contribCvrWan}万元`;
        
        const elResCPct = document.getElementById('res-cvr-pct');
        if (elResCPct) elResCPct.innerText = `${res.cvrPct}% 影响比`;

        const elResA = document.getElementById('res-aov-contrib');
        if (elResA) elResA.innerText = `${res.contribAovWan > 0 ? '+' : ''}¥${res.contribAovWan}万元`;
        
        const elResAPct = document.getElementById('res-aov-pct');
        if (elResAPct) elResAPct.innerText = `${res.aovPct}% 影响比`;

        const elResTotal = document.getElementById('res-total-delta');
        if (elResTotal) elResTotal.innerText = `${res.totalDeltaWan > 0 ? '+' : ''}¥${res.totalDeltaWan}万元`;

        waimaCharts.renderDuPontChart(
            parseFloat(res.contribTrafficWan),
            parseFloat(res.contribCvrWan),
            parseFloat(res.contribAovWan),
            parseFloat(res.totalDeltaWan)
        );

        renderDailyReportMarkdown(res, currentKpi);
    }

    updateDuPontGlobal = updateDuPont;
    [sldTraffic, sldCvr, sldAov].forEach(s => {
        if (s) s.addEventListener('input', updateDuPont);
    });
    updateDuPont();
    renderOOSLossTable();

    if (btnCopyReport) {
        btnCopyReport.addEventListener('click', () => {
            const reportBox = document.getElementById('daily-report-markdown');
            if (reportBox) {
                navigator.clipboard.writeText(reportBox.innerText).then(() => {
                    showToast('📋 T+0 实时诊断简报已复制到剪贴板！可直接粘贴发飞书/微信群。');
                }).catch(() => {
                    showToast('📋 简报内容已准备就绪！');
                });
            }
        });
    }

    const btnCrossWarehouse = document.getElementById('btn-trigger-cross-warehouse');
    if (btnCrossWarehouse) {
        btnCrossWarehouse.addEventListener('click', () => {
            const profitCheck = waimaAlgorithms.calcCrossWarehouseProfitability(120, 5.0, 3.2, 25.0);

            showConfirmModal(
                `<i class="fa-solid fa-right-left text-primary"></i> 跨仓应急调拨派车确认 (含运费核算)`,
                `
                <div class="alert alert-warning mb-3">
                    <strong><i class="fa-solid fa-triangle-exclamation"></i> 采购风控提醒：请核对以下跨仓调拨派车明细与盈利性校验</strong>
                </div>
                <table class="data-table mb-2">
                    <tr><td><strong>调拨缺货商品</strong></td><td>青岛纯生 500ml*12 (SKU1001)</td></tr>
                    <tr><td><strong>调出前置仓 (富余)</strong></td><td>越秀前置仓 (5km内，现有库存 350 箱)</td></tr>
                    <tr><td><strong>调入前置仓 (缺货)</strong></td><td>天河前置仓 (急需补齐 120 箱)</td></tr>
                    <tr><td><strong>调度数量</strong></td><td><strong class="text-danger">120 箱</strong></td></tr>
                    <tr><td><strong>预计履约耗时</strong></td><td><strong class="text-success">45 分钟送到到位</strong></td></tr>
                    <tr><td><strong>调拨运费核算</strong></td><td>¥${profitCheck.transferFreight}</td></tr>
                    <tr><td><strong>挽回毛利与净收益</strong></td><td><strong class="text-success">挽回毛利 ¥${profitCheck.grossMargin} | 净贡献 +¥${profitCheck.netTransferProfit} (盈利调拨)</strong></td></tr>
                </table>
                <p class="text-muted small">确认无误后点击【确认下发】，系统将自动生成调拨策略单并带您跳转至 PDCA 策略追踪看板。</p>
                `,
                function() {
                    const newStrategy = {
                        id: `STR${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}${Math.floor(Math.random()*90+10)}`,
                        type: '跨仓应急急调',
                        operator: '李采销 (啤酒)',
                        status: '执行中',
                        expected: '天河仓【青岛纯生】调拨 120箱，预计45min补齐',
                        actual: '在途运输中，挽回GMV ¥2.4万 (运费¥25, 净利+¥191)',
                        lark: true
                    };

                    globalStrategyList.unshift(newStrategy);
                    renderStrategyTrackingTable();

                    showToast(`🚀 跨仓急调指令下发成功！派车单发往越秀仓 (策略ID: ${newStrategy.id})`);
                    switchTab('tab-strategy-tracking');
                }
            );
        });
    }
}

function renderDailyReportMarkdown(dupontRes, kpiData) {
    const box = document.getElementById('daily-report-markdown');
    if (!box) return;
    const gmvActualWan = (kpiData.gmv_actual / 10000.0).toFixed(1);
    const gmvTargetWan = (kpiData.gmv_target / 10000.0).toFixed(1);
    const rate = ((kpiData.gmv_actual / kpiData.gmv_target) * 100).toFixed(1);

    box.innerHTML = `
        <h3>📄 《歪马经营诊断》16:00 实时简报 (${kpiData.region_name})</h3>
        <ul>
            <li><strong>16:00 实时完成 GMV</strong>：¥${gmvActualWan}万（日目标 ¥${gmvTargetWan}万，当前进度 <strong>${rate}%</strong>）</li>
            <li><strong>🌙 夜间高峰预测 (18点-02点)</strong>：预计贡献全天 <strong>${kpiData.night_peak_est_pct}%</strong> 销量（前置仓骑手班次已就绪）</li>
            <li><strong>小时级 GMV 归因</strong>：累计变动 <strong>${dupontRes.totalDeltaWan} 万元</strong></li>
            <ul>
                <li>流量变动贡献：<strong>${dupontRes.contribTrafficWan} 万元</strong> (占比 ${dupontRes.trafficPct}%)</li>
                <li>转化率变动贡献：<strong>${dupontRes.contribCvrWan} 万元</strong> (占比 ${dupontRes.cvrPct}%)</li>
                <li>客单价变动贡献：<strong>${dupontRes.contribAovWan} 万元</strong> (占比 ${dupontRes.aovPct}%)</li>
                <li>品类结构效应 (Mix Shift)：<strong>${dupontRes.structureShiftWan} 万元</strong> (白酒与啤酒配比变动)</li>
            </ul>
            <li><strong>核心根因</strong>：受重点城市爆款缺货拖累。支持 <strong>⇄ 跨仓急调 (二次确认后下发，45分钟补齐)</strong>，无需漫长等待供应商送货。</li>
        </ul>
    `;
}

function renderOOSLossTable() {
    const tbody = document.querySelector('#table-oos-loss tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    waimaData.oosLossList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.stores} 家</td>
            <td>${item.hours} h</td>
            <td>${item.daily_sales} 件</td>
            <td><strong class="text-danger">¥${item.loss_gmv.toLocaleString()}</strong></td>
            <td>${item.supplier}</td>
            <td><span class="badge badge-warning">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function initSKUMatrixModule() {
    const sInput = document.getElementById('elim-sellthrough-input');
    const mInput = document.getElementById('elim-margin-input');
    const dInput = document.getElementById('elim-days-input');
    const btnRun = document.getElementById('btn-run-elimination');
    const btnExportExcel = document.getElementById('btn-export-elim-excel');

    const whTypeSelect = document.getElementById('warehouse-type-select');
    const whLimitInput = document.getElementById('wh-capacity-limit');
    const whCostInput = document.getElementById('wh-longtail-cost');

    if (whTypeSelect) {
        whTypeSelect.addEventListener('change', () => {
            const val = whTypeSelect.value;
            if (val === 'STANDARD') {
                if (whLimitInput) whLimitInput.value = 650;
                if (whCostInput) whCostInput.value = 210;
            } else if (val === 'SMALL') {
                if (whLimitInput) whLimitInput.value = 400;
                if (whCostInput) whCostInput.value = 260;
            } else if (val === 'FLAGSHIP') {
                if (whLimitInput) whLimitInput.value = 1000;
                if (whCostInput) whCostInput.value = 160;
            }
            updateSKUMatrix();
        });
    }

    [whLimitInput, whCostInput].forEach(inp => {
        if (inp) {
            inp.addEventListener('input', () => {
                if (whTypeSelect) whTypeSelect.value = 'CUSTOM';
                updateSKUMatrix();
            });
        }
    });

    function updateSKUMatrix() {
        const sellThroughThresh = sInput ? (parseFloat(sInput.value) || 0.05) : 0.05;
        const marginThresh = mInput ? (parseFloat(mInput.value) || 0.10) : 0.10;
        const daysThresh = dInput ? (parseInt(dInput.value) || 45) : 45;

        const res = waimaAlgorithms.calcSKUQuadrantAndElimination(
            waimaData.products,
            0.5,
            sellThroughThresh,
            marginThresh,
            daysThresh,
            'SUMMER',
            currentRegionFilter
        );

        const elCnt = document.getElementById('calc-elim-cnt');
        if (elCnt) elCnt.innerText = `${res.elimCount} 个`;
        
        const elFunds = document.getElementById('calc-elim-funds');
        if (elFunds) elFunds.innerText = `¥${res.releasedFundsWan} 万元`;

        waimaCharts.renderQuadrantChart(res.taggedProducts, res.salesP50, res.marginP50);
        renderEliminationTable(res.elimList);

        const whLimit = whLimitInput ? (parseInt(whLimitInput.value) || 650) : 650;
        const whCost = whCostInput ? (parseFloat(whCostInput.value) || 210) : 210;

        const optimalRes = waimaAlgorithms.calcOptimalSKUCount(1000, whCost, whLimit, currentRegionFilter);

        const elLimit = document.getElementById('wh-limit-val');
        if (elLimit) elLimit.innerText = `${whLimit} 个`;

        const elOpt = document.getElementById('optimal-sku-val');
        if (elOpt) elOpt.innerText = `${optimalRes.optimalSKUCount} 个`;

        const elSub = document.getElementById('optimal-sku-sub');
        if (elSub) elSub.innerText = `（边际毛利 = 边际长尾成本 ¥${whCost}/月）`;

        const elProfit = document.getElementById('optimal-profit-val');
        if (elProfit) elProfit.innerText = `¥${optimalRes.maxNetProfitWan} 万元/月`;

        waimaCharts.renderOptimalSKUChart(optimalRes.skuCurve, optimalRes.optimalSKUCount);
    }

    updateSKUMatrixGlobal = updateSKUMatrix;

    if (btnRun) {
        btnRun.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-calculator text-warning"></i> 运行汰换与容量算力引擎确认`,
                `<p>确认按 <strong>周转搁置 &ge; 45天、动销率 &lt; 5%、毛利率 &lt; 10%</strong> 规则运行筛选？（已开启 30天新品保护与季节需求豁免）</p>`,
                function() {
                    updateSKUMatrix();
                    showToast('汰换与容量算力引擎计算完成！推荐清退 SKU 清单已更新。');
                }
            );
        });
    }

    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-file-excel text-success"></i> 导出采销确认表确认`,
                `<p>确认导出建议汰换商品清单 (Excel 格式) 供品类采销协同例会审议？</p>`,
                function() {
                    showToast('《歪马送酒_商品汰换采销协同确认表.xlsx》导出成功！');
                }
            );
        });
    }

    [sInput, mInput, dInput].forEach(i => {
        if (i) i.addEventListener('input', updateSKUMatrix);
    });

    updateSKUMatrix();
}

function renderEliminationTable(elimList) {
    const tbody = document.querySelector('#table-elimination tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (elimList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">当前门槛下未筛选出需要汰换的商品。</td></tr>`;
        return;
    }

    elimList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.days_shelf} 天</td>
            <td>${(item.sell_through * 100).toFixed(1)}%</td>
            <td>${(item.margin * 100).toFixed(1)}%</td>
            <td><span class="tag tag-nurture">${item.role}</span></td>
            <td>¥${item.stock_funds}</td>
            <td><span class="badge ${item.status_note.includes('清退') ? 'badge-danger' : 'badge-success'}">${item.status_note}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function initSubsidyUEModule() {
    const roleSelect = document.getElementById('sub-role-select');
    const priceInput = document.getElementById('sub-unit-price');
    const costInput = document.getElementById('sub-unit-cost');

    const fInput = document.getElementById('ue-fulfillment-cost');
    const sInput = document.getElementById('ue-storage-cost');
    const cInput = document.getElementById('ue-city-cost');
    const pInput = document.getElementById('ue-coupon-cost');
    const btnExportUE = document.getElementById('btn-export-ue-excel');

    function getOptimalSubsidy(role, price) {
        if (role === '流量品') return price <= 100 ? 8.0 : Math.round(price * 0.11);
        if (role === '规模品') return Math.max(5.0, Math.round(price * 0.05));
        if (role === '培育品') return Math.max(4.0, Math.round(price * 0.10));
        return Math.max(3.0, Math.round(price * 0.025));
    }

    function updateSubsidyMarginalCurve() {
        const role = roleSelect ? roleSelect.value : '流量品';
        const price = priceInput ? (parseFloat(priceInput.value) || 68.0) : 68.0;
        const cost = costInput ? (parseFloat(costInput.value) || 44.5) : 44.5;

        let subsidyLevels = null;
        if (role === '流量品') {
            subsidyLevels = [0, 2, 4, 6, 8, 10, 12, 16];
        } else if (role === '规模品') {
            subsidyLevels = [0, 15, 30, 45, 55, 75, 100, 140];
        } else if (role === '培育品') {
            subsidyLevels = [0, 1, 2, 3, 4, 6, 8, 12];
        } else { // 利润品
            subsidyLevels = [0, 5, 10, 15, 25, 40, 60, 90];
        }

        const marginalData = waimaAlgorithms.calcSubsidyMarginalROI(role, 100, price, cost, subsidyLevels);
        waimaCharts.renderMarginalSubsidyChart(marginalData, role);

        const optSub = getOptimalSubsidy(role, price);

        const recNode = document.getElementById('marginal-sub-recommendation');
        if (recNode) {
            if (role === '流量品') {
                recNode.innerHTML = `💡 <strong>单品最优补贴测算【流量品 (青岛纯生/经典啤酒)】</strong>：单件补贴 <strong>¥${optSub.toFixed(2)}</strong> (占售价 ${(optSub/price*100).toFixed(1)}%) 时边际收益达到峰值（边际 ROI: <strong>2.85</strong>），已自动带入右侧全成本 UE 核算！`;
            } else if (role === '规模品') {
                recNode.innerHTML = `💡 <strong>单品最优补贴测算【规模品 (普五/剑南春)】</strong>：单件补贴 <strong>¥${optSub.toFixed(2)}</strong> (占售价 ${(optSub/price*100).toFixed(1)}%) 时增量转化最高（边际 ROI: <strong>1.95</strong>），已自动带入右侧全成本 UE 核算。`;
            } else if (role === '培育品') {
                recNode.innerHTML = `💡 <strong>单品最优补贴测算【培育品 (歪马精酿原浆新品)】</strong>：新品处于市场验证期，单件补贴 <strong>¥${optSub.toFixed(2)}</strong> (首单试饮立减)，配合 <strong>30天新品保护机制</strong> 快速冲量验证！`;
            } else {
                recNode.innerHTML = `💡 <strong>单品最优补贴测算【利润品 (奔富红酒/高档洋酒)】</strong>：用户对价格不敏感，单件补贴建议 <strong>&le; ¥${optSub.toFixed(2)}</strong> (占售价 &le;2.5%)，边际 ROI 为 <strong>0.85</strong>。若补贴继续加大将直接侵蚀净利！`;
            }
        }

        // 联动右侧基准信息（包含品类角色名称、进价与售价）与补贴输入框
        const elProductLabel = document.getElementById('ue-current-product-label');
        if (elProductLabel) {
            if (role === '流量品') elProductLabel.innerText = '【流量品 (青岛纯生/经典啤酒)】';
            else if (role === '规模品') elProductLabel.innerText = '【规模品 (普五/剑南春)】';
            else if (role === '培育品') elProductLabel.innerText = '【培育品 (歪马精酿原浆新品)】';
            else elProductLabel.innerText = '【利润品 (奔富407/高档洋酒)】';
        }

        const elCurrentPrice = document.getElementById('ue-current-price');
        const elCurrentCost = document.getElementById('ue-current-cost');
        const elSubSourceLabel = document.getElementById('ue-sub-source-label');
        if (elCurrentPrice) elCurrentPrice.innerText = `¥${price.toFixed(2)}`;
        if (elCurrentCost) elCurrentCost.innerText = `¥${cost.toFixed(2)}`;
        if (elSubSourceLabel) elSubSourceLabel.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 自动联动左侧最优补贴: ¥${optSub.toFixed(2)}`;
        if (pInput) pInput.value = optSub.toFixed(2);
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            if (roleSelect.value === '流量品') {
                if (priceInput) priceInput.value = 68.0;
                if (costInput) costInput.value = 44.5;
            } else if (roleSelect.value === '规模品') {
                if (priceInput) priceInput.value = 1099.0;
                if (costInput) costInput.value = 890.0;
            } else if (roleSelect.value === '培育品') {
                if (priceInput) priceInput.value = 38.0;
                if (costInput) costInput.value = 22.0;
            } else if (roleSelect.value === '利润品') {
                if (priceInput) priceInput.value = 580.0;
                if (costInput) costInput.value = 420.0;
            }
            updateSubsidyMarginalCurve();
            updateUECostCalculation();
        });
    }

    function updateUECostCalculation() {
        const price = priceInput ? (parseFloat(priceInput.value) || 68.0) : 68.0;
        const cost = costInput ? (parseFloat(costInput.value) || 44.5) : 44.5;

        const fCost = fInput ? (parseFloat(fInput.value) || 5.5) : 5.5;
        const sCost = sInput ? (parseFloat(sInput.value) || 1.8) : 1.8;
        const cCost = cInput ? (parseFloat(cInput.value) || 2.2) : 2.2;
        const pCost = pInput ? (parseFloat(pInput.value) || 0) : 0;

        const ueRes = waimaAlgorithms.calcFullyLoadedCostAndUE(price, cost, fCost, sCost, cCost, pCost);

        const elTotal = document.getElementById('ue-total-cost');
        if (elTotal) elTotal.innerText = `¥${ueRes.totalCost}`;

        const elNet = document.getElementById('ue-net-profit');
        if (elNet) {
            elNet.innerText = `¥${ueRes.netProfitAmt} (真实净利率 ${ueRes.netProfitPct}%)`;
            elNet.className = ueRes.isProfitable ? 'text-success font-weight-bold' : 'text-danger font-weight-bold';
        }
    }

    updateSubsidyUEGlobal = function() {
        updateSubsidyMarginalCurve();
        updateUECostCalculation();
    };

    [priceInput, costInput].forEach(el => {
        if (el) el.addEventListener('input', () => {
            updateSubsidyMarginalCurve();
            updateUECostCalculation();
        });
    });

    [fInput, sInput, cInput, pInput].forEach(el => {
        if (el) el.addEventListener('input', updateUECostCalculation);
    });

    if (btnExportUE) {
        btnExportUE.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-file-excel text-success"></i> 导出全成本 UE 表确认`,
                `<p>确认导出全品类单品精细化全成本 (Fully-Loaded UE) 诊断明细表？</p>`,
                function() {
                    showToast('《歪马送酒_全品类单品UE全成本诊断表.xlsx》导出成功！');
                }
            );
        });
    }

    updateSubsidyMarginalCurve();
    updateUECostCalculation();
    renderUETable();
}

function renderUETable() {
    const tbody = document.querySelector('#table-ue-costs tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    waimaData.products.forEach(p => {
        const ue = waimaAlgorithms.calcFullyLoadedCostAndUE(p.price, p.cost, 5.5, 1.8, 2.2, 2.0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>¥${p.price}</td>
            <td>¥${p.cost}</td>
            <td>¥${ue.fulfillmentCost}</td>
            <td>¥${ue.storageCost}</td>
            <td>¥${ue.cityOhCost}</td>
            <td>¥${ue.couponDiscount}</td>
            <td><strong class="${ue.isProfitable ? 'text-success' : 'text-danger'}">¥${ue.netProfitAmt}</strong></td>
            <td><strong>${ue.netProfitPct}%</strong></td>
            <td><span class="badge ${ue.isProfitable ? 'badge-success' : 'badge-danger'}">${ue.isProfitable ? '健康盈利' : 'UE倒挂亏损'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

let selectedProductObj = waimaData.products[7]; // 默认选中飞天茅台 (SKU1008)
let currentPricingCatFilter = 'ALL';
let currentPricingSearchKeyword = '';

function initPricingModule() {
    const btnTabSingle = document.getElementById('btn-tab-single-pricing');
    const btnTabBatch = document.getElementById('btn-tab-batch-pricing');
    const singleView = document.getElementById('pricing-single-view');
    const batchView = document.getElementById('pricing-batch-view');
    const btnRunBatch = document.getElementById('btn-run-batch-pricing');

    const searchInput = document.getElementById('pricing-sku-search-input');
    const dropdownMenu = document.getElementById('pricing-sku-dropdown-menu');
    const btnToggleDropdown = document.getElementById('btn-toggle-sku-dropdown');
    const cardContainer = document.getElementById('pricing-sku-card-container');
    const catPills = document.querySelectorAll('#pricing-cat-pills .sku-cat-pill');

    const mcInput = document.getElementById('pricing-mc-input');
    const brandMinInput = document.getElementById('pricing-brand-min-input');
    const btnAddCustomSku = document.getElementById('btn-add-custom-sku');

    // 1. 子标签切换
    if (btnTabSingle && btnTabBatch && singleView && batchView) {
        btnTabSingle.addEventListener('click', () => {
            btnTabSingle.classList.add('active');
            btnTabBatch.classList.remove('active');
            singleView.classList.remove('hidden');
            batchView.classList.add('hidden');
        });

        btnTabBatch.addEventListener('click', () => {
            btnTabBatch.classList.add('active');
            btnTabSingle.classList.remove('active');
            singleView.classList.add('hidden');
            batchView.classList.remove('hidden');
            renderBatchPricingTable();
        });
    }

    if (btnRunBatch) {
        btnRunBatch.addEventListener('click', () => {
            renderBatchPricingTable();
            showToast('全品类 Top 50 SKU 调价空间与品牌控价测算完成！');
        });
    }

    // 2. 渲染商品卡片列表
    function renderSkuCards() {
        if (!cardContainer) return;
        cardContainer.innerHTML = '';

        let list = waimaData.products;
        if (currentPricingCatFilter !== 'ALL') {
            list = list.filter(p => p.category.includes(currentPricingCatFilter));
        }
        if (currentPricingSearchKeyword) {
            const kw = currentPricingSearchKeyword.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw));
        }

        if (list.length === 0) {
            cardContainer.innerHTML = `<div class="p-3 text-center text-muted">未找到匹配的商品，可尝试其他关键词或点击上方【新增商品】</div>`;
            return;
        }

        list.forEach(p => {
            const isSelected = selectedProductObj && selectedProductObj.id === p.id;
            const item = document.createElement('div');
            item.className = `sku-card-item ${isSelected ? 'selected' : ''}`;
            item.setAttribute('data-id', p.id);

            let iconClass = 'fa-wine-bottle text-danger';
            if (p.category.includes('啤酒')) iconClass = 'fa-beer-mug-empty text-warning';
            else if (p.category.includes('白酒')) iconClass = 'fa-wine-bottle text-primary';
            else if (p.category.includes('红酒') || p.category.includes('葡萄酒')) iconClass = 'fa-wine-glass text-danger';

            item.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <div class="sku-thumb"><i class="fa-solid ${iconClass}"></i></div>
                    <div>
                        <strong>${p.name}</strong>
                        <div class="text-muted small">
                            SKU ID: <code>${p.id}</code> | 现价: <strong>¥${p.price}</strong> 
                            ${p.brand_min_price ? `<span class="badge badge-warning ml-1">限价¥${p.brand_min_price}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="small ${p.stock_qty > 20 ? 'text-success' : 'text-danger'}">库存: ${p.stock_qty}</div>
                    <div class="mt-1">
                        <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'} btn-select-sku-action" data-id="${p.id}">
                            ${isSelected ? '<i class="fa-solid fa-check"></i> 已选中' : '切换选择'}
                        </button>
                    </div>
                </div>
            `;

            item.addEventListener('click', (e) => {
                selectProduct(p);
            });

            cardContainer.appendChild(item);
        });
    }

    // 3. 选中某个产品并联动全盘计算
    function selectProduct(p) {
        selectedProductObj = p;
        if (mcInput) mcInput.value = p.cost;
        if (brandMinInput) brandMinInput.value = p.brand_min_price || 0;
        
        // 更新竞对监控卡片数据
        updateCompetitorMonitoring(p);
        updatePricing();
        renderSkuCards();
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        if (searchInput) searchInput.value = p.name;
        showToast(`已选中商品：${p.name} (SKU: ${p.id})`);
    }

    function updateCompetitorMonitoring(p) {
        const jiuxiaoerPrice = (p.price * 0.983).toFixed(1);
        const k1919Price = (p.price * 1.000).toFixed(1);
        const jiubianliPrice = (p.price * 1.015).toFixed(1);
        const avgComp = ((parseFloat(jiuxiaoerPrice) + parseFloat(k1919Price) + parseFloat(jiubianliPrice)) / 3.0).toFixed(1);

        // 更新上方 3 家垂直酒水即时零售竞对实时抓取数据行
        const elJxePrice = document.getElementById('comp-jiuxiaoer-price');
        const elJxeDiff = document.getElementById('comp-jiuxiaoer-diff');
        const elJxeBadge = document.getElementById('comp-jiuxiaoer-badge');
        if (elJxePrice) elJxePrice.innerText = `¥${jiuxiaoerPrice}`;
        if (elJxeDiff) elJxeDiff.innerText = `-1.7% 低于我方`;
        if (elJxeBadge) { elJxeBadge.className = 'badge badge-warning'; elJxeBadge.innerText = '预警区间'; }

        const el1919Price = document.getElementById('comp-1919-price');
        const el1919Diff = document.getElementById('comp-1919-diff');
        const el1919Badge = document.getElementById('comp-1919-badge');
        if (el1919Price) el1919Price.innerText = `¥${k1919Price}`;
        if (el1919Diff) el1919Diff.innerText = `0.0% 平价`;
        if (el1919Badge) { el1919Badge.className = 'badge badge-success'; el1919Badge.innerText = '安全保价'; }

        const elJblPrice = document.getElementById('comp-jiubianli-price');
        const elJblDiff = document.getElementById('comp-jiubianli-diff');
        const elJblBadge = document.getElementById('comp-jiubianli-badge');
        if (elJblPrice) elJblPrice.innerText = `¥${jiubianliPrice}`;
        if (elJblDiff) elJblDiff.innerText = `+1.5% 高于我方`;
        if (elJblBadge) { elJblBadge.className = 'badge badge-success'; elJblBadge.innerText = '优势区间'; }

        // 更新下方结论
        const monitorBox = document.getElementById('competitor-price-monitor-bar');
        if (monitorBox) {
            monitorBox.innerHTML = `
                <i class="fa-solid fa-circle-check text-success"></i> <strong>【${p.name}】酒水即时零售竞对监测结论</strong>：
                酒小二 <strong>¥${jiuxiaoerPrice}</strong> | 1919快喝 <strong>¥${k1919Price}</strong> | 酒便利 <strong>¥${jiubianliPrice}</strong>（加权均价 <strong>¥${avgComp}</strong>）。
                我方当前定价 ¥${p.price} 处于优势区间，${p.brand_min_price ? `受品牌最低限价 <strong>¥${p.brand_min_price}</strong> 保护约束。` : '无品牌限价限制。'}
            `;
        }
    }

    // 4. 搜索输入与即时下拉建议
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPricingSearchKeyword = searchInput.value.trim();
            renderSkuCards();
            renderSearchDropdown(currentPricingSearchKeyword);
        });

        searchInput.addEventListener('focus', () => {
            renderSearchDropdown(searchInput.value.trim());
        });
    }

    if (btnToggleDropdown) {
        btnToggleDropdown.addEventListener('click', () => {
            if (dropdownMenu) {
                if (dropdownMenu.classList.contains('hidden')) {
                    renderSearchDropdown(searchInput ? searchInput.value.trim() : '');
                } else {
                    dropdownMenu.classList.add('hidden');
                }
            }
        });
    }

    function renderSearchDropdown(kw) {
        if (!dropdownMenu) return;
        dropdownMenu.innerHTML = '';

        let matches = waimaData.products;
        if (kw) {
            const k = kw.toLowerCase();
            matches = matches.filter(p => p.name.toLowerCase().includes(k) || p.id.toLowerCase().includes(k));
        }

        if (matches.length === 0) {
            dropdownMenu.innerHTML = `<div class="p-2 text-center text-muted">未找到“${kw}”相关商品</div>`;
            dropdownMenu.classList.remove('hidden');
            return;
        }

        matches.forEach(p => {
            const isSelected = selectedProductObj && selectedProductObj.id === p.id;
            const node = document.createElement('div');
            node.className = `dropdown-item-node ${isSelected ? 'active' : ''}`;
            node.innerHTML = `
                <div>
                    <strong>${p.name}</strong> <code>${p.id}</code>
                    <div class="text-muted small">${p.category} | 售价: ¥${p.price} | 进价: ¥${p.cost}</div>
                </div>
                <div>
                    <span class="badge ${isSelected ? 'badge-success' : 'badge-info'}">${isSelected ? '当前选中' : '点击选择'}</span>
                </div>
            `;
            node.addEventListener('click', () => {
                selectProduct(p);
            });
            dropdownMenu.appendChild(node);
        });

        dropdownMenu.classList.remove('hidden');
    }

    // 点击页面空白处关闭下拉
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('sku-searchable-select');
        if (wrapper && !wrapper.contains(e.target) && dropdownMenu) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // 5. 分类筛选胶囊
    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentPricingCatFilter = pill.getAttribute('data-cat') || 'ALL';
            renderSkuCards();
        });
    });

    // 6. 新增自定义商品 Modal
    const skuModal = document.getElementById('custom-sku-modal');
    const btnCloseSkuModal = document.getElementById('btn-close-sku-modal');
    const btnCancelSkuModal = document.getElementById('btn-cancel-sku-modal');
    const btnSaveCustomSku = document.getElementById('btn-save-custom-sku');

    if (btnAddCustomSku && skuModal) {
        btnAddCustomSku.addEventListener('click', () => skuModal.classList.remove('hidden'));
    }
    [btnCloseSkuModal, btnCancelSkuModal].forEach(b => {
        if (b && skuModal) b.addEventListener('click', () => skuModal.classList.add('hidden'));
    });

    if (btnSaveCustomSku) {
        btnSaveCustomSku.addEventListener('click', () => {
            const name = document.getElementById('custom-sku-name').value.trim() || '自定义新增酒水';
            const cost = parseFloat(document.getElementById('custom-sku-cost').value) || 200;
            const brandMin = parseFloat(document.getElementById('custom-sku-brand-min').value) || 280;

            const newProduct = {
                id: `SKU${1000 + waimaData.products.length + 1}`,
                name: name,
                category: '自定义品类',
                price: Math.round(cost * 1.35),
                cost: cost,
                elasticity: -0.85,
                brand_min_price: brandMin,
                stock_qty: 50,
                sales_30d: 80,
                margin: (cost * 0.35) / (cost * 1.35),
                role: '利润品'
            };

            waimaData.products.unshift(newProduct);
            selectProduct(newProduct);
            if (skuModal) skuModal.classList.add('hidden');
            showToast(`✅ 新增商品【${name}】并已自动设为当前选中！`);
        });
    }

    // 7. 定价计算核心更新
    function updatePricing() {
        const mc = mcInput ? (parseFloat(mcInput.value) || selectedProductObj.cost) : selectedProductObj.cost;
        const brandMin = brandMinInput ? (parseFloat(brandMinInput.value) || selectedProductObj.brand_min_price || 0) : (selectedProductObj.brand_min_price || 0);
        const ed = selectedProductObj.elasticity || -0.40;

        const competitorPrice = (selectedProductObj.price * 0.98).toFixed(1);
        const res = waimaAlgorithms.calcPriceElasticityAndOptimal(ed, mc, parseFloat(competitorPrice), brandMin);

        // 更新 3-Tier 价格指示器
        const t1 = document.getElementById('tier1-price-val');
        const t2 = document.getElementById('tier2-price-val');
        const t3 = document.getElementById('tier3-price-val');

        if (t1) t1.innerText = `¥${res.pStarTheoretical}`;
        if (t2) t2.innerText = `¥${(parseFloat(competitorPrice) * 1.05).toFixed(1)}`;
        if (t3) t3.innerText = `¥${brandMin.toFixed(1)}`;

        const elEd = document.getElementById('res-ed-val');
        if (elEd) elEd.innerText = res.elasticity;
        
        const elPstar = document.getElementById('res-pstar-val');
        if (elPstar) elPstar.innerText = `¥${res.finalPrice}`;
        
        const elStrat = document.getElementById('res-pricing-strategy');
        if (elStrat) elStrat.innerText = res.strategy;

        waimaCharts.renderElasticityCurve(ed);
    }

    updatePricingGlobal = updatePricing;

    [mcInput, brandMinInput].forEach(i => {
        if (i) i.addEventListener('input', updatePricing);
    });

    // 初始化渲染卡片与当前茅台
    renderSkuCards();
    selectProduct(selectedProductObj);
}

function renderBatchPricingTable() {
    const tbody = document.querySelector('#table-batch-pricing tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const batchList = waimaData.products.map(p => {
        const res = waimaAlgorithms.calcPriceElasticityAndOptimal(p.elasticity, p.cost, p.price * 1.02, p.brand_min_price);
        const psm = waimaAlgorithms.calcSubsidyPSMAndRealROI(10, 1000, 45.0);

        return {
            ...p,
            pStar: res.finalPrice,
            constraintSource: res.constraintSource,
            realRoi: psm.realRoi,
            cannibalRate: psm.cannibalRate
        };
    });

    batchList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>¥${item.price}</td>
            <td>¥${item.cost}</td>
            <td>¥${item.brand_min_price || '无限价'}</td>
            <td><strong class="text-success">¥${item.pStar}</strong></td>
            <td><span class="badge ${item.constraintSource.includes('品牌') ? 'badge-danger' : 'badge-info'}">${item.constraintSource}</span></td>
            <td><span class="text-primary">${item.realRoi}</span></td>
            <td>
                <button class="btn btn-sm btn-outline btn-auto-exec" data-id="${item.id}">
                    <i class="fa-solid fa-paper-plane"></i> 推送营销
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-auto-exec').forEach(btn => {
        btn.addEventListener('click', () => {
            const skuId = btn.getAttribute('data-id');
            showConfirmModal(
                `<i class="fa-solid fa-paper-plane text-info"></i> 推送营销活动审批确认`,
                `<p>确认将 SKU <strong>[${skuId}]</strong> 的推荐调价策略方案推送下发至营销中心？</p>`,
                function() {
                    showToast(`SKU [${skuId}] 调价方案已成功下发至营销中心审批流！`);
                }
            );
        });
    });
}

function initSupplierModule() {
    const scoredSuppliers = waimaAlgorithms.calcSupplierScorecard(waimaData.suppliers);
    renderSupplierTable(scoredSuppliers);
    renderRopTriggersTable();

    document.querySelectorAll('.grade-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.grade-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const grade = btn.getAttribute('data-grade');
            if (grade === 'ALL') renderSupplierTable(scoredSuppliers);
            else renderSupplierTable(scoredSuppliers.filter(s => s.grade.includes(grade)));
        });
    });

    const btnCopyScript = document.getElementById('btn-copy-negotiation-script');
    if (btnCopyScript) {
        btnCopyScript.addEventListener('click', () => {
            showToast('📋 采销约谈话术与数据凭证已复制到剪贴板，可直接粘贴发往飞书/微信！');
        });
    }

    const btnExportROP = document.getElementById('btn-export-rop-list');
    if (btnExportROP) {
        btnExportROP.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-download text-primary"></i> 导出 ROP 紧急补货调拨单确认`,
                `<p>确认生成 14 个紧急缺货 SKU 调拨指令（涉及紧急调拨资金约 <strong>¥12.8万元</strong>），并导出 CSV 调拨单与同步写入 PDCA 策略追踪？</p>`,
                function() {
                    const newStrategy = {
                        id: `STR${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}${Math.floor(Math.random()*90+10)}`,
                        type: 'ROP 补货调拨',
                        operator: '张中台 (采销BP)',
                        status: '执行中',
                        expected: '全品类 14个爆款触发安全库存红线，加急调拨',
                        actual: '已下发华东/华南总仓调拨指令 (T+1回填中)',
                        lark: true
                    };

                    globalStrategyList.unshift(newStrategy);
                    renderStrategyTrackingTable();

                    showToast(`📦 ROP 补货调拨单已生成！已同步录入 PDCA 策略追踪 (策略ID: ${newStrategy.id})`);
                    switchTab('tab-strategy-tracking');
                }
            );
        });
    }
}

function renderSupplierTable(suppliers) {
    const tbody = document.querySelector('#table-supplier-score tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    suppliers.forEach(s => {
        let badgeClass = 'badge-success';
        if (s.grade.includes('B级')) badgeClass = 'badge-info';
        else if (s.grade.includes('C级')) badgeClass = 'badge-warning';
        else if (s.grade.includes('D级')) badgeClass = 'badge-danger';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${s.id}</code></td>
            <td><strong>${s.name}</strong></td>
            <td><span class="${s.oos_rate > 0.03 ? 'text-danger font-weight-bold' : ''}">${(s.oos_rate * 100).toFixed(1)}%</span></td>
            <td>${(s.ontime_rate * 100).toFixed(1)}%</td>
            <td>${s.price_premium > 0 ? '+' : ''}${(s.price_premium * 100).toFixed(1)}%</td>
            <td>${(s.defect_rate * 100).toFixed(1)}%</td>
            <td>${s.respond_hours}h</td>
            <td><strong>${s.totalScore}分</strong></td>
            <td><span class="badge ${badgeClass}">${s.grade}</span></td>
            <td><button class="btn btn-sm btn-outline btn-gen-neg" data-id="${s.id}"><i class="fa-solid fa-file-invoice"></i> 约谈凭证</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-gen-neg').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const supId = btn.getAttribute('data-id');
            const supObj = suppliers.find(s => s.id === supId) || suppliers[0];
            const negBox = document.getElementById('negotiation-card');
            
            if (negBox) {
                negBox.innerHTML = `
                    <div class="alert alert-warning p-2 mb-2">
                        <strong><i class="fa-solid fa-triangle-exclamation"></i> 约谈凭证 (${supObj.name} - ${supObj.grade})</strong>
                    </div>
                    <ul style="padding-left: 16px; font-size: 11px; line-height: 1.6;">
                        <li><strong>缺货率/履约权重点</strong>：缺货率 <strong>${(supObj.oos_rate * 100).toFixed(1)}%</strong>（30分权重扣分项），到货及时率 <strong>${(supObj.ontime_rate * 100).toFixed(1)}%</strong></li>
                        <li><strong>进货溢价率</strong>：高于市场均价 <strong>${(supObj.price_premium * 100).toFixed(1)}%</strong></li>
                        <li><strong>约谈话术依据</strong>：“基于歪马中台 100 分制履约评分卡，贵司综合得分 <strong>${supObj.totalScore} 分</strong>。缺货率直接冲击歪马15分钟履约底线，请在3个工作日内整改保供率，否则触发备选供应商分流。”</li>
                    </ul>
                `;
                showToast(`已生成 ${supObj.name} 绩效约谈话术凭证`);
            }
        });
    });
}

function renderRopTriggersTable() {
    const tbody = document.querySelector('#table-rop-triggers tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const ropList = [
        { id: 'SKU1001', name: '青岛纯生500ml*12', warehouse: '天河前置仓', stock: 12, rop: 50, gap: 38, supplier: '华东啤酒一级直供商', method: '5km 姐妹仓应急急调', status: '🔴 严重缺货' },
        { id: 'SKU1002', name: '经典雪花500ml*12', warehouse: '越秀前置仓', stock: 8, rop: 40, gap: 32, supplier: '华东啤酒一级直供商', method: '5km 姐妹仓应急急调', status: '🔴 严重缺货' },
        { id: 'SKU1008', name: '飞天茅台53% 500ml', warehouse: '天河前置仓', stock: 2, rop: 10, gap: 8, supplier: '贵州酱酒特许直供', method: '跨仓绿色调拨通道', status: '🔴 紧急断货' },
        { id: 'SKU1003', name: '普五52度500ml', warehouse: '陆家嘴前置仓', stock: 5, rop: 25, gap: 20, supplier: '四川名酒综合供应链', method: '区域总仓 ROP 加急大货', status: '🟡 临界预警' },
        { id: 'SKU1004', name: '水晶剑52度500ml', warehouse: '静安前置仓', stock: 6, rop: 20, gap: 14, supplier: '四川名酒综合供应链', method: '区域总仓 ROP 加急大货', status: '🟡 临界预警' },
        { id: 'SKU1009', name: '奔富Bin407 750ml', warehouse: '武侯前置仓', stock: 4, rop: 15, gap: 11, supplier: '保税区进口酒业代理', method: '约谈供应商催发在途', status: '🔴 供应商逾期' }
    ];

    ropList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${item.id}</code></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.warehouse}</td>
            <td><span class="text-danger font-weight-bold">${item.stock}</span></td>
            <td>${item.rop}</td>
            <td><strong class="text-primary">+${item.gap}</strong></td>
            <td>${item.supplier}</td>
            <td><span class="tag tag-scale">${item.method}</span></td>
            <td><span class="badge ${item.status.includes('严重') || item.status.includes('紧急') || item.status.includes('逾期') ? 'badge-danger' : 'badge-warning'}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline btn-trigger-single-rop" data-id="${item.id}" data-name="${item.name}">
                    <i class="fa-solid fa-truck-fast"></i> 发起急调
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-trigger-single-rop').forEach(btn => {
        btn.addEventListener('click', () => {
            const skuId = btn.getAttribute('data-id');
            const skuName = btn.getAttribute('data-name');
            showConfirmModal(
                `<i class="fa-solid fa-truck-fast text-warning"></i> 发起跨仓/总仓加急补货指令`,
                `<p>确认针对商品 <strong>[${skuId}] ${skuName}</strong> 立即下发跨仓加急补货调拨指令？预计 45 分钟内完成姐妹仓出库发车。</p>`,
                function() {
                    showToast(`✅ [${skuId}] ${skuName} 跨仓应急调拨指令下发成功！运力调度已锁定。`);
                }
            );
        });
    });
}

function initStrategyTrackingModule() {
    renderStrategyTrackingTable();

    const btnRefresh = document.getElementById('btn-refresh-tracking');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            renderStrategyTrackingTable();
            showToast('策略执行状态与 T+3 回填数据已刷新！');
        });
    }
}

function renderStrategyTrackingTable() {
    const tbody = document.querySelector('#table-strategy-tracking tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    globalStrategyList.forEach(item => {
        let badgeClass = 'badge-warning';
        if (item.status === '已完成') badgeClass = 'badge-success';
        else if (item.status === '执行中') badgeClass = 'badge-info';
        else if (item.status === '延期告警') badgeClass = 'badge-danger';

        let typeBadgeClass = 'tag-scale';
        if (item.type.includes('急调') || item.type.includes('补货')) typeBadgeClass = 'tag-flow';
        else if (item.type.includes('汰换')) typeBadgeClass = 'tag-profit';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${item.id}</code></td>
            <td><span class="tag ${typeBadgeClass}">${item.type}</span></td>
            <td><i class="fa-solid fa-user-tie text-muted"></i> ${item.operator}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>${item.expected}</td>
            <td><strong class="text-dark">${item.actual}</strong></td>
            <td>
                <span class="badge ${item.lark ? 'badge-success' : 'badge-warning'}">${item.lark ? '🔔 24h 监控中' : '⚪ 未开启'}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline btn-detail-strat" data-id="${item.id}">详情</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-detail-strat').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = globalStrategyList.find(d => d.id === id);
            if (item) {
                showConfirmModal(
                    `<i class="fa-solid fa-file-lines text-primary"></i> 策略执行明细与闭环效果 (${item.id})`,
                    `
                    <table class="data-table mb-2">
                        <tr><td><strong>策略类型</strong></td><td>${item.type}</td></tr>
                        <tr><td><strong>责任人</strong></td><td>${item.operator}</td></tr>
                        <tr><td><strong>当前状态</strong></td><td><span class="badge badge-info">${item.status}</span></td></tr>
                        <tr><td><strong>预期业务目标</strong></td><td>${item.expected}</td></tr>
                        <tr><td><strong>实际达成效果</strong></td><td><strong class="text-success">${item.actual}</strong></td></tr>
                        <tr><td><strong>飞书协同</strong></td><td>${item.lark ? '已接入 24h 自动催办提醒' : '无'}</td></tr>
                    </table>
                    <p class="text-muted small">所有策略流转数据均通过数仓 DWS/DIM 层沉淀，支持 T+3 经营效果定量回填复盘。</p>
                    `,
                    function() {}
                );
            }
        });
    });
}

function initCrossModuleLinkage() {
    const btnLink1 = document.getElementById('btn-trigger-link-m1-m4');
    const btnLink2 = document.getElementById('btn-trigger-link-m2-m3');
    const btnEmergency = document.getElementById('btn-handle-emergency');

    if (btnEmergency) {
        btnEmergency.addEventListener('click', () => {
            switchTab('tab-overview');
            const btnCrossWarehouse = document.getElementById('btn-trigger-cross-warehouse');
            if (btnCrossWarehouse) btnCrossWarehouse.click();
        });
    }

    if (btnLink1) {
        btnLink1.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-bolt text-warning"></i> 归因 &rarr; 补货跨模块联动确认`,
                `<p>确认提取 Top 10 缺货 SKU 清单，自动携带参数并平滑跳转至【模块四：供应商 100分评分与 ROP】？</p>`,
                function() { 
                    switchTab('tab-supplier'); 
                    showToast('🔗 已联动携带 Top 10 缺货商品数据进入模块四 (ROP补货)！');
                }
            );
        });
    }

    if (btnLink2) {
        btnLink2.addEventListener('click', () => {
            showConfirmModal(
                `<i class="fa-solid fa-right-left text-primary"></i> 汰换 &rarr; 预算重分配联动确认`,
                `<p>确认将出清释放的 <strong>¥16.2 万元资金</strong> 自动注入【模块六：补贴效率与全成本 UE】进行边际 ROI 优化？</p>`,
                function() { 
                    switchTab('tab-subsidy-ue'); 
                    showToast('🔗 已将汰换释放的 ¥16.2 万元注入补贴池进行边际 ROI 优化！');
                }
            );
        });
    }
}

function initGlobalFloatingAI() {
    const trigger = document.getElementById('floating-ai-trigger');
    if (trigger) {
        trigger.addEventListener('click', () => {
            switchTab('tab-ai-copilot');
            showToast('✨ 已打开采销中台 AI Copilot 智能助手中枢！');
        });
    }
}

function initAICopilotModule() {
    const chips = document.querySelectorAll('.prompt-chips .chip');
    const input = document.getElementById('ai-input-text');
    const btnSubmit = document.getElementById('btn-submit-ai');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (input) input.value = promptText;
            runAICopilot(promptText);
        });
    });

    if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            const text = input ? input.value.trim() : '';
            if (text) runAICopilot(text);
        });
    }
}

function runAICopilot(promptText) {
    const sqlBox = document.getElementById('copilot-sql');
    const pyBox = document.getElementById('copilot-python');
    const briefBox = document.getElementById('copilot-brief');

    if (!sqlBox || !pyBox || !briefBox) return;

    let template = waimaCodeTemplates.aiPrompts['🍺 华东区啤酒缺货分析与约谈'];
    if (promptText.includes('误伤') || promptText.includes('补贴')) template = waimaCodeTemplates.aiPrompts['🎟️ 识别高误伤补贴活动'];
    else if (promptText.includes('淘汰') || promptText.includes('SKU') || promptText.includes('资金')) template = waimaCodeTemplates.aiPrompts['✂️ 计算推荐淘汰SKU与资金'];

    sqlBox.innerText = '-- Hive SQL 查询脚本\n' + template.sql;
    pyBox.innerText = '# Python 归因与可视化分析\n' + template.python;
    briefBox.innerHTML = template.brief;
    showToast('✨ AI 算法模型与分析代码已自动生成完毕！');
}

function initCodeAccordions() {
    document.querySelectorAll('.code-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const body = header.nextElementSibling;
            if (body) body.classList.toggle('hidden');
        });
    });
}

function initManualModal() {
    const btnOpen = document.getElementById('btn-open-manual-modal');
    const modal = document.getElementById('workbench-manual-modal');
    const btnClose = document.getElementById('btn-close-manual-modal');
    const btnGotIt = document.getElementById('btn-got-it-manual');

    const btnTabWorkflow = document.getElementById('btn-tab-manual-workflow');
    const btnTabModules = document.getElementById('btn-tab-manual-modules');
    const btnTabFaq = document.getElementById('btn-tab-manual-faq');

    const contentWorkflow = document.getElementById('manual-content-workflow');
    const contentModules = document.getElementById('manual-content-modules');
    const contentFaq = document.getElementById('manual-content-faq');

    if (btnOpen && modal) {
        btnOpen.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    [btnClose, btnGotIt].forEach(btn => {
        if (btn && modal) {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
    });

    if (btnTabWorkflow && btnTabModules && btnTabFaq) {
        btnTabWorkflow.addEventListener('click', () => {
            btnTabWorkflow.classList.add('active');
            btnTabModules.classList.remove('active');
            btnTabFaq.classList.remove('active');
            if (contentWorkflow) contentWorkflow.classList.remove('hidden');
            if (contentModules) contentModules.classList.add('hidden');
            if (contentFaq) contentFaq.classList.add('hidden');
        });

        btnTabModules.addEventListener('click', () => {
            btnTabModules.classList.add('active');
            btnTabWorkflow.classList.remove('active');
            btnTabFaq.classList.remove('active');
            if (contentModules) contentModules.classList.remove('hidden');
            if (contentWorkflow) contentWorkflow.classList.add('hidden');
            if (contentFaq) contentFaq.classList.add('hidden');
        });

        btnTabFaq.addEventListener('click', () => {
            btnTabFaq.classList.add('active');
            btnTabWorkflow.classList.remove('active');
            btnTabModules.classList.remove('active');
            if (contentFaq) contentFaq.classList.remove('hidden');
            if (contentWorkflow) contentWorkflow.classList.add('hidden');
            if (contentModules) contentModules.classList.add('hidden');
        });
    }
}

