#!/usr/bin/env bash
# Checks to pass before a task counts as done. Terse output: "VERIFY OK" or only the error lines => few tokens.
#
#   bash scripts/verify.sh           quick part + typecheck/lint/test of the affected packages
#   bash scripts/verify.sh --quick   quick part only (<1s): secret scan of history/, ADR, todo, workflow index,
#                                    language (English only), missing changelogs (when versioning automation is on)
#
# With the .claude/.allow-red flag (phase 1: tests written first, red on purpose):
# typecheck + lint still run, only tests are skipped.

fail=0

# --- Quick part ---
if [ -f .claude/hooks/prompt-log.mjs ] && [ -d history ]; then
  node .claude/hooks/prompt-log.mjs scan history || fail=1
fi
if [ -f scripts/adr.mjs ] && [ -d docs/decisions ]; then
  node scripts/adr.mjs check || fail=1
fi
if [ -f scripts/todo.mjs ] && [ -d docs/todo ]; then
  node scripts/todo.mjs check || fail=1
fi
if [ -f scripts/workflow.mjs ] && [ -d docs/workflows ]; then
  node scripts/workflow.mjs check || fail=1
fi
if [ -f scripts/lang.mjs ]; then
  node scripts/lang.mjs check || fail=1
fi
if [ -f scripts/version.mjs ] && [ -f versions.json ]; then
  node scripts/version.mjs check --auto >/dev/null 2>&1 || node scripts/version.mjs check --auto || fail=1
fi

if [ "$1" = "--quick" ]; then
  [ $fail -eq 0 ] && echo "VERIFY OK (quick)"
  exit $fail
fi

# --- Typecheck + lint + test ---
tasks="typecheck lint test"
note=""
if [ -f .claude/.allow-red ]; then
  tasks="typecheck lint"
  note=" (phase 1: tests skipped because of the .claude/.allow-red flag)"
fi

log=$(mktemp)
# VERIFY_BASE: baseline for picking affected packages (CI sets origin/main; locally: uncommitted changes).
pnpm turbo run $tasks --filter="...[${VERIFY_BASE:-HEAD}]" --continue --output-logs=errors-only >"$log" 2>&1
code=$?

if [ $code -ne 0 ]; then
  grep -E "error|Error|FAIL|✕|×|failed" "$log" | grep -v "^$" | head -n 60
  echo "--- (full log: $log)$note"
  fail=1
fi

[ $fail -eq 0 ] && echo "VERIFY OK$note"
exit $fail
