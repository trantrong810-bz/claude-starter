#!/usr/bin/env bash
# Chạy typecheck + lint + test cho các package bị ảnh hưởng.
# Output gọn: "VERIFY OK" hoặc chỉ các dòng lỗi (tối đa 60 dòng) => ít token.
#
# Khi có cờ .claude/.allow-red (pha 1: test viết trước, đỏ có chủ đích):
# vẫn chạy typecheck + lint, chỉ bỏ qua test.
tasks="typecheck lint test"
note=""
if [ -f .claude/.allow-red ]; then
  tasks="typecheck lint"
  note=" (pha 1: bỏ qua test vì có cờ .claude/.allow-red)"
fi

log=$(mktemp)
pnpm turbo run $tasks --filter='...[HEAD]' --continue --output-logs=errors-only >"$log" 2>&1
code=$?

if [ $code -eq 0 ]; then
  echo "VERIFY OK$note"
else
  grep -E "error|Error|FAIL|✕|×|failed" "$log" | grep -v "^$" | head -n 60
  echo "--- (full log: $log)$note"
fi
exit $code
