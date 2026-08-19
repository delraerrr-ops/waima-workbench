/* ==========================================================================
   美团歪马送酒 · 采销中台 Mock 核心数据集 (Waima Data Mock - 真实时间与区域切分版)
   ========================================================================== */

const waimaData = {
    // 按区域切分的真实 16:00 准实时 KPI 数据集 (歪马夜间订单占比68%-70%，16:00进度约为全天 30%~36%)
    regionalKpi: {
        'ALL': {
            region_name: '全国大盘',
            gmv_actual: 1025000,          // 16:00 实时完成 102.5 万 (34.2%)
            gmv_target: 3000000,          // 全天目标 300 万
            prev_gmv: 1100000,
            order_cnt_actual: 8660,       // 16:00 实时 0.86 万单
            order_cnt_target: 25000,
            cvr_actual: 0.0482,
            cvr_target: 0.0500,
            prev_cvr: 0.0512,
            aov_actual: 118.36,
            prev_aov: 119.75,
            prev_traffic: 22000,
            oos_rate: 0.032,
            night_peak_est_pct: 68.5,     // 夜间高峰(18点-02点)预计贡献 68.5%
            oos_loss_est: 285000
        },
        'EAST': {
            region_name: '华东大区 (上海/杭州)',
            gmv_actual: 384000,           // 16:00 完成 38.4 万 (36.6%)
            gmv_target: 1050000,
            prev_gmv: 410000,
            order_cnt_actual: 2704,
            order_cnt_target: 7500,
            cvr_actual: 0.0510,
            cvr_target: 0.0520,
            prev_cvr: 0.0535,
            aov_actual: 142.00,           // 华东客单价高
            prev_aov: 145.00,
            prev_traffic: 8000,
            oos_rate: 0.025,
            night_peak_est_pct: 65.0,
            oos_loss_est: 92000
        },
        'SOUTH': {
            region_name: '华南大区 (广州/深圳)',
            gmv_actual: 321000,           // 16:00 完成 32.1 万 (32.1%)
            gmv_target: 1000000,
            prev_gmv: 350000,
            order_cnt_actual: 1905,
            order_cnt_target: 6500,
            cvr_actual: 0.0435,
            cvr_target: 0.0480,
            prev_cvr: 0.0470,
            aov_actual: 168.50,           // 华南洋酒/高毛利白酒偏好
            prev_aov: 172.00,
            prev_traffic: 7500,
            oos_rate: 0.041,              // 华南缺货率稍高
            night_peak_est_pct: 72.0,     // 华南夜生活夜间占比 72%
            oos_loss_est: 115000
        },
        'NORTHEAST': {
            region_name: '东北大区 (沈阳/哈尔滨)',
            gmv_actual: 185000,           // 16:00 完成 18.5 万 (37.0%)
            gmv_target: 500000,
            prev_gmv: 195000,
            order_cnt_actual: 3189,
            order_cnt_target: 7000,
            cvr_actual: 0.0540,
            cvr_target: 0.0550,
            prev_cvr: 0.0560,
            aov_actual: 58.00,            // 东北水啤高动销、低客单
            prev_aov: 60.00,
            prev_traffic: 4500,
            oos_rate: 0.021,
            night_peak_est_pct: 66.0,
            oos_loss_est: 42000
        },
        'SOUTHWEST': {
            region_name: '西南大区 (成都/重庆)',
            gmv_actual: 135000,           // 16:00 完成 13.5 万 (33.8%)
            gmv_target: 400000,
            prev_gmv: 145000,
            order_cnt_actual: 1534,
            order_cnt_target: 4000,
            cvr_actual: 0.0490,
            cvr_target: 0.0500,
            prev_cvr: 0.0510,
            aov_actual: 88.00,
            prev_aov: 90.00,
            prev_traffic: 3200,
            oos_rate: 0.028,
            night_peak_est_pct: 70.0,
            oos_loss_est: 36000
        }
    },

    // 快捷访问默认取 ALL
    get kpi() {
        return this.regionalKpi['ALL'];
    },

    // 2000+ 支撑库全结构代表性商品 (包含规模/流量/利润/培育/新品保护/季节豁免/待汰换品)
    products: [
        { id: 'SKU1001', name: '青岛纯生500ml*12', category: '啤酒', price: 68.0, cost: 44.5, brand_min_price: 0, sales_30d: 48500, margin: 0.345, days_shelf: 240, sell_through: 0.85, stock_qty: 120, supplier_id: 'SUP001', elasticity: -2.3, is_seasonal: true },
        { id: 'SKU1002', name: '经典雪花500ml*12', category: '啤酒', price: 48.0, cost: 32.0, brand_min_price: 0, sales_30d: 42000, margin: 0.333, days_shelf: 310, sell_through: 0.92, stock_qty: 85, supplier_id: 'SUP001', elasticity: -2.1, is_seasonal: false },
        { id: 'SKU1003', name: '普五52度500ml', category: '白酒', price: 1099.0, cost: 890.0, brand_min_price: 999.0, sales_30d: 68000, margin: 0.190, days_shelf: 400, sell_through: 0.65, stock_qty: 40, supplier_id: 'SUP002', elasticity: -0.85, is_seasonal: false },
        { id: 'SKU1004', name: '水晶剑52度500ml', category: '白酒', price: 489.0, cost: 360.0, brand_min_price: 439.0, sales_30d: 38000, margin: 0.264, days_shelf: 180, sell_through: 0.78, stock_qty: 60, supplier_id: 'SUP002', elasticity: -0.92, is_seasonal: false },
        { id: 'SKU1005', name: '拉菲传奇红葡萄酒', category: '红酒', price: 98.0, cost: 58.0, brand_min_price: 78.0, sales_30d: 12500, margin: 0.408, days_shelf: 150, sell_through: 0.45, stock_qty: 210, supplier_id: 'SUP003', elasticity: -1.4, is_seasonal: false },
        { id: 'SKU1006', name: '野格圣鹿700ml', category: '洋酒', price: 148.0, cost: 95.0, brand_min_price: 128.0, sales_30d: 22000, margin: 0.358, days_shelf: 210, sell_through: 0.60, stock_qty: 150, supplier_id: 'SUP004', elasticity: -1.6, is_seasonal: false },
        { id: 'SKU1007', name: '百威金尊500ml*12', category: '啤酒', price: 88.0, cost: 62.0, brand_min_price: 0, sales_30d: 31000, margin: 0.295, days_shelf: 95, sell_through: 0.72, stock_qty: 180, supplier_id: 'SUP001', elasticity: -2.0, is_seasonal: false },
        { id: 'SKU1008', name: '飞天茅台53度500ml', category: '白酒', price: 2899.0, cost: 2100.0, brand_min_price: 2499.0, sales_30d: 145000, margin: 0.276, days_shelf: 600, sell_through: 0.99, stock_qty: 10, supplier_id: 'SUP002', elasticity: -0.4, is_seasonal: false },
        { id: 'SKU1009', name: '哈尔滨特醇330ml', category: '啤酒', price: 30.0, cost: 27.0, brand_min_price: 0, sales_30d: 3200, margin: 0.100, days_shelf: 120, sell_through: 0.04, stock_qty: 540, supplier_id: 'SUP001', elasticity: -1.9, is_seasonal: false },
        { id: 'SKU1010', name: '奔富BIN407红葡萄酒', category: '红酒', price: 850.0, cost: 620.0, brand_min_price: 750.0, sales_30d: 18000, margin: 0.270, days_shelf: 220, sell_through: 0.50, stock_qty: 35, supplier_id: 'SUP003', elasticity: -1.1, is_seasonal: false },
        // 🛡️ 30天新品保护 SKU
        { id: 'SKU1011', name: '歪马精酿原浆IPA (2026夏季新品)', category: '啤酒', price: 38.0, cost: 22.0, brand_min_price: 0, sales_30d: 4200, margin: 0.421, days_shelf: 14, sell_through: 0.18, stock_qty: 160, supplier_id: 'SUP001', elasticity: -2.2, is_seasonal: false },
        // 滞销待汰换 SKU
        { id: 'SKU1012', name: '老坛谷物小曲烧酒500ml', category: '白酒', price: 25.0, cost: 23.0, brand_min_price: 0, sales_30d: 1800, margin: 0.080, days_shelf: 160, sell_through: 0.03, stock_qty: 480, supplier_id: 'SUP002', elasticity: -1.2, is_seasonal: false },
        { id: 'SKU1013', name: '智利散装低度甜白葡萄酒', category: '红酒', price: 39.0, cost: 36.0, brand_min_price: 0, sales_30d: 1200, margin: 0.077, days_shelf: 140, sell_through: 0.025, stock_qty: 320, supplier_id: 'SUP003', elasticity: -1.5, is_seasonal: false },
        { id: 'SKU1014', name: '过季桂花清米酒300ml', category: '红酒', price: 18.0, cost: 16.5, brand_min_price: 0, sales_30d: 950, margin: 0.083, days_shelf: 190, sell_through: 0.018, stock_qty: 600, supplier_id: 'SUP004', elasticity: -1.8, is_seasonal: false }
    ],

    oosLossList: [
        { id: 'SKU1001', name: '青岛纯生500ml*12', category: '啤酒', stores: 18, hours: 42, daily_sales: 320, loss_gmv: 45680, supplier: '华润/青岛一级代理', status: '严重缺货' },
        { id: 'SKU1003', name: '普五52度500ml', category: '白酒', stores: 6, hours: 28, daily_sales: 15, loss_gmv: 32970, supplier: '宜宾五粮液专供', status: '偏紧' },
        { id: 'SKU1002', name: '经典雪花500ml*12', category: '啤酒', stores: 12, hours: 36, daily_sales: 280, loss_gmv: 26880, supplier: '华润/青岛一级代理', status: '断货中' },
        { id: 'SKU1004', name: '水晶剑52度500ml', category: '白酒', stores: 4, hours: 16, daily_sales: 22, loss_gmv: 17210, supplier: '剑南春直供社', status: '预警' }
    ],

    suppliers: [
        { id: 'SUP001', name: '华东啤酒一级直供商', price_premium: -0.02, oos_rate: 0.015, ontime_rate: 0.98, defect_rate: 0.005, respond_hours: 1.2 },
        { id: 'SUP002', name: '四川名酒综合供应链', price_premium: 0.01, oos_rate: 0.022, ontime_rate: 0.94, defect_rate: 0.008, respond_hours: 1.8 },
        { id: 'SUP003', name: '保税区进口酒业代理', price_premium: 0.045, oos_rate: 0.048, ontime_rate: 0.89, defect_rate: 0.022, respond_hours: 4.5 },
        { id: 'SUP004', name: '华南洋酒专供联合体', price_premium: 0.062, oos_rate: 0.055, ontime_rate: 0.86, defect_rate: 0.028, respond_hours: 6.0 }
    ],

    strategyList: [
        { id: 'STR2026081401', type: '紧急补货', module: '模块一归因联动', time: '2026-08-14 09:15', status: '执行中', operator: '王采销 (华东)', duration: '0.5h', expected: '恢复 CVR +0.3pt, 挽回 GMV 4.5万', actual: '已跟进发货 (T+1回填)', rate: '100%', isEffective: true },
        { id: 'STR2026081402', type: 'SKU 汰换', module: '模块二四象限', time: '2026-08-14 10:30', status: '待确认', operator: '张中台 (品类经理)', duration: '未确认', expected: '清退 42SKU, 释放资金 18.6万', actual: '-', rate: '0%', isEffective: false },
        { id: 'STR2026081403', type: '自动调价', module: '模块三批量算力', time: '2026-08-14 11:00', status: '执行中', operator: '系统自动执行', duration: '0.1h', expected: '净利润 +¥6,800', actual: '日净利润 +¥7,120', rate: '104.7%', isEffective: true },
        { id: 'STR2026081404', type: '供应商约谈', module: '模块四评分卡', time: '2026-08-13 16:45', status: '已完成', operator: '李采销 (白酒)', duration: '1.2h', expected: '降价 5%, 保供 98%', actual: '签署保供补充协议', rate: '100%', isEffective: true }
    ]
};
