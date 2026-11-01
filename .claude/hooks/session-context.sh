#!/usr/bin/env bash
# SessionStart hook: stdout goes into the context at the start of the session.
# Goal: after /clear, Claude knows right away what is unfinished without searching.
# Keep the output short — it costs tokens in every session.

out=""

# Specs with unchecked checklist items
for f in docs/specs/*.md; do
  [ -f "$f" ] || continue
  case "$f" in */_template.md) continue ;; esac
  left=$(grep -c '^- \[ \]' "$f")
  [ "$left" -gt 0 ] || continue
  next=$(grep -m1 '^- \[ \]' "$f" | sed 's/^- \[ \] //')
  out+="- $f: $left item(s) left, next: $next"$'\n'
done

if [ -n "$out" ]; then
  echo "Unfinished features (read the spec before continuing):"
  printf '%s' "$out"
fi

# Two-layer todo (TODO.md, docs/todo/): totals + work in progress
[ -f scripts/todo.mjs ] && node scripts/todo.mjs brief

# Git state (conventions: docs/GIT.md, loaded through CLAUDE.md)
if git rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git branch --show-current)
  dirty=$(git status --porcelain | grep -vc '^.. history/')
  git_out="Git: branch ${branch:-(detached)}"
  [ "$dirty" -gt 0 ] && git_out+=", $dirty uncommitted file(s)"
  echo "$git_out."
  # GitHub rebase-merge changes commit hashes: merged branches still show as "no-merged", so pr.mjs stale tells them apart.
  # (pr.mjs fetches the remote; only run it on main to keep the hook fast.)
  if [ "$branch" = "main" ]; then
    merged=$([ -f scripts/pr.mjs ] && node scripts/pr.mjs stale 2>/dev/null | tr '\n' ' ')
    unmerged=$(git branch --format='%(refname:short)' --no-merged main 2>/dev/null | grep -v '^wip/' | \
      grep -vxF -f <(printf '%s' "$merged" | tr ' ' '\n' | grep .) 2>/dev/null | tr '\n' ' ')
    [ -n "$merged" ] && echo "- Branches merged on GitHub, clean up: node scripts/pr.mjs cleanup <branch> — $merged"
    [ -n "$unmerged" ] && echo "- Branches not merged into main: $unmerged"
  fi
  # Unfinished-work snapshots (scripts/wip.mjs) — fetched refs only, no network call, to keep the hook fast.
  wips=$(git for-each-ref --format='%(refname:lstrip=4)' refs/remotes/origin/wip/ 2>/dev/null | tr '\n' ' ')
  [ -n "$wips" ] && echo "- Unfinished-work snapshots: $wips— run /resume to apply."
  [ "$(git config core.hooksPath)" = ".githooks" ] || [ ! -d .githooks ] || \
    echo "- Git hooks are not enabled for the user: remind them to run git config core.hooksPath .githooks"
  if [ -f versions.json ]; then
    v=$(node -e 'try{process.stdout.write(require("./versions.json").project.version)}catch{}')
    [ -n "$v" ] && ! git rev-parse -q --verify "refs/tags/v$v" >/dev/null && \
      echo "- Missing tag v$v for the current version: version.mjs check will compare against the first commit."
  fi
fi

if [ -f .claude/.allow-red ]; then
  echo "The .claude/.allow-red flag is on: verify skips tests. Only valid in phase 1 (/plan-feature); /build-feature must delete it."
fi

exit 0
