#!/usr/bin/env bash
# Kiểm tra trước khi coi là xong. Output gọn: "VERIFY OK" hoặc chỉ các dòng lỗi => ít token.
#
#   bash scripts/verify.sh           nhanh + typecheck/lint/test các package bị ảnh hưởng
#   bash scripts/verify.sh --quick   chỉ phần nhanh (<1s): quét secret trong history/, kiểm tra ADR
#
# Khi có cờ .claude/.allow-red (pha 1: test viết trước, đỏ có chủ đích):
# vẫn chạy typecheck + lint, chỉ bỏ qua test.

fail=0

# --- Phần nhanh ---
if [ -f .claude/hooks/prompt-log.mjs ] && [ -d history ]; then
  node .claude/hooks/prompt-log.mjs scan history || fail=1
fi
if [ -f scripts/adr.mjs ] && [ -d docs/decisions ]; then
  node scripts/adr.mjs check || fail=1
fi

if [ "$1" = "--quick" ]; then
  [ $fail -eq 0 ] && echo "VERIFY OK (nhanh)"
  exit $fail
fi

# --- Typecheck + lint + test ---
tasks="typecheck lint test"
note=""
if [ -f .claude/.allow-red ]; then
  tasks="typecheck lint"
  note=" (pha 1: bỏ qua test vì có cờ .claude/.allow-red)"
fi

log=$(mktemp)
pnpm turbo run $tasks --filter='...[HEAD]' --continue --output-logs=errors-only >"$log" 2>&1
code=$?

if [ $code -ne 0 ]; then
  grep -E "error|Error|FAIL|✕|×|failed" "$log" | grep -v "^$" | head -n 60
  echo "--- (full log: $log)$note"
  fail=1
fi

[ $fail -eq 0 ] && echo "VERIFY OK$note"
exit $fail
