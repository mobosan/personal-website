import { test, expect } from '@playwright/test';

test('intro waits for a click, animates particles, then remembers the tab', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('#home-intro');
  await expect(intro).toBeVisible();
  const canvas = intro.locator('canvas');
  const first = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await expect
    .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
    .not.toBe(first);
  // Longer than the old automatic opening: no input must keep the entrance visible.
  await page.waitForTimeout(2700);
  await expect(intro).toHaveAttribute('data-state', 'waiting');
  await intro.click({ position: { x: 32, y: 140 } });
  await expect(intro).toHaveAttribute('data-state', 'leaving');
  await expect(intro).toBeHidden({ timeout: 2000 });
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  const stopped = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(stopped);
  await page.reload();
  await expect(intro).toBeHidden();
  await page.getByRole('link', { name: '浏览项目', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('#home-intro')).toHaveCount(0);
});

test('pause, skip, replay, keyboard and both themes work', async ({ page }, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: '跳过开场' }).click();
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: '切换浅色主题' }).click();
    await page.getByRole('button', { name: '重播开场' }).click();
    await expect(page.locator('#home-intro')).toBeVisible();
    await page.getByRole('button', { name: '暂停动画' }).click();
    const canvas = page.locator('#home-intro canvas');
    const frozen = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    await page.waitForTimeout(150);
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(frozen);
    await page.screenshot({ path: `docs/qa/particle-intro-${info.project.name}-${theme}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: '继续动画' }).click();
    await expect
      .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
      .not.toBe(frozen);
    await page.keyboard.press('Tab');
    expect(
      await page.locator('#home-intro').evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#home-intro')).toBeHidden();
    await expect(page.getByRole('button', { name: '重播开场' })).toBeFocused();
  }
  await page.getByRole('button', { name: '重播开场' }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#home-intro')).toBeHidden({ timeout: 2000 });
});

test('reduced motion and blocked storage show content immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#home-intro')).toBeHidden();
  await expect(page.getByRole('button', { name: '重播开场' })).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.reload();
  await expect(page.locator('#home-intro')).toBeHidden();
  await page.getByRole('button', { name: '重播开场' }).click();
  await expect(page.locator('#home-intro')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#home-intro')).toBeHidden();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
});

test('anchor navigation and disabled JavaScript never block the homepage', async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto('/#main');
  await expect(page.locator('#home-intro')).toBeHidden();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  try {
    await plain.goto(baseURL!);
    await expect(plain.locator('#home-intro')).toBeHidden();
    await expect(plain.locator('h1')).toBeVisible();
    await plain.getByRole('link', { name: '浏览项目', exact: true }).click();
    await expect(plain).toHaveURL(/\/projects\/$/);
  } finally {
    await context.close();
  }
});
