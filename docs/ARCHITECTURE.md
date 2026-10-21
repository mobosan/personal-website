# 架构与设计决策

产品范围、技术边界和验收以 [需求基准](REQUIREMENTS.md) 为准。本文件记录当前实现及其原因；后续架构变更遵循需求基准第 10 节，并在此同步记录影响与迁移方案。已有实现与需求冲突时，应说明差异，不能反向删改需求以适配代码。

## 请求与内容流

Markdown/MDX → Content Collections schema → 构建时查询 → Astro 组件 → 静态 HTML + CSS → Cloudflare Pages CDN。

博客与项目使用 `src/content.config.ts` 的 `glob()` 加载器，符合 Astro 7 内容层 API。`defineCollection` 从 `astro:content` 导入，Zod 从 `astro/zod` 导入。正文通过 `render(entry)` 渲染。禁止把访问者提交的不可信文本直接当 MDX 执行；内容文件属于可信仓库源码。

`src/lib/content.ts` 集中处理文章排序与草稿过滤。首页、列表、静态详情路径和 RSS 都调用同一个 `getPosts()`。草稿可以通过 schema 检查，但不会生成公开页面。项目通过 `getProjects()` 按 order 排序，卡片数据不散落在页面。

## 界面

视觉为深墨色背景、克制的蓝紫色强调、细边框与较大留白。主题色使用全局 CSS 变量；品牌封面和粒子画布使用独立固定配色，保证实验显示一致。Tailwind 4 通过官方 Vite 插件接入，承担组合布局工具类；有明确语义的重复组件样式放在全局样式表。

系统中文字体避免下载大型字体包。英文与代码字体提供 Inter / JetBrains Mono 兼容回退，不依赖第三方字体请求。项目封面为本地 SVG 设计插画，不声称是产品截图。Open Graph 使用本地 PNG，避免社交平台不支持 SVG 的问题。

`BaseLayout` 负责头部、主题初始化、SEO 和页脚；`ArticleLayout` 负责阅读布局、目录与相邻文章；`ProjectLayout` 负责项目说明与元信息。导航、按钮、卡片、标签和状态徽标是复用组件。

主题初始化脚本在 head 中读取 localStorage，默认深色，减少首次加载闪烁；存储不可用时仍可切换。移动端菜单有 aria-expanded、Escape 关闭与焦点返回。跳转链接支持键盘跳过导航。

## JavaScript 边界

导航、主题与列表筛选使用原生 JavaScript。React 仅用于粒子实验，详情页通过 `client:visible` 加载，独立入口通过 `client:load` 加载。粒子数量上限 150，连线算法 O(n²)，适合此规模；未来大量粒子应替换空间索引。

绘图使用 requestAnimationFrame、ResizeObserver、IntersectionObserver。设备像素比上限 2，离开视口或切换后台时取消下一帧。减少动画偏好默认暂停，用户可以主动播放。组件卸载时清理动画帧、监听器与观察器。

## 实验类型

`src/data/demos.ts` 使用 TypeScript 可辨识联合类型：

| 类型      | 当前实现                  | 扩展方式                                      |
| --------- | ------------------------- | --------------------------------------------- |
| component | React Canvas 粒子场       | 添加组件和显式渲染分支                        |
| static    | public/demos/color-studio | 独立构建输出到 public/demos/<id>，iframe 接入 |
| api       | 规划页，不发请求          | 先部署服务端，再实现输入、错误处理与取消机制  |

同源 iframe 的脚本被视为与站点代码同等可信。`allow-scripts allow-same-origin` 用于独立应用与剪贴板支持，并不构成不可信内容的安全隔离。第三方不可信 Demo 应单独域名部署，采用严格沙箱与最少权限。

## 部署与安全

纯 SSG，无 Cloudflare SSR adapter、数据库或身份服务。Cloudflare 直接分发 dist。API 密钥不得放入 public、客户端组件或 PUBLIC_ 环境变量。`.env*` 默认忽略。新窗口外链设置 noopener noreferrer。

SITE_URL 在构建时统一生成 canonical、分享 URL、RSS 和 Sitemap；本地默认 example.com，部署前必须替换。`public/_headers` 配置基础响应头及哈希资源缓存。404.html 使 Cloudflare 使用真正的 404 行为。

语言与站点文案集中化为未来翻译保留边界，但没有提前引入完整国际化框架。当前没有全局全文索引；标题/摘要筛选已足够支撑 V1 内容量。

## 版本与工程选择

使用 npm 官方 registry 的稳定版本并锁定依赖。Astro 7.4.0 与 React/MDX 集成同时安装。TypeScript 6.0.3 满足 @astrojs/check 的兼容范围。Lucide 使用当前维护的 @lucide/astro，避免旧 lucide-astro 包。Node 24.19.0 满足 Astro ≥22.22.0 要求。

本次环境的受限进程会使 Vite 模块加载产生误导性的 `require is not defined`；在允许 Node 正常启动构建子进程后消失，没有为此修改 node_modules 或加入 bundler 补丁。Astro 遥测可用 ASTRO_TELEMETRY_DISABLED=1 关闭。
