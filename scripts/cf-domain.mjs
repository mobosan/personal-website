// 管理 Cloudflare Pages 自定义域名绑定
import { readFileSync } from 'node:fs';

const TOML_PATH =
  'C:/Users/87212/AppData/Roaming/xdg.config/.wrangler/config/default.toml';
const ACCOUNT_ID = 'c244ed2eeac03b3b59c48e006de3331d';
const PROJECT = 'personal-website';

const toml = readFileSync(TOML_PATH, 'utf8');
const token = toml.match(/^oauth_token\s*=\s*"(.*)"/m)?.[1];
if (!token) {
  console.error('读不到 oauth_token');
  process.exit(1);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains`;
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log('=== 当前已绑定域名 ===');
  const list = await call('GET', base);
  for (const d of list.json.result ?? []) {
    console.log(` - ${d.name}  status=${d.status}  ${d.verification_data?.error_message ?? ''}`);
  }

  console.log('\n=== 删除根域绑定 wzh.abrdns.com ===');
  const del = await call('DELETE', `${base}/wzh.abrdns.com`);
  console.log(`HTTP ${del.status}  success=${del.json.success}`);
  if (!del.json.success) console.log(JSON.stringify(del.json.errors));

  console.log('\n=== 添加 www.wzh.abrdns.com ===');
  const add = await call('POST', base, { name: 'www.wzh.abrdns.com' });
  console.log(`HTTP ${add.status}  success=${add.json.success}`);
  if (add.json.success) {
    console.log(JSON.stringify(add.json.result, null, 2));
  } else {
    console.log(JSON.stringify(add.json.errors, null, 2));
  }

  console.log('\n=== 最终绑定列表 ===');
  const final = await call('GET', base);
  for (const d of final.json.result ?? []) {
    console.log(` - ${d.name}  status=${d.status}  ${d.verification_data?.error_message ?? ''}`);
  }
}

main().catch((e) => {
  console.error('失败:', e.message);
  process.exit(1);
});
