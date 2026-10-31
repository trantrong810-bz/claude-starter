#!/usr/bin/env bash
# Stop hook: không cho Claude kết thúc khi verify còn lỗi.
# Exit 2 + stderr => Claude nhận lỗi và tiếp tục sửa.
input=$(cat)

# Tránh vòng lặp vô hạn: nếu đã bị chặn một lần trong lượt này thì cho dừng.
if printf '%s' "$input" | grep -q '"stop_hook_active":[[:space:]]*true'; then
  exit 0
fi

# Không có thay đổi code => bỏ qua (câu hỏi, đọc code, plan...).
if git diff --quiet HEAD -- apps packages 2>/dev/null && \
   [ -z "$(git ls-files --others --exclude-standard apps packages 2>/dev/null)" ]; then
  exit 0
fi

out=$(bash scripts/verify.sh 2>&1)
if [ $? -ne 0 ]; then
  echo "pnpm verify chưa qua. Sửa các lỗi sau trước khi báo xong:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
