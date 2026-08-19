/* ==========================================================================
   美团歪马送酒 · 采销中台代码与 AI 智能 Prompt 模板库 (Code & AI Templates)
   ========================================================================== */

const waimaCodeTemplates = {
    // 预设 AI 智能分析 Prompt 对应的流式输出内容
    aiPrompts: {
        '🍺 华东区啤酒缺货分析与约谈': {
            sql: `-- 1. 查询华东区近 7 天啤酒品类缺货明细与损失订单
SELECT 
    p.product_id, p.product_name, s.supplier_name,
    COUNT(DISTINCT i.store_id) AS oos_stores,
    SUM(o.quantity) AS lost_qty,
    SUM(o.pay_amount) AS lost_gmv
FROM dwd_inventory i
JOIN dim_product p ON i.product_id = p.product_id
JOIN dim_supplier s ON p.supplier_id = s.supplier_id
LEFT JOIN dwd_order_detail o ON p.product_id = o.product_id
WHERE i.stock_quantity = 0 AND p.category_id = 'BEER_01' AND i.city_id IN ('310000', '320100')
GROUP BY p.product_id, p.product_name, s.supplier_name
ORDER BY lost_gmv DESC;`,
            python: `# 2. Python 归因分析与供应商溢价率计算
import pandas as pd
df_oos = pd.DataFrame([
    {'sku': 'SKU1001', 'name': '青岛纯生 500ml', 'lost_gmv': 62640, 'supplier': '华润青岛一级代理'},
    {'sku': 'SKU1002', 'name': '经典雪花 500ml', 'lost_gmv': 42000, 'supplier': '雪花啤酒直供商'}
])
total_loss = df_oos['lost_gmv'].sum()
print(f"华东啤酒缺货合计预估损失 GMV: {total_loss:,.2f} 元")`,
            brief: `## 📋 采销中台决策简报与约谈指令 (2026-08-14)
- **发现问题**：华东区啤酒缺货率飙升至 **6.2%**（超过警戒线 5%），导致日均损失 GMV 约 **¥10.46万元**。
- **归因定位**：主要集中在 **青岛纯生 500ml** 与 **经典雪花 500ml**，主因是供应商 *华润青岛一级代理* 近期配额调拨延迟。
- **采销执行指令**：
  1. 请华东采销 BP 于今日 17:00 前约谈供应商，要求调拨 **1500 箱** 紧急到仓；
  2. 若明日 10:00 前未补齐，启动 B 级替换预案，临时上线替代 SKU 挽回损失。`
        },

        '🎟️ 识别高误伤补贴活动': {
            sql: `-- 查询过去 30 天误伤率 > 40% 的高风险营销活动
SELECT 
    p.promotion_id, p.promotion_name, p.budget,
    COUNT(DISTINCT o.order_id) AS sub_orders,
    SUM(o.discount_amount) AS discount_cost,
    SUM(o.pay_amount) AS sub_gmv
FROM dwd_promotion p
JOIN dwd_order_detail o ON p.product_id = o.product_id
WHERE o.discount_amount > 0 AND p.dt >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY p.promotion_id, p.promotion_name, p.budget;`,
            python: `# PSM 剔除自然 GMV 算力
def eval_cannibalization(df):
    df['natural_gmv'] = df['sub_user_cnt'] * 45.0
    df['incremental_gmv'] = (df['sub_gmv'] - df['natural_gmv']).clip(lower=0)
    df['real_roi'] = (df['incremental_gmv'] * 0.25 - df['discount_cost']) / df['discount_cost']
    return df`,
            brief: `## ⚠️ 高误伤营销活动拦截报告
- **排查结果**：在过去 30 天共 12 场活动中，发现 **“啤酒满50减10专场”** 误伤率高达 **42.8%**。
- **损失评估**：领券用户中有 40%+ 为存量高频用户，造成约 **¥4.8万元** 补贴资金无损浪费。
- **策略调整**：即刻下架通用满减券，改用定向针对“30天未复购用户”的精细化定向券。`
        },

        '✂️ 计算推荐淘汰SKU与资金': {
            sql: `-- 自动筛选上架 > 90 天且动销率 < 5% 的淘汰候选 SKU
SELECT product_id, product_name, first_list_date, current_price, cost_price
FROM dim_product
WHERE product_status = 1 AND DATEDIFF(CURRENT_DATE(), first_list_date) > 90;`,
            python: `# 自动算力计算
elim_df = df[(df['sell_through'] < 0.05) & (df['gross_margin'] < 0.10)]
released_funds = (elim_df['stock_qty'] * elim_df['cost']).sum()
print(f"推荐淘汰 SKU 数量: {len(elim_df)} 个, 可释放资金: {released_funds:,.2f} 元")`,
            brief: `## ✂️ SKU 规模平衡与汰换决策建议
- **测算结论**：通过动态 P50 门槛计算，全盘共定位 **42 个** 长尾培育品符合出清标准。
- **经营效益**：成功淘汰后，预计可释放 **¥18.6万元** 沉淀仓储资金，并使全盘商品平均动销率提升 **+12.4%**。
- **下阶段动作**：已导出《采销确认表》，请各品类采销于周五前完成差异化审核。`
        }
    }
};
