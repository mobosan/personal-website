import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('skills browse, filter, download complete archives and preserve themes', async ({
  page,
}, info) => {
  await page.goto('/skills/');
  await expect(page.locator('h1')).toContainText('Skill');
  await expect(page.locator('[data-filter-item]')).toHaveCount(2);
  await page.getByRole('button', { name: '学习', exact: true }).click();
  await expect(page.locator('[data-filter-item]:visible')).toHaveCount(1);
  await expect(page.getByRole('link', { name: '费曼学习陪练', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '全部', exact: true }).click();
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: '切换浅色主题' }).click();
    await page.screenshot({
      path: `docs/qa/skills-${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  for (const slug of ['3d-modeling-prep', 'feynman-learning']) {
    await page.goto(`/skills/${slug}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.prose')).toContainText('使用示例');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: '下载完整 Skill' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${slug}-2026-10-22.zip`);
    const path = await download.path();
    expect(path).not.toBeNull();
    const bytes = await readFile(path!);
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
    await page.locator('summary').click();
    await expect(page.locator('.checksum')).toHaveText(
      createHash('sha256').update(bytes).digest('hex'),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({
    path: `docs/qa/skill-detail-${info.project.name}-light.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: '切换深色主题' }).click();
  await page.screenshot({
    path: `docs/qa/skill-detail-${info.project.name}-dark.png`,
    fullPage: true,
  });
  if (info.project.name === 'desktop') {
    for (const width of [320, 768, 800, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `width ${width}`,
      ).toBe(true);
    }
  }
});
