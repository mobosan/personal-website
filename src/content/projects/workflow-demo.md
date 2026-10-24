---
title: '工作流实验室'
subtitle: '把流程画出来，然后让它真的跑起来'
description: '类 Dify 的拖拽工作流编辑器：React Flow 画布导出 JSON DSL，后端动态构建 LangGraph 状态图执行，条件分支、变量引用与 AST 白名单校验都在 655 行之内。'
category: 'AI'
status: '已完成'
stack: ['Python', 'FastAPI', 'LangGraph', 'React', 'TypeScript', 'React Flow']
cover: '/images/projects/workflow-cover.jpg'
screenshots:
  - src: '/images/projects/workflow-config.jpg'
    alt: '点选「模拟 LLM」节点后右侧展开配置：节点 id 只读、prompt_template 可编辑，并提示支持 {{input}} 与 {{node_id.output}} 引用'
  - src: '/images/projects/workflow-init.jpg'
    alt: '初始状态：左侧节点库可拖入开始／模拟 LLM／条件分支／结束，中间画布为示例流程，底部是工作流输入与输出区'
github: 'https://github.com/mobosan/workflow-demo'
featured: true
example: false
order: 1
---

## 想验证的那件事

Dify 这类产品最核心的一环不是界面好不好看，而是：**你在画布上连的那个图，怎么变成一段真正能执行的东西？**

这个项目用最小代价把这条链打通——拖拽画布 → 导出 JSON DSL → 后端动态构建 LangGraph 状态图 → 跑出每个节点的输出。全部代码 655 行（后端 285 + 前端 258 + 测试 111），没有数据库、没有鉴权、不连真实模型。

## 一个关键的技术选择

**`condition` 节点不调用 `add_node`。**

直觉做法是把条件节点也注册成一个图节点，但它没有业务输出——它的职责只是「路由」。所以构建器把它转成**前驱节点上的 `add_conditional_edges`**，用条件的表达式和出边决定下一个实际执行的节点。

这一步做对了，画布上的菱形分支才会和执行时真正的跳转对应上；做错了，条件节点会变成图里一个空洞的中间点，语义就断了。

## 表达式不能直接 eval

条件写的是 `len(llm_1) > 20` 这种，需要求值。做法是 **AST 白名单**：

- 允许：比较、布尔逻辑、常量、`len()` 调用
- 禁止：默认 builtins、属性访问、下标、导入
- 求值的 `locals` 是 `node_outputs`，路由结果匹配 `true` / `false` 出边，都不匹配则走 DSL 里最后一条出边兜底

README 里也明说了：「eval 仅用于演示，生产环境应替换成专用表达式解释器」——这类话说出来比藏起来强。

## DSL 校验比多数 demo 认真

画布能画出合法 JSON，不代表能画出**可执行**的图。校验规则包括：

| 规则 | 为什么 |
|---|---|
| 恰好一个 start，至少一个 end | 否则不知道从哪进、到哪停 |
| 所有节点必须从 start 可达 | 孤立节点是死代码 |
| 普通节点恰好一条出边，end 无出边 | 避免语义歧义 |
| 条件节点 1–2 条出边，标签不可重复 | `true`/`false` 各一条 |
| id 匹配 `^[A-Za-z_][A-Za-z0-9_]*$` 且唯一 | 要能作为 Python 变量名进状态 |
| 保留 `__start__`／`__end__`／`len`／`__builtins__` | 防止和框架内部符号撞车 |
| 拒绝仅由条件节点构成的环 | 否则永远走不出去 |

循环由 LangGraph 的 `recursion_limit=25` 兜住。**普通节点的并行 fan-out 明确不支持**——因为并发写同一份状态会冲突，与其做个半吊子的并行，不如说清楚边界。

## 每次请求重建图

不缓存、不共享运行状态：每个请求重新校验 DSL → 构建 → compile → 执行。所以两个请求同时跑不会互相污染。

代价是每次都有构建开销，但在演示规模上完全无感，换来的是「不用考虑状态残留」这个巨大的简单性。

## 导出 DSL 时会把 UI 状态剥掉

点「导出 DSL」，得到的是纯数据：节点、类型、配置、边、条件标签。**坐标、选中状态、React Flow 自己的边 id 全部剔除。**

这是我最在意的一条边界——画布位置是 UI 的事，不该混进要被执行的数据里。否则这份 DSL 换个渲染器就要重写。

## 当前边界

- `eval` 和 mock LLM 都只用于演示，没有真实模型调用，也没有持久化。
- 不支持普通节点并行 fan-out；没有鉴权、用户隔离或服务治理。
- 前端需要 Vite 跑在 5173，后端固定 8000（端口被占会直接报错，不静默改端口）。
