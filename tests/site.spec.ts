import { test, expect } from '@playwright/test';
const routes = [
  '/',
  '/blog/',
  '/blog/building-with-astro/',
  '/blog/particle-connections/',
  '/blog/agent-boundaries/',
  '/projects/',
  '/projects/agent-kit/',
  '/projects/tiny-world/',
  '/projects/personal-space/',
  '/lab/',
  '/lab/particle-field/',
  '/lab/color-studio/',
  '/lab/agent-playground/',
  '/about/',
  '/changelog/',
  '/demos/particle-field/',
];

test('all public routes, SEO, console and responsive layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'),
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      route,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('theme toggles, survives reload and screenshots render', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.lab-feature-art').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `docs/qa/home-${info.project.name}-dark.png`, fullPage: true });
  await page.getByRole('button', { name: '切换浅色主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.lab-feature-art').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `docs/qa/home-${info.project.name}-light.png`, fullPage: true });
  await page.getByRole('button', { name: '切换深色主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('blog filtering, empty state and real article navigation', async ({ page }) => {
  await page.goto('/blog/');
  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await expect(page.locator('[data-filter-item]:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('没有这个标题');
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await expect(page.locator('[data-filter-item]:visible')).toHaveCount(3);
  await page.getByRole('link', { name: '从零搭建一个轻量、可持续的个人网站' }).click();
  await expect(page.locator('.prose pre')).toBeVisible();
  const toc = page.locator('.toc a').first();
  await toc.click();
  await expect(page).toHaveURL(/#/);
  await page.locator('.post-navigation a').first().click();
  await expect(page.locator('h1')).toHaveText('用 Canvas 画一个会呼吸的粒子世界');
});

test('project and lab categories distinguish available from planned', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('button', { name: '游戏开发', exact: true }).click();
  await expect(page.locator('[data-filter-item]:visible')).toHaveCount(1);
  await page.getByRole('link', { name: 'Tiny World', exact: true }).click();
  await expect(page.getByText('GitHub 仓库：尚未配置')).toBeVisible();
  await page.goto('/lab/');
  await page.getByRole('button', { name: 'AI 实验', exact: true }).click();
  await page.getByRole('link', { name: 'AI Agent 沙盒', exact: true }).click();
  await expect(page.getByText('想法正在酝酿，实验尚未上线。')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('particle canvas draws, animates and responds to controls', async ({ page }) => {
  await page.goto('/lab/particle-field/');
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute('data-particles', '75');
  const frame1 = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
    .not.toBe(frame1);
  await page.getByRole('button', { name: '暂停动画' }).click();
  const frame2 = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(frame2);
  await page.getByRole('slider', { name: '粒子数量' }).fill('100');
  await expect(canvas).toHaveAttribute('data-particles', '100');
  await page.getByRole('button', { name: '播放动画' }).click();
  await expect(page.getByRole('button', { name: '暂停动画' })).toBeVisible();
});

test('reduced motion defaults to paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lab/particle-field/');
  await page.locator('canvas').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: '播放动画' })).toBeEnabled();
  await expect(page.locator('canvas')).toHaveAttribute('data-particles', '75');
});

test('static demo edits gradient and supports copying fallback', async ({ page }) => {
  await page.goto('/lab/color-studio/');
  const frame = page.frameLocator('iframe');
  await frame.getByLabel('渐变角度', { exact: true }).fill('240');
  await expect(frame.locator('#code')).toContainText('240deg');
  await frame.locator('#start').fill('#ff3300');
  await expect(frame.locator('#code')).toContainText('#ff3300');
  await frame.getByRole('button', { name: '复制 CSS' }).click();
  await expect(frame.locator('#status')).toHaveText(/已复制|已选中/);
});

test('mobile menu keyboard behavior and 320px layout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const button = page.getByRole('button', { name: '打开导航菜单' });
  await button.click();
  await expect(page.getByRole('navigation', { name: '移动端导航' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await button.click();
  await page
    .getByRole('navigation', { name: '移动端导航' })
    .getByRole('link', { name: '博客', exact: true })
    .click();
  await expect(page).toHaveURL(/\/blog\/$/);
});

test('draft exclusion, feeds and genuine 404', async ({ page, request }) => {
  const response = await page.goto('/not-a-real-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('这个想法，还没有落在这里。');
  for (const endpoint of ['/rss.xml', '/sitemap-0.xml']) {
    const result = await request.get(endpoint);
    expect(result.ok()).toBe(true);
    expect(await result.text()).not.toContain('draft-check');
  }
  expect((await request.get('/blog/draft-check/')).status()).toBe(404);
});
