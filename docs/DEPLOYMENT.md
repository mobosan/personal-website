# Cloudflare Pages 静态部署

当前交付是本地可运行版本。未创建外部仓库、未上传到 Cloudflare，也没有线上网址。

## 发布前设置

1. 替换 `src/data/site.ts` 中个人信息；检查示例项目、示例文章是否保留。
2. 确定域名。环境变量 `SITE_URL` 应是正式 HTTPS origin，例如你自己的 `https://<project>.pages.dev`。
3. 执行类型检查、构建、链接检查和浏览器测试。
4. 确认 `.env`、缓存与 node_modules 被 Git 忽略。

PowerShell 本地模拟生产域名：

```powershell
$env:SITE_URL='https://你的真实域名'
npm run check
npm run build
npm run test:links
npm run preview
```

canonical、Open Graph、RSS 与 Sitemap 会一起使用 SITE_URL。默认 example.com 仅为本地占位，不能直接用于正式发布。公开域名不是秘密，可以作为构建环境变量保存；本项目没有需要写入浏览器的密钥。

## 通过 GitHub 集成

以下步骤由拥有账号权限的用户执行：

1. 在 GitHub 创建仓库，选择所需可见范围；本地检查文件后提交并推送 main。
2. 在 Cloudflare 控制台打开 Workers & Pages，创建 Pages 项目，连接该仓库。
3. 设置构建参数：

| 设置                     | 值                                      |
| ------------------------ | --------------------------------------- |
| Framework preset         | Astro 或 None                           |
| Production branch        | main                                    |
| Root directory           | 仓库根目录                              |
| Build command            | npm run build                           |
| Build output directory   | dist                                    |
| NODE_VERSION             | 24.19.0，或满足 ≥22.22.0 的可用稳定版本 |
| SITE_URL                 | 正式 HTTPS 域名                         |
| ASTRO_TELEMETRY_DISABLED | 1（可选）                               |

这是静态站点，无需 Cloudflare SSR adapter、函数、D1、KV 或 Worker 入口。Cloudflare 将 npm 依赖安装后执行构建。必须提交 package-lock.json 保持构建可重复。

4. 首次确认 Pages 域名后，检查 SITE_URL 与其一致，并重新部署。
5. 若绑定自定义域名，同步更新 SITE_URL 后再构建。

## 直接上传

也可在本地 `npm ci` 与 `npm run build` 后，通过 Cloudflare Pages 的 Direct Upload 上传 dist 内容。不要上传整个源代码目录、node_modules 或 .env。每次改动需要重新构建并上传。

## 部署后验证

- 首页、博客、项目、实验室详情均返回成功。
- 任意不存在路径显示自定义 404，并返回 404 状态；dist 根目录包含 404.html。
- `/rss.xml`、`/sitemap-index.xml`、`/robots.txt` 使用正式域名。
- 深浅主题与移动导航正常，实验独立入口可访问。
- 浏览器没有资源 404，尤其是独立静态 Demo 的绝对路径。

`public/_headers` 配置安全响应头与 `_astro` 哈希文件长期缓存。没有添加全站 SPA 重写，避免把不存在的页面错误地回退到首页。

若部署后出现问题，可在 Cloudflare Pages 的部署历史中回滚到上一个已确认版本。不要在未验证时记录“已上线”。

官方参考：[Cloudflare Astro 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)、[Astro 内容集合](https://docs.astro.build/en/guides/content-collections/)、[Tailwind Astro 集成](https://tailwindcss.com/docs/installation/framework-guides/astro)。
