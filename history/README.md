# Prompt history

`prompts/YYYY-MM.jsonl` — each prompt has two lines with the same `id`:

- The prompt line: `t` (local time), `src` (`claude-code` | `claude.ai`), `session`, `branch`, `prompt` (secrets redacted; cut at 4,000 characters, with `truncated_from`). Prompts are stored verbatim in the language they were written in.
- The `"type": "model"` line: the handling `model`, `effort`, `subagents` (type, declared model, effort), `commits` (commit hashes or `ADR-NNNN` — no answer summary; older lines call this field `ket_qua`). If an `id` has several `model` lines, the last one is right.

Written automatically by `.claude/hooks/prompt-log.mjs` (off: `CLAUDE_PROMPT_LOG=off`). Committed but outside versioning. `pnpm verify` blocks secret-like strings.

`unknown` means it could not be determined — never a guess. Prompts from claude.ai are backfilled by hand; a subagent's model is the one declared in its agent file.
