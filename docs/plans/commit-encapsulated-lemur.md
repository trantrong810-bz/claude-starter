# English-only repository

## Context

The user wants one language for everything in the repo from now on: code comments, docs, script and hook output, commit and PR text, and file and identifier names. The only exception is the hand-written todo files (`docs/todo/<part>.md`), which may stay in Vietnamese. Chat replies to the user keep following the user's language.

Today about 100 of the 125 tracked files contain Vietnamese. Some of it is load-bearing: scripts parse Vietnamese markers and keys, so translating means renaming identifiers too, which is a breaking change for anyone using the kit.

Decisions already made with the user:

- Rename everything to English, including file names, ADR slugs, frontmatter keys, CLI flags and todo section markers. Mark it BREAKING.
- Translate the historical records too: all ADRs, all changelog entries (released ones included) and the finished plans in `docs/plans/`.
- Leave two things untouched: `history/prompts/` (the user's raw prompts) and the git commit history.
- Enforce the rule with a check in `pnpm verify`, pre-commit and CI.

## Approach

Work on branch `chore/english-only`, one commit per layer, and track progress in `docs/specs/english-only.md` because this will likely span several sessions. Ship with `/ship` at the end.

### Commit 1: rule and decision

- Add ADR `0020R-english-only` through `node scripts/adr.mjs new english-only --rong --model claude-opus-5-5`, written in English. It records the decision, the exceptions and the breaking renames.
- Rewrite `CLAUDE.md` in English, with a new rule: everything in the repo is English, except hand-written `docs/todo/<part>.md`. Chat replies follow the user's language.

### Commit 2: scripts (`refactor(scripts)!:`)

Translate comments and every output message, and rename the parsed identifiers:

- `scripts/todo.mjs`:
  - Section names: `Đang làm` → `In progress`, `Việc cần làm` → `To do`, `Xong gần đây` → `Recently done`, `Từ viết tay` → `From manual`.
  - Markers `từ:` → `from:` and `nhánh:` → `branch:`, plus the mirror comment.
  - Skeletons and the `TODO.md` overview table.
- `scripts/adr.mjs`:
  - Frontmatter keys: `so` → `number`, `pham-vi` → `scope`, `trang-thai` → `status`, `ngay` → `date`, `thay-the-boi` → `superseded-by`.
  - Values: `rong`/`tinh-nang` → `broad`/`feature`, and `de-xuat`/`chap-nhan`/`bi-thay-the` → `proposed`/`accepted`/`superseded`.
  - Flag: `--rong` → `--broad`. The `R` file suffix stays.
  - Generated `docs/decisions/README.md` headings.
- Translate the rest of the scripts: `scripts/version.mjs`, `scripts/workflow.mjs`, `scripts/wip.mjs`, `scripts/pr.mjs`, `scripts/commit-msg.mjs`, `scripts/verify.sh`, `scripts/github-setup.sh`, `scripts/try-example.sh`. Check each one for markers it parses, such as changelog headings or workflow index markers.
- New `scripts/lang.mjs check`:
  - It fails on Vietnamese-only letters (accented Latin in the U+00C0–U+1EF9 range plus `đĐ`, written as `\u` escapes so the script passes its own check).
  - It scans tracked files, except hand-written `docs/todo/<part>.md` (not `.auto.md`), the mirror block in `docs/todo/*.auto.md` (between the mirror markers), `history/`, and `.claude/state/`.
  - Wire it into the quick part of `scripts/verify.sh`. CI and pre-commit inherit it from there.
  - Also add a check in `scripts/commit-msg.mjs` that rejects accented Vietnamese in commit messages.
- Migrate the existing data in the same commit: rewrite `docs/todo/*.auto.md` and `TODO.md` with `todo.mjs sync`, and convert the frontmatter of every ADR.

### Commit 3: `.claude/` (`refactor(claude)!:`)

- Translate everything under `.claude/commands/*.md`, `.claude/agents/*.md` and `.claude/hooks/*`, including user-visible messages (`session-context.sh`, `commit-guard.sh`, `usage-guard.mjs`, `statusline.mjs`, `verify-on-stop.sh`, `version-guard.sh`). Leave `prompt-log.mjs` storing prompts as they are.
- Update references to `--rong` and to the renamed docs paths.
- Following the CLAUDE.md rule, update the Mermaid diagrams in `docs/workflows/` in the same commit (they are translated in commit 4 anyway, so this can be combined with commit 4 if that's simpler).

### Commit 4: docs (`docs!:`)

- Translate `README.md`, `SETUP.md`, `docs/GIT.md`, `docs/ARCHITECTURE.md` and the templates (`docs/specs/_template.md`, `docs/decisions/_template.md`, `docs/workflows/_template.md`).
- ADRs: rename the slugs to English with `git mv`, for example `0003R-phan-loai-task.md` → `0003R-task-classification.md`. Translate the bodies, then run `node scripts/adr.mjs index`.
- Workflows: rename `doi-may` → `switch-machine`, `doi-model` → `switch-model`, `lop-bao-ve` → `safeguards`, `phat-hanh` → `release`, `tong-quan` → `overview`, `tra-cuu` → `lookup`. Translate the bodies and Mermaid labels, then run `node scripts/workflow.mjs index`.
- Translate the plans in `docs/plans/*.md`.
- Fix every link that points to a renamed path. A repo-wide grep for the old slugs must come back empty.

### Commit 5: everything else (`chore!:`)

- `example/**` comments and strings.
- `.github/workflows/*.yml`, `.githooks/*` and `.gitattributes` comments.

### Changelogs

- Translate every `CHANGELOG.md` in full (root, `.claude/`, `docs/`, `scripts/`, `example/**`).
- Add `**BREAKING:**` entries under `Unreleased` for the renames: ADR frontmatter, the `--broad` flag, todo sections and workflow file names.
- Each layer's commit carries its own changelog.

## Out of scope

- `history/prompts/` and past commit messages.
- The open todo item about Superpowers.

## Verification

- `node scripts/lang.mjs check` passes with no findings.
- A test file with an accented line under `docs/` fails the check, and the same line in `docs/todo/root.md` passes.
- `bash scripts/verify.sh --quick` prints the OK line. This runs the ADR, todo, workflow, changelog and lang checks. `pnpm verify` isn't on PATH locally, so CI is the full gate.
- `node scripts/adr.mjs new test --broad` creates an English ADR (then delete it). `node scripts/todo.mjs sync` produces no diff after the migration.
- Grepping for old slugs (`doi-may`, `pham-vi`, `--rong`, `Đang làm`, …) returns nothing outside `history/`.
- Open a PR with `/ship`, wait for CI `verify` to pass, then merge.
