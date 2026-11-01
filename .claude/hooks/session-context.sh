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

# Todo hai lớp (TODO.md, docs/todo/): tổng số + việc đang làm
[ -f scripts/todo.mjs ] && node scripts/todo.mjs brief

# Trạng thái git (quy ước: docs/GIT.md, đã nạp qua CLAUDE.md)
if git rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git branch --show-current)
  dirty=$(git status --porcelain | grep -vc '^.. history/')
  git_out="Git: nhánh ${branch:-(detached)}"
  [ "$dirty" -gt 0 ] && git_out+=", $dirty file chưa commit"
  echo "$git_out."
  # GitHub rebase-merge đổi mã commit: nhánh đã merge vẫn hiện "no-merged", nên tách bằng pr.mjs stale.
  # (pr.mjs fetch remote; chỉ chạy khi đang ở main để hook nhanh.)
  if [ "$branch" = "main" ]; then
    merged=$([ -f scripts/pr.mjs ] && node scripts/pr.mjs stale 2>/dev/null | tr '\n' ' ')
    unmerged=$(git branch --format='%(refname:short)' --no-merged main 2>/dev/null | grep -v '^wip/' | \
      grep -vxF -f <(printf '%s' "$merged" | tr ' ' '\n' | grep .) 2>/dev/null | tr '\n' ' ')
    [ -n "$merged" ] && echo "- Nhánh đã merge trên GitHub, dọn: node scripts/pr.mjs cleanup <nhánh> — $merged"
    [ -n "$unmerged" ] && echo "- Nhánh chưa merge vào main: $unmerged"
  fi
  # Snapshot code dở (scripts/wip.mjs) — chỉ xem ref đã fetch, không gọi mạng để hook nhanh.
  wips=$(git for-each-ref --format='%(refname:lstrip=4)' refs/remotes/origin/wip/ 2>/dev/null | tr '\n' ' ')
  [ -n "$wips" ] && echo "- Có snapshot code dở: $wips— chạy /resume để áp vào."
  [ "$(git config core.hooksPath)" = ".githooks" ] || [ ! -d .githooks ] || \
    echo "- Git hook chưa bật cho người: nhắc người dùng chạy git config core.hooksPath .githooks"
  if [ -f versions.json ]; then
    v=$(node -e 'try{process.stdout.write(require("./versions.json").project.version)}catch{}')
    [ -n "$v" ] && ! git rev-parse -q --verify "refs/tags/v$v" >/dev/null && \
      echo "- Thiếu tag v$v cho version hiện tại: version.mjs check sẽ so với commit đầu."
  fi
fi

if [ -f .claude/.allow-red ]; then
  echo "Cờ .claude/.allow-red đang bật: verify bỏ qua test. Chỉ đúng trong pha 1 (/plan-feature); /build-feature phải xóa nó."
fi

exit 0
