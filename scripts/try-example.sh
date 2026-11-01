#!/usr/bin/env bash
# Tạo một monorepo demo chạy được ngay: example/ + toàn bộ cấu hình Claude Code.
# Dùng: bash scripts/try-example.sh [thư-mục-đích]   (mặc định ../claude-starter-demo)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="${1:-$root/../claude-starter-demo}"

if [ -e "$dest" ]; then
  echo "Thư mục đã tồn tại: $dest — chọn đường dẫn khác." >&2
  exit 1
fi

mkdir -p "$dest"
cp -r "$root/example/." "$dest/"
cp -r "$root/.claude" "$root/scripts" "$root/docs" "$root/CLAUDE.md" "$dest/"
rm -f "$dest/scripts/try-example.sh"
# ADR của kit là lịch sử của kit, không phải của dự án mới: chỉ giữ mẫu và mục lục trống.
find "$dest/docs/decisions" -name "0*.md" -delete 2>/dev/null
chmod +x "$dest/.claude/hooks/"*.sh "$dest/scripts/"*.sh

cd "$dest"
git init -q
node scripts/adr.mjs index
pnpm install --silent
node scripts/version.mjs init >/dev/null
git add -A
git -c user.name="demo" -c user.email="demo@example.com" commit -qm "Initial demo"

echo "Demo sẵn sàng tại: $dest"
echo "Thử: cd \"$dest\" && pnpm verify && claude"
