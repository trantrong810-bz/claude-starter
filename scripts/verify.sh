#!/usr/bin/env bash
# Chạy typecheck + lint + test cho các package bị ảnh hưởng.
# Output gọn: "VERIFY OK" hoặc chỉ các dòng lỗi (tối đa 60 dòng) => ít token.
log=$(mktemp)
pnpm turbo run typecheck lint test --filter='...[HEAD]' --continue --output-logs=errors-only >"$log" 2>&1
code=$?

if [ $code -eq 0 ]; then
  echo "VERIFY OK"
else
  grep -E "error|Error|FAIL|✕|×|failed" "$log" | grep -v "^$" | head -n 60
  echo "--- (full log: $log)"
fi
exit $code
