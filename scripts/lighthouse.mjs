import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const chrome = candidates.find((path) => existsSync(path));
if (!chrome) throw new Error('Set CHROME_PATH to an installed Chrome/Chromium executable.');
mkdirSync('docs/qa', { recursive: true });
const results = [];
for (const [name, path, preset] of [
  ['home-mobile', '/', ''],
  ['home-desktop', '/', 'desktop'],
  ['lab-mobile', '/lab/particle-field/', ''],
]) {
  const output = resolve(`docs/qa/lighthouse-${name}`);
  const args = [
    resolve('node_modules/lighthouse/cli/index.js'),
    `http://127.0.0.1:4321${path}`,
    '--chrome-flags=--headless=new --no-first-run',
    '--output=json',
    '--output=html',
    `--output-path=${output}`,
    '--quiet',
  ];
  if (preset) args.push(`--preset=${preset}`);
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: chrome },
  });
  if (result.status !== 0) process.exit(result.status || 1);
  const report = JSON.parse(readFileSync(output + '.report.json', 'utf8'));
  const entry = {
    name,
    url: report.finalDisplayedUrl,
    fetchTime: report.fetchTime,
    categories: Object.fromEntries(
      Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
    ),
  };
  results.push(entry);
  console.log(JSON.stringify(entry));
}
writeFileSync('docs/qa/lighthouse-summary.json', JSON.stringify(results, null, 2));
