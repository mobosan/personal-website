---
title: 'GraphRAG 售后诊断'
subtitle: '让答案沿着证据链，走回原文'
description: '基于 microsoft/graphrag 3.0.4 的电商售后诊断骨架：七类实体、八条关系签名、严格 Schema 的类型化图校验，以及必须引用真实原文块的混合检索。'
category: 'AI'
status: '已完成'
stack: ['Python', 'FastAPI', 'GraphRAG 3.0.4', 'Parquet', '向量检索']
cover: '/images/projects/graphrag-cover.svg'
screenshots:
  - src: '/images/projects/graphrag-architecture.svg'
    alt: 'GraphRAG 处理流水线：预处理 → 索引 → 类型化图校验 → 检索服务，四个阶段'
featured: false
example: false
order: 4
---

## 场景

「X1 在宠物家庭的滤网堵塞问题，有什么解决方案？」这类问题，答案散落在评论和工单里，而且需要沿着**商品 → 症状 → 处理方式**跳几跳才能凑齐。普通的向量检索只能捞回相似的片段，捞不出这条链。

这个项目用 GraphRAG 把评论与工单抽成图，让检索结果带上一条可核验的路径：走过哪些实体、每一步是什么关系、每条边分别引用了哪个原文块。

## 图谱的规模与约束

七类实体（REVIEW / TICKET / PRODUCT / PARENT_PRODUCT / SYMPTOM / SOLUTION / COMPONENT），八条允许的关系签名——注意是八条**签名**、七个关系名称，因为 REVIEW 与 TICKET 共用 `reports_symptom`。

有几个刻意的限制：

- 不给 TICKET 增加 `mentions_product`，也不给 PRODUCT 增加 `reports_symptom`——没有合法评论边时，不伪造一条 Product → Ticket 的完整路径。
- 同一条诊断路径要求边的 SKU 范围一致，避免共享症状把不同型号的处理方式错误串联。
- 输入侧的过滤口径写死并写进文档：已验证购买 ∧（同 SKU 好评数前 40% 或 1–3 星）∧ 中文 jieba 分词后 ≥15 词。

## 为什么需要「导出器」

原生 GraphRAG 的标准关系表没有自定义关系类型这一列——它按 source/target 聚合，关系名会丢。所以只改 prompt 是不够的，你以为抽出了 `has_solution`，存下来的可能只剩一条无边类型的连线。

项目因此加了一层导出：从 raw 抽取快照里把关系类型、方向、真实块 ID 恢复出来，用严格 Schema 校验端点签名与证据子串，能对上的写进 `typed_graph.json`，对不上的进 `rejected_extractions.json` 隔离，不参与检索。**子串能对上只证明引用真实，语义上是否真的支持这条关系，仍然需要人工抽查。**

## 检索

- `POST /search/local`：走原生 `graphrag.api.local_search`，用于单跳事实；只有答案实际引用的来源才映射成真实块 ID，没有可核验引用就返回「证据不足」。
- `POST /search/hybrid`：先向量召回，再在校验过的图上扩展 1–3 跳，展开优先级为 `reports_symptom > has_solution > co_occurs_with > has_component`，每条边带自己的来源块。
- 问到价格、库存、参数时，直接返回「请调用商品服务实时 API」，不调用模型猜实时数据。

生成模型只允许引用本次提供的 evidence_id，引用一个不存在的证据 ID 会被应用拒绝。

## 当前边界

- 这是面向本地开发的项目骨架：**没有鉴权、没有租户隔离**，检索需要有效的模型与 embedding 密钥，公开部署会持续产生调用成本，因此没有提供在线 Demo。
- 示例数据是虚构的评论与工单，人工标注文件只是格式示例，需要按实际抽取出的实体名重新核对。
- 「这款 / 同一品类」这类指代无法从无上下文的提问里解析，必须显式传入型号与品类。原生 local search 的自由文本输出尤其需要人工质量检查——严格引用不等于答案一定正确。
