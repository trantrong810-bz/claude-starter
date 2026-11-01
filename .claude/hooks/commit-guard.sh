#!/usr/bin/env bash
# PreToolUse (Bash): ép quy ước git (docs/GIT.md) với lệnh `git commit` của Claude, kể cả khi
# máy chưa bật .githooks. Exit 2 + stderr => lệnh không chạy, Claude nhận hướng dẫn.
input=$(cat)

cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

# Chỉ quan tâm lệnh có `git commit` (cùng mẫu với version-guard.sh).
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|&&)[[:space:]]*git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

errors=""
add() { errors+="- $1"$'\n'; }

# Cờ của riêng lệnh `git commit`: bỏ nội dung trong nháy (message có thể chứa "-n") và các lệnh
# khác cùng dòng (`sed -n ... && git commit` không phải --no-verify).
flags=$(printf '%s' "$cmd" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{s=s.replace(/"(?:[^"\\]|\\.)*"|'"'"'[^'"'"']*'"'"'/g,"");process.stdout.write(s.split(/&&|\|\||[;|\n]/).filter(p=>/\bgit\b.*\bcommit\b/.test(p)).join(" "))})')

if printf '%s' "$flags" | grep -Eq '(^|[[:space:]])(--no-verify|-n)([[:space:]]|$)'; then
  add "không dùng --no-verify: hook chặn thì sửa nguyên nhân"
fi

branch=$(git branch --show-current 2>/dev/null)
if [ "$branch" = "main" ]; then
  add "main chỉ nhận thay đổi qua PR: tạo nhánh trước (git switch -c <feat|fix|refactor|chore|docs>/<tên>), rồi /ship"
fi
if [ -n "$branch" ] && [ "$branch" != "main" ] && \
   ! printf '%s' "$branch" | grep -Eq '^((feat|fix|refactor|chore|docs)/[a-z0-9][a-z0-9-]{0,39}|release/v[0-9]+\.[0-9]+\.[0-9]+)$'; then
  add "nhánh \"$branch\" sai quy ước: <feat|fix|refactor|chore|docs>/<tên-kebab> hoặc release/vX.Y.Z (đổi: git branch -m <tên-mới>)"
fi

# --amend chỉ cho commit chưa push
if printf '%s' "$flags" | grep -Eq '(^|[[:space:]])--amend([[:space:]]|$)' && \
   [ -n "$(git branch -r --contains HEAD 2>/dev/null)" ]; then
  add "HEAD đã có trên remote: không --amend, tạo commit mới"
fi

msg_err=$(printf '%s' "$cmd" | node scripts/commit-msg.mjs --command 2>&1) || errors+="$msg_err"$'\n'

if [ -n "$errors" ]; then
  { echo "Commit bị chặn (docs/GIT.md):"; printf '%s' "$errors"; } >&2
  exit 2
fi

# Máy chưa bật .githooks: tự đồng bộ todo như pre-commit. File viết tay có thể được `git add` ngay trong lệnh này.
if [ "$(git config core.hooksPath)" != ".githooks" ] && \
   { git diff --cached --name-only | grep -qE '^docs/todo/[a-z]+\.md$' || \
     printf '%s' "$cmd" | grep -q 'docs/todo'; }; then
  node scripts/todo.mjs sync >/dev/null && git add -- TODO.md docs/todo/
fi
exit 0
