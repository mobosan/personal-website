# 内容维护与开发

开发前先读 [需求基准](REQUIREMENTS.md)、[架构说明](ARCHITECTURE.md) 和根目录 [AGENTS.md](../AGENTS.md)。将任务对应到相关 REQ 编号，沿现有架构增量实现，并按影响范围验证。普通实现细节自主处理；重大架构变化遵循需求基准第 10 节，避免多轮开发中无依据地替换技术栈。

## 本地开发

`npm ci` 安装锁定版本，`npm run dev` 启动热更新，`npm run check` 验证类型与 schema，`npm run build` 生成静态文件，`npm run preview` 检查生产构建。`npm run format` 统一格式。

## 新增博客

在 `src/content/blog/` 新建 `my-first-post.md`：

```md
---
title: '我的第一篇文章'
description: '一句准确的文章摘要。'
pubDate: 2026-10-17
tags: ['Web', '实践']
draft: false
example: false
---

## 开始

文章正文。
```

文件名决定 `/blog/my-first-post/`。可选字段有 `updatedDate` 与 `cover`。使用 `##` / `###` 标题自动形成目录，代码围栏注明语言即可高亮。支持 `.mdx`，可导入可信 Astro/React 组件；普通文章优先 Markdown。阅读时长按中英文混合文本估算，最短 1 分钟。

`draft: true` 在开发和生产公开路由中均隐藏，也不进入 RSS / Sitemap。修改日期会改变排序和相邻文章。示例文章请保留 `example: true`，只有真实内容才能移除此标记。

## 新增项目

在 `src/content/projects/` 新建 Markdown：

```yaml
title: '项目名称'
subtitle: '项目定位'
description: '简短说明'
category: 'Web'
status: '开发中'
stack: ['Astro', 'TypeScript']
cover: '/images/my-project.webp'
screenshots:
  - src: '/images/my-screenshot.webp'
    alt: '准确描述截图内容'
github: 'https://github.com/你的账户/你的仓库'
demo: 'https://你的真实域名'
featured: true
example: false
order: 4
```

上面的 YAML 放在 Markdown 文件顶部的 `---` 之间，之后写项目正文。类别只支持 AI / 游戏开发 / Web / 开发工具 / 其他；状态支持构思中 / 开发中 / 已完成 / 暂停维护。不知道真实 URL 时直接省略字段，不填假链接。首页取 featured 项目前三项。封面放入 public/images，推荐提供压缩的 WebP/AVIF 并保持约 1.85:1 比例。

## 接入实验

### A：站内组件

1. 在 `src/components/interactive/` 新建组件。
2. 更新 `src/data/demos.ts` 中 component 联合类型，加入组件名称。
3. 在 demos 注册表中添加条目，填写 slug、标题、说明、分类、封面、stack。
4. 在 `src/pages/lab/[slug].astro` 中显式导入组件并按名称渲染，推荐 `client:visible`。
5. 需要独立入口时在 `src/pages/demos/` 新建页面。为新类别更新实验室筛选项。

不要使用来自用户输入的动态模块路径。交互组件必须清理监听器、计时器与资源，尊重减少动画偏好。

### B：独立静态应用

将 HTML/CSS/JS 或其他工具的构建输出放到 `public/demos/my-demo/`。若使用 Vite，构建 base 设置为 `/demos/my-demo/`，避免资源路径错误。

```ts
{
  slug: 'my-demo', title: '我的实验', description: '实验说明',
  category: '实用工具', cover: '/images/my-demo.webp', stack: ['JavaScript'],
  type: 'static', url: '/demos/my-demo/index.html', status: '可体验'
}
```

列表与详情页自动生成，独立窗口打开 url。不要把不可信第三方脚本放到同源目录。独立页面应自行提供 title、description、viewport 与无障碍标注；可设置 noindex 防止重复索引。

### C：API 实验

保留 `type: 'api'` / `status: '规划中'`，只有后端完成后才修改状态类型并实现运行 UI。密钥在服务端；浏览器仅调用公开接口。至少实现超时、取消、限流、错误状态与敏感信息处理。当前 API 类型不会发送任何请求。

## 分享个人 Skill

1. 选择要公开的 Skill 文件，保留 `SKILL.md` 及它引用的 `references/`、`assets/`、`scripts/` 等资源。不要把系统插件、凭据或个人运行档案一起打包。
2. 将已检查的完整 Skill 文件夹压缩成 ZIP，保留一层同名根目录。放入 `public/downloads/skills/<名称>-<快照日期>.zip`，文件名仅用小写字母、数字和连字符。以后更新用新文件名，保留已分享地址的兼容性。
3. 在 `src/content/skills/<名称>.md` 填写以下 frontmatter，正文说明用途、安装、调用示例、依赖和限制：

```yaml
title: '真实 Skill 名称'
description: '实际用途'
version: '原版本号或快照日期'
updatedDate: 2026-10-22
tags: ['学习']
requirements: ['实际需要的工具和权限']
download: '/downloads/skills/my-skill-2026-10-22.zip'
draft: true
```

核对后将 `draft` 改为 `false`，列表与详情自动生成。详情会计算文件大小与 SHA-256，无需手填。草稿只隐藏页面，`public/` 中的文件仍可直接访问；未公开的包不要放入 public，撤回包时同时移除相关入口。原始 Skill 文件保留在本地，不会被网站改写，也不会在构建时自动同步。

执行类型检查、构建、链接检查和 `npx playwright test tests/skills.spec.ts`，核对下载包完整性。先启动生产预览，避免测试复用开发服务器；4321 已占用时在临时测试配置中选独立端口。测试中的首次分享清单需要随实际内容更新。此流程仅准备本地网站内容，线上发布仍按部署指南单独执行。

## 主题与资料

首页开场组件在 `src/components/common/HomeIntro.astro`，文案沿用 `site.name`，主题使用现有 CSS 变量。首页“重播开场”可预览；每个标签页首次自动展示一次，减少动画偏好下不展示。修改节奏时同时调整 CSS 的 2.2 秒结束时间与脚本的 2.4 秒兜底，并运行 `npx playwright test tests/intro.spec.ts`，检查退出、焦点、主题和无脚本退化。

修改 `src/styles/global.css` 顶部变量统一调整主题，避免在组件中重复主题颜色。`src/data/site.ts` 控制站名、简介、语言、邮箱、GitHub；邮箱和 GitHub 为空时只显示待填写信息。姓名、经历与熟练度必须自行提供真实内容。

更新日志位于 `src/data/changelog.ts`，只记录已实现功能。正式发布前同步版本号和日期。

## 验证

```powershell
npm run check
npm run build
npm run test:links
npm test
```

浏览器测试覆盖桌面、手机、320px 最小宽度、主题存储、筛选、目录与相邻文章、Canvas 实际帧变化、暂停、减少动画、独立应用、草稿和 404。浏览器截图在 `docs/qa/`，详细测试报告默认在忽略的 `playwright-report/`。

Lighthouse 需另一个终端保持 `npm run preview -- --port 4321` 运行，再执行 `npm run audit:site`；可用 CHROME_PATH 指定浏览器路径。数据为本机模拟测试，不是线上真实用户指标。
