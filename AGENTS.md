# 项目开发指引

适用于本仓库全部文件。

## 开始工作前

1. 先读 [需求基准](docs/REQUIREMENTS.md) 和 [架构说明](docs/ARCHITECTURE.md)，再读本次任务相关源码与 [开发指南](docs/DEVELOPMENT.md)。涉及部署时读 [部署指南](docs/DEPLOYMENT.md)。
2. 检查工作区已有改动，保护用户文件。不要重新初始化已有项目。
3. 将本次任务对应到需求基准中的相关 REQ 编号，确定行为变化与验收方式。小改动无需另写计划文件。

## 实现边界

- 保持 Astro SSG、严格 TypeScript、Tailwind + CSS 变量、Content Collections、Markdown/MDX、npm 和 Cloudflare Pages 静态输出。
- 优先 Astro 和原生 JavaScript；复杂交互才使用按需 React 岛屿。
- 复用现有布局、通用组件、内容 schema 和数据入口。不要为新功能另建同类系统或全站重构。
- 不自行引入后端、数据库、登录、Monorepo、微服务或无关依赖；不顺手替换框架、内容管理、主题系统、部署平台或包管理器。
- 公开路由、内容模型和已完成能力保持兼容；重大变化遵循 REQUIREMENTS 第 10 节。用户已明确授权的变化可直接执行并更新文档，不重复申请授权。
- 不通过修改需求、删减测试或关闭检查掩盖不符合项。具体版本以 package.json / package-lock.json 为准，升级必须有当前任务理由及兼容验证。
- 保留示例标识与未知资料占位，不虚构经历、产品成果、链接、测试结果或发布状态。
- 不因本机父目录 `web-project` / `web-projects` 的单复数差异自行移动项目。

## 验证与交付

- 根据修改影响运行类型检查、构建、链接检查及浏览器测试；UI 修改检查桌面/手机与深浅主题，交互尊重减少动画偏好。
- 纯文档变更检查格式和引用即可，不无意义地重复全站测试。
- 需求变化更新 REQUIREMENTS；架构决策更新 ARCHITECTURE；操作步骤变化同步 README / DEVELOPMENT / DEPLOYMENT。
- 历史 QA 是有日期的证据，不是本轮结果。清楚说明本轮验证和未验证项。
- 未经用户授权不创建公开仓库、发布网站或操作外部账号。不要将本地完成表述为线上发布。
