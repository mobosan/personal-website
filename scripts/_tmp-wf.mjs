import { chromium } from 'playwright';

const EXE = 'C:/Users/87212/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe';
const OUT = 'C:/Users/87212/AppData/Local/Temp';

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1.5 });

const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// 等 React Flow 节点渲染
const nodeCount = await page.evaluate(() => document.querySelectorAll('.react-flow__node').length);
console.log('画布节点数:', nodeCount);
await page.screenshot({ path: `${OUT}/wf-1-init.png` });

// 填输入并运行
const ta = page.locator('textarea').first();
await ta.fill('你好');
await page.getByRole('button', { name: /运行工作流/ }).click();
await page.waitForTimeout(3500);
const outputs = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('*')).find((n) => n.textContent?.trim() === 'node_outputs');
  return el ? el.parentElement?.innerText.slice(0, 300) : null;
});
console.log('输出区文本:', outputs ? outputs.replace(/\n/g, ' | ').slice(0, 200) : '(未找到)');
await page.screenshot({ path: `${OUT}/wf-2-run.png` });

// 点 llm_1 节点看配置面板
const llm = page.locator('.react-flow__node', { hasText: '模拟 LLM' }).first();
if (await llm.count()) {
  await llm.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/wf-3-config.png` });
  console.log('配置面板截图 ok');
}

console.log('JS 错误:', errors.length, errors.slice(0, 3));
await browser.close();
