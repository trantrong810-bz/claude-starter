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

# Cờ của lệnh, bỏ nội dung trong nháy (message có thể chứa "-n").
flags=$(printf '%s' "$cmd" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(s.replace(/"(?:[^"\\]|\\.)*"|'"'"'[^'"'"']*'"'"'/g,"")))')

if printf '%s' "$flags" | grep -Eq '(^|[[:space:]])(--no-verify|-n)([[:space:]]|$)'; then
  add "không dùng --no-verify: hook chặn thì sửa nguyên nhân"
fi

branch=$(git branch --show-current 2>/dev/null)
if [ "$branch" = "main" ] && [ -f .claude/.allow-red ]; then
  add "cờ .claude/.allow-red đang bật trên main: commit pha 1 phải ở nhánh feat/<tên>"
fi
if [ -n "$branch" ] && [ "$branch" != "main" ] && \
   ! printf '%s' "$branch" | grep -Eq '^(feat|fix|refactor|chore|docs)/[a-z0-9][a-z0-9-]{0,39}$'; then
  add "nhánh \"$branch\" sai quy ước: <feat|fix|refactor|chore|docs>/<tên-kebab> (đổi: git branch -m <tên-mới>)"
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
exit 0

'

if [ -n "$errors" ]; then
  { echo "Commit bị chặn (docs/GIT.md):"; printf '%s' "$errors"; } >&2
  exit 2
fi
exit 0
