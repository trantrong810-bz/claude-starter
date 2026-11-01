#!/usr/bin/env bash
# PreToolUse (Bash): enforce the git conventions (docs/GIT.md) on Claude's `git commit` commands, even when
# the machine has no .githooks enabled. Exit 2 + stderr => the command does not run and Claude gets the guidance.
input=$(cat)

cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

# Only commands containing `git commit` matter (same pattern as version-guard.sh).
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|&&)[[:space:]]*git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

errors=""
add() { errors+="- $1"$'\n'; }

# Flags of the `git commit` command itself: drop quoted text (a message may contain "-n") and other
# commands on the same line (`sed -n ... && git commit` is not --no-verify).
flags=$(printf '%s' "$cmd" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{s=s.replace(/"(?:[^"\\]|\\.)*"|'"'"'[^'"'"']*'"'"'/g,"");process.stdout.write(s.split(/&&|\|\||[;|\n]/).filter(p=>/\bgit\b.*\bcommit\b/.test(p)).join(" "))})')

if printf '%s' "$flags" | grep -Eq '(^|[[:space:]])(--no-verify|-n)([[:space:]]|$)'; then
  add "do not use --no-verify: when a hook blocks, fix the cause"
fi

branch=$(git branch --show-current 2>/dev/null)
if [ "$branch" = "main" ]; then
  add "main only accepts changes through PRs: create a branch first (git switch -c <feat|fix|refactor|chore|docs>/<name>), then /ship"
fi
if [ -n "$branch" ] && [ "$branch" != "main" ] && \
   ! printf '%s' "$branch" | grep -Eq '^((feat|fix|refactor|chore|docs)/[a-z0-9][a-z0-9-]{0,39}|release/v[0-9]+\.[0-9]+\.[0-9]+)$'; then
  add "branch \"$branch\" breaks the convention: <feat|fix|refactor|chore|docs>/<kebab-name> or release/vX.Y.Z (rename: git branch -m <new-name>)"
fi

# --amend only for commits that are not pushed
if printf '%s' "$flags" | grep -Eq '(^|[[:space:]])--amend([[:space:]]|$)' && \
   [ -n "$(git branch -r --contains HEAD 2>/dev/null)" ]; then
  add "HEAD is already on the remote: do not --amend, make a new commit"
fi

msg_err=$(printf '%s' "$cmd" | node scripts/commit-msg.mjs --command 2>&1) || errors+="$msg_err"$'\n'

if [ -n "$errors" ]; then
  { echo "Commit blocked (docs/GIT.md):"; printf '%s' "$errors"; } >&2
  exit 2
fi

# No .githooks on this machine: sync todo like pre-commit does. A manual file may be `git add`ed in this same command.
if [ "$(git config core.hooksPath)" != ".githooks" ] && \
   { git diff --cached --name-only | grep -qE '^docs/todo/[a-z]+\.md$' || \
     printf '%s' "$cmd" | grep -q 'docs/todo'; }; then
  node scripts/todo.mjs sync >/dev/null && git add -- TODO.md docs/todo/
fi
exit 0
