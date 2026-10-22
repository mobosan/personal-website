import { test, expect } from '@playwright/test';

test('intro finishes automatically, remembers this tab and leaves inner pages alone', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#home-intro')).toBeVisible();
  await expect(page.locator('#home-intro')).toBeHidden({ timeout: 4000 });
  await page.reload();
  await expect(page.locator('#home-intro')).toBeHidden();
  await page.getByRole('link', { name: '浏览项目', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator('#home-intro')).toHaveCount(0);
});

test('intro can skip and replay in both themes without trapping keyboard focus', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.getByRole('button', { name: '跳过开场' }).click();
  await expect(page.locator('#home-intro')).toBeHidden();
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') await page.getByRole('button', { name: '切换浅色主题' }).click();
    await page.getByRole('button', { name: '重播开场' }).click();
    await expect(page.locator('#home-intro')).toBeVisible();
    await page.locator('#home-intro').evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 1200;
      }
    });
    await page.screenshot({ path: `docs/qa/intro-${info.project.name}-${theme}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: '跳过开场' }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#home-intro')).toBeHidden();
    await expect(page.getByRole('button', { name: '重播开场' })).toBeFocused();
  }
  await page.getByRole('button', { name: '重播开场' }).click();
  await page.keyboard.press('Tab');
  await expect(page.locator('#home-intro')).toBeHidden();
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
});

test('anchor navigation and disabled JavaScript never block the homepage', async ({
  page,
  browser,
}) => {
  await page.goto('/#main');
  await expect(page.locator('#home-intro')).toBeHidden();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  try {
    await plain.goto('http://127.0.0.1:4321/');
    await expect(plain.locator('#home-intro')).toBeHidden();
    await expect(plain.locator('h1')).toBeVisible();
    await plain.getByRole('link', { name: '浏览项目', exact: true }).click();
    await expect(plain).toHaveURL(/\/projects\/$/);
  } finally {
    await context.close();
  }
});
