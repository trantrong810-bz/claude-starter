#!/usr/bin/env bash
# PreToolUse (Bash): chặn `git commit` khi có phần đổi file mà mục Unreleased trong CHANGELOG còn trống.
# Mục đích: changelog nằm cùng commit với code. Exit 2 + stderr => lệnh không chạy, Claude nhận hướng dẫn.
# Không làm gì khi: không phải lệnh commit, chưa có versions.json, hoặc tự động versioning tắt
# (versions.json automation.mode = "off" hoặc CLAUDE_AUTO_VERSION=off).
input=$(cat)

cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

# Chỉ quan tâm lệnh có `git commit` (kể cả `git add -A && git commit ...`).
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|&&)[[:space:]]*git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi
[ -f scripts/version.mjs ] && [ -f versions.json ] || exit 0

out=$(node scripts/version.mjs check --auto 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "Commit bị chặn: thiếu changelog."
    echo "$out"
    echo "Sau khi versioner điền xong, chạy lại đúng lệnh commit này (kèm các CHANGELOG.md)."
  } >&2
  exit 2
fi
exit 0
