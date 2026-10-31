#!/usr/bin/env bash
# SessionStart hook: stdout được đưa vào context đầu session.
# Mục tiêu: sau /clear, Claude biết ngay việc đang dở mà không phải đi tìm.
# Giữ output ngắn — nó tốn token ở mọi session.

out=""

# Spec còn checklist chưa xong
for f in docs/specs/*.md; do
  [ -f "$f" ] || continue
  case "$f" in */_template.md) continue ;; esac
  left=$(grep -c '^- \[ \]' "$f")
  [ "$left" -gt 0 ] || continue
  next=$(grep -m1 '^- \[ \]' "$f" | sed 's/^- \[ \] //')
  out+="- $f: còn $left mục, tiếp theo: $next"$'\n'
done

if [ -n "$out" ]; then
  echo "Tính năng đang dở (đọc spec trước khi làm tiếp):"
  printf '%s' "$out"
fi

if [ -f .claude/.allow-red ]; then
  echo "Cờ .claude/.allow-red đang bật: verify bỏ qua test. Chỉ đúng trong pha 1 (/plan-feature); /build-feature phải xóa nó."
fi

exit 0
