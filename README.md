# Personal Website · Personal Space

一个以内容为中心的中文个人网站，集合主页、博客、作品集和可运行实验。默认深色，提供浅色主题。静态生成，无数据库、登录或模型服务。

当前项目位于 `G:\web-project\personal-website`。需求附件中的 `G:\web-projects\personal-website` 不存在，因此使用本次打开的工作区，未改动其他目录。

## 开发基准

后续每次开发先读 [需求基准](docs/REQUIREMENTS.md)、[架构说明](docs/ARCHITECTURE.md) 和根目录 [AGENTS.md](AGENTS.md)。需求基准定义产品范围、技术边界与验收标准；架构文档解释当前实现。普通功能沿现有结构扩展，重大架构变化按需求基准第 10 节处理，不因局部功能请求随意替换技术栈。

当前保留父目录名 `web-project`；单复数不影响功能，原始路径与实际路径的差异详见需求基准第 2.1 节。

## 开始使用

要求 Node.js ≥ 22.22.0，推荐 `.nvmrc` 指定的 24.19.0；使用 npm。

```powershell
cd G:\web-project\personal-website
npm ci
npm run dev
```

打开终端显示的地址，默认 http://127.0.0.1:4321/。

```powershell
npm run check       # 严格类型检查
npm run build       # 生成 dist/
npm run preview     # 预览构建产物
npm run test:links  # 检查本地链接、资源、锚点和草稿排除
npm test            # 桌面 + 手机 Playwright 测试，需要本机 Chrome
npm run audit:site  # Lighthouse，需要先启动 4321 端口的预览服务
npm run format     # 统一源码格式
```

Playwright 会复用 4321 端口的预览服务，或者自行启动。若没有 Chrome，可安装 Chrome，或安装 Playwright Chromium 并删除 `playwright.config.ts` 的 `channel: 'chrome'`。不会自动下载浏览器。

## 已实现

- 完整首页、响应式导航、持久化深浅主题、404 与更新日志。
- 三篇示例文章（含一篇 MDX）：标签筛选、标题/摘要搜索、目录、代码高亮、阅读时长、相邻文章、草稿过滤。
- 三个集中管理的项目：分类、状态、封面、图集、技术标签、可选仓库与体验链接。
- 两个可运行 Demo：React Canvas 粒子场、独立 HTML 渐变工作台。
- 一个明确标注“规划中”的 API 实验入口，没有 AI 后端。
- 每页标题、摘要、canonical、Open Graph、PNG 分享图、RSS、Sitemap 和 robots.txt。
- Playwright、静态链接检查、Lighthouse 脚本与本地 QA 记录。

## 实际技术栈

Astro 7.4.0、TypeScript 6.0.3、Tailwind CSS 4.3.3、React 19.3.1、Astro Content Collections、MDX 8.1.0、Lucide `@lucide/astro` 1.58.0。精确版本在 `package.json` 和 `package-lock.json`。

TypeScript 7 是注册表更新版本，但当前 Astro 检查器仅声明兼容 5/6，因此选择最新兼容的 6.0.3，而非强行忽略 peer dependency。普通页面不加载 React 运行时。

## 目录

```text
public/              静态插画、分享图、favicon、Cloudflare headers
  demos/             独立静态 Demo
src/
  components/        基础 UI、博客卡片、项目卡片、交互组件
  content/blog/      Markdown / MDX 文章
  content/projects/  项目元信息与正文
  data/              站点、导航、Demo 注册表、更新日志
  layouts/           Base、Article、Project 布局
  lib/               内容查询、日期与阅读时长
  pages/             页面、详情路由、RSS 与 robots 端点
  styles/            主题变量与响应式样式
  content.config.ts  内容 schema 与 glob loader
scripts/             链接检查、Lighthouse、粒子封面生成
tests/               浏览器验收测试
docs/                架构、开发、部署与 QA 文档
```

## 内容与部署

- 新增文章：向 `src/content/blog/` 添加 `.md` 或 `.mdx`，填写 frontmatter；详见 [开发指南](docs/DEVELOPMENT.md)。
- 新增项目：向 `src/content/projects/` 添加 `.md`，设置 `featured` 可出现在首页。
- 新增实验：编辑 `src/data/demos.ts`，选择 component、static 或 api 类型。
- 真实个人资料：编辑 `src/data/site.ts` 与关于页，空邮箱/GitHub 不会产生无效链接。
- Cloudflare Pages：构建命令 `npm run build`，输出 `dist`，生产分支 `main`，环境变量 `SITE_URL` 设置正式域名。

详见 [架构说明](docs/ARCHITECTURE.md)、[开发指南](docs/DEVELOPMENT.md)、[部署流程](docs/DEPLOYMENT.md)、[验收记录](docs/QA.md)。

## 交付边界

未创建公开 GitHub 仓库，未操作 Cloudflare 账号，未发布线上网站。默认 `https://example.com` 仅用于本地 canonical 与订阅地址占位，正式部署前必须设置 `SITE_URL` 并重新构建。

个人身份、邮箱、GitHub 等未知信息保持明确占位。Agent Kit / Tiny World 为概念示例；Personal Space 是本站实现。Pagefind 全文搜索、国际化翻译、真实 AI 服务不属于本次 V1；当前搜索覆盖文章标题与摘要，语言配置预留在 `site.ts`。
