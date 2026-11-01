#!/usr/bin/env bash
# PostToolUse: format the file Claude just edited. Silent on success.
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.file_path||"")}catch{}})')
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.css|*.md|*.yml|*.yaml)
    npx --no-install prettier --write --log-level=warn "$file" >/dev/null 2>&1 || true
    ;;
esac
exit 0
