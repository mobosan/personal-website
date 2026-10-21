import { getCollection } from 'astro:content';
export async function getPosts() {
  return (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
export async function getProjects() {
  // hidden 的项目保留内容文件但不参与列表、首页与详情页静态路由
  return (await getCollection('projects', ({ data }) => !data.hidden)).sort(
    (a, b) => a.data.order - b.data.order,
  );
}
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
    .format(date)
    .replaceAll('/', '.');
export function readingTime(body: string = '') {
  const chinese = body.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const words = body.replace(/[\u3400-\u9fff]/g, '').match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(chinese / 300 + words / 200));
}
