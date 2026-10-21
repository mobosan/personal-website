import { site } from 'astro:config/server';
export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site || 'https://example.com')}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
