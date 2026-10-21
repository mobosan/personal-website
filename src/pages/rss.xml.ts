import rss from '@astrojs/rss';
import { site as siteUrl } from 'astro:config/server';
import { getPosts } from '../lib/content';
import { site } from '../data/site';
export async function GET() {
  const posts = await getPosts();
  return rss({
    title: site.name,
    description: site.description,
    site: siteUrl || 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>zh-cn</language>',
  });
}
