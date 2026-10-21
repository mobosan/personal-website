#!/usr/bin/env bash
# 个人网站一键部署到 Cloudflare Pages
# 用法：./scripts/deploy.sh            （使用默认正式域名）
#       SITE_URL=https://x.com ./scripts/deploy.sh   （临时用别的域名）
set -euo pipefail

cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-https://www.wzh.abrdns.com}"
PROJECT_NAME="${PROJECT_NAME:-personal-website}"
BRANCH="${BRANCH:-main}"

echo "=========================================="
echo " 正式域名 SITE_URL : $SITE_URL"
echo " Pages 项目        : $PROJECT_NAME"
echo " 分支              : $BRANCH"
echo "=========================================="
echo

echo "[1/3] 构建静态站点 ..."
SITE_URL="$SITE_URL" npm run build

echo
echo "[2/3] 校验产物域名是否已注入 ..."
if grep -q "$SITE_URL" dist/index.html; then
  echo "  ✓ canonical/og:url 已使用 $SITE_URL"
else
  echo "  ✗ 构建产物里没找到 $SITE_URL，请检查 SITE_URL 是否生效" >&2
  exit 1
fi

echo
echo "[3/3] 上传到 Cloudflare Pages ..."
npx wrangler pages deploy dist \
  --project-name "$PROJECT_NAME" \
  --branch "$BRANCH" \
  --commit-dirty=true

echo
echo "部署完成。生产地址：https://$PROJECT_NAME-at7.pages.dev/"
