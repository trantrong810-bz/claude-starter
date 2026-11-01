#!/usr/bin/env bash
# PreToolUse (Bash): block `git commit` when a part changed files while its CHANGELOG Unreleased section is empty.
# Purpose: the changelog lands in the same commit as the code. Exit 2 + stderr => the command does not run, Claude gets guidance.
# Does nothing when: not a commit command, no versions.json yet, or versioning automation is off
# (versions.json automation.mode = "off" or CLAUDE_AUTO_VERSION=off).
input=$(cat)

cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

# Only commands containing `git commit` matter (including `git add -A && git commit ...`).
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|&&)[[:space:]]*git([[:space:]]+-c[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi
[ -f scripts/version.mjs ] && [ -f versions.json ] || exit 0

out=$(node scripts/version.mjs check --auto 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "Commit blocked: changelog missing."
    echo "$out"
    echo "Once versioner has filled it in, rerun this exact commit command (with the CHANGELOG.md files)."
  } >&2
  exit 2
fi
exit 0
