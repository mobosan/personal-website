# V1 验收记录

执行日期：2026-10-17（Asia/Shanghai）。执行环境：Windows 10、Node 24.19.0、npm 11.17.0、本机 Google Chrome。测试对象为本地源码构建与 http://127.0.0.1:4321/ 静态预览；未进行线上部署验证。

## 已执行结果

| 检查                             | 实际结果                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `npm run check`                  | 42 个文件；0 errors、0 warnings、0 hints                                       |
| `npm run build`                  | 成功，生成 17 个 Astro 页面，输出 dist                                         |
| `npm run test:links`             | 18 个 HTML（含独立静态应用），427 个站内链接、资源或锚点检查通过；草稿排除通过 |
| `npm test`                       | 18 / 18 通过；桌面与手机各 9 项                                                |
| `npm run dev -- --port 4322`     | 开发服务成功启动，首页、MDX 文章、实验页 HTTP 200                              |
| `npm run preview -- --port 4321` | 静态预览成功启动，首页 HTTP 200                                                |
| 依赖安装审计                     | 安装结束时 npm 报告 0 vulnerabilities；不代表永久安全保证                      |
| Git                              | 本地 main 分支已初始化，未提交、未配置远程、未推送                             |

## 浏览器覆盖范围

Playwright 使用已安装 Chrome，桌面 1440×1000、手机 iPhone 13 视口模拟，并单独检查 320px 最小宽度。

- 16 条正常页面路由可访问，均含 h1、description 和 canonical，无运行时页面异常。
- 深浅主题切换正常，重载后保持手动选择。
- 博客分类与文本搜索组合有效，有空结果反馈；目录锚点和相邻文章可跳转。
- 项目分类与详情正常，概念项目没有伪造仓库地址。
- 粒子 Canvas 实际绘制且帧发生变化，暂停后帧保持不变，数量参数实际改变绘制对象。
- 减少动画偏好下默认暂停。
- 独立配色工作台颜色和角度实时更新，复制按钮显示成功提示；页面另有剪贴板拒绝后的选中代码降级实现。
- 手机菜单可展开，Escape 关闭并返回焦点，链接可以导航。
- 所检查页面没有超出视口的横向内容。
- 不存在路径返回真正的 404；草稿路径为 404，RSS 与 Sitemap 没有草稿条目。

初轮测试 16/18 通过，两个失败均来自测试对 role=status 的选择器同时命中角度 output 与复制提示。修正为指定复制提示后，最终完整执行 18/18 通过。未通过删除功能或跳过测试来消除失败。

## 视觉检查

实际查看了桌面/手机、深色/浅色首页截图。已检查导航、Hero、项目封面、文章列表、实验区与页脚。全页截图前滚动加载非首屏图片，避免把正常的懒加载误认为资源丢失。

- [桌面深色](qa/home-desktop-dark.png)
- [桌面浅色](qa/home-desktop-light.png)
- [手机深色](qa/home-mobile-dark.png)
- [手机浅色](qa/home-mobile-light.png)

## Lighthouse

Lighthouse 13.5.0，2026-10-17 13:44（北京时间）。使用本机静态预览。每个场景单次执行，手机为模拟设备与节流；结果不是线上真实用户数据，网络、硬件、浏览器和内容变化都可能改变得分。

| 场景            | Performance | Accessibility | Best Practices | SEO |
| --------------- | ----------: | ------------: | -------------: | --: |
| 首页 / 手机     |         100 |           100 |            100 | 100 |
| 首页 / 桌面     |         100 |           100 |            100 | 100 |
| 粒子实验 / 手机 |         100 |           100 |            100 | 100 |

原始报告保存在 qa 目录：

- [汇总 JSON](qa/lighthouse-summary.json)
- [首页手机报告](qa/lighthouse-home-mobile.report.html)
- [首页桌面报告](qa/lighthouse-home-desktop.report.html)
- [实验页手机报告](qa/lighthouse-lab-mobile.report.html)

Lighthouse 检查后仅进行源码格式化与文档整理，界面与功能未改变；格式化后的最终构建与 18 项浏览器测试再次通过。

## 未验证与未实施

- 未在真实 iOS Safari、Android 设备、Firefox 或其他浏览器执行测试；手机为 Chrome 模拟。
- 未验证真实域名、Cloudflare CDN 响应、GitHub 集成与线上 Lighthouse。
- 未部署 AI 后端、认证、数据库或模型调用，API 实验明确标记规划中。
- 尚待站点所有者填写姓名、个人经历、邮箱、GitHub 与正式域名。
- Pagefind 全文搜索与多语言翻译留待后续，目前提供标题/摘要搜索和中文界面。

本地测试服务在验收后关闭。运行 `npm run dev` 可重新开启日常预览；运行 `npm run build` 和 `npm run preview` 可预览生产产物。
