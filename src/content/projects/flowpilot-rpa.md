---
title: 'FlowPilot · 自愈 RPA'
subtitle: '流程失败的时候，让 Agent 自己想出修复方案'
description: '固定 RPA 脚本负责录入订单；定位器失效、弹窗阻塞、字段改名时，Agent 输出经过校验的修复补丁，执行器从失败步骤继续，成功的经验写进知识库下次直接复用。'
category: 'AI'
status: '已完成'
stack: ['Python', 'FastAPI', 'Playwright', 'Pydantic', 'Jinja2']
cover: '/images/projects/flowpilot-cover.jpg'
screenshots:
  - src: '/images/projects/flowpilot-desktop.jpg'
    alt: 'FlowPilot 自愈工作台：同步完成 2 笔订单、修复 1 次，展示订单流程、执行时间线、修复知识库与历史记录'
  - src: '/images/projects/flowpilot-mobile.jpg'
    alt: '同一工作台的移动端布局，窄屏下流程与任务面板纵向排列'
featured: true
example: false
order: 2
---

## 为什么做这个

RPA 最脆弱的地方不在业务逻辑，而在定位器。页面上的按钮 ID 改一下、登录时突然弹一个维护提示、表单标签从「订单号」改成「订单编号」，脚本就全挂了。传统做法是看报错、改选择器、重跑——这套动作本身是重复的，而重复的动作值得自动化。

FlowPilot 试的是：**让 Agent 只在失败时介入，产出的是补丁而不是自由发挥的操作。**

## 先把职责切开

| 角色 | 负责 | 明确不负责 |
|---|---|---|
| RPA 执行器 | 执行固定步骤、保存证据、应用显式补丁 | 不做诊断 |
| 诊断 Agent | 接收失败上下文，返回严格校验的 JSON | 不操作浏览器 |
| 编排层 | 每步修复预算（默认 2 次）、断点继续、经验沉淀 | 不越权改流程 |
| 知识库 | 只记录**成功**的补丁 | 不记失败猜测 |

补丁（`RepairPlan`）的 strategy 只有四种：文本定位、模糊标签匹配、关掉弹窗后重试、按原样重试。它不能执行任意 Python 或 JavaScript，指定的步骤也必须与失败步骤一致。模糊标签出现多个候选时直接判失败，**不擅自选第一个**。

## 三种故障与修复方式

| 故障 | 现象 | 修复 |
|---|---|---|
| `selector` | 登录按钮 ID 变成 `login-btn-v2` | 改用 `button:has-text('登录')` 文本定位 |
| `popup` | 提交登录时触发原生维护 alert，阻塞页面 | 显式 dismiss 后重试当前步骤 |
| `label` | 「订单号」被改成「订单编号」 | 遍历标签语义别名，使用关联 input |

弹窗监听器只记录、不自动关闭——Playwright 默认会自动 dismiss，那样等于把故障藏起来了，修复就无从谈起。

## 学习是怎么发生的

知识库的键是 `sha256(step + error_type + url_path)[:16]`。第一次遇到 `selector` 故障，Agent 诊断、修复成功、补丁落盘；第二轮同样的故障直接命中知识库，**LLM 调用 0 次、修复 1 次**，工作台上能同时看到这两组数字（`agent_invocations`、`kb_hits`）。

## 验收方式

自动化 Demo 跑 `none / selector / popup / label` 四个场景，任一失败退出码为 1。验证不只看页面上「成功」两个字，还会回查 B 系统 API 里的订单与金额是否一致。工作台本身是内置的，不需要 Node.js 或额外前端构建。

## 当前边界

- A 系统与 B 系统都是项目内置的 Mock 页面，不是真实业务系统的对接。
- 当前**没有用户鉴权**，只绑定本机；不打算直接暴露到公网。
- 无模型密钥时使用确定性 heuristic 兜底，这保证了可复现，但不等于通用修复能力——遇到没见过的故障类型，仍然需要人看一眼。
