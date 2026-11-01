# Claude Code starter kit — full-stack monorepo

Copy these files into the root of the monorepo (pnpm + Turborepo, apps/backend, apps/web, apps/mobile, packages/shared).

## What's included

| File                                | Role                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                         | Project memory, kept short. Fill in the project name and real stack.                                           |
| `.claude/settings.json`             | Allows safe commands, denies `.env`/migrations/destructive commands, registers 10 hooks (7 events).            |
| `.claude/hooks/format.sh`           | Runs Prettier after every file Claude edits.                                                                   |
| `.claude/hooks/session-context.sh`  | Session start: puts unfinished specs and the `.allow-red` flag into context.                                   |
| `.claude/hooks/prompt-log.mjs`      | Logs prompts, model, effort, subagents and commits to `history/prompts/`.                                      |
| `.claude/commands/why.md`           | `/why` — looks up ADRs, specs, git, the prompt log.                                                            |
| `.claude/hooks/version-guard.sh`    | Blocks `git commit` when a changed part has no changelog (per `automation.mode`).                              |
| `.claude/hooks/commit-guard.sh`     | Blocks Claude's `git commit` when it breaks conventions: message, branch name, `--no-verify`, amend.           |
| `docs/GIT.md`                       | Git conventions, loaded into every session through `CLAUDE.md`.                                                |
| `scripts/commit-msg.mjs`            | Checks commit messages (shared by Claude's hook and `.githooks/`).                                             |
| `scripts/lang.mjs`                  | Checks that the repo is English-only, except hand-written todo files (runs in verify).                         |
| `.githooks/`                        | `commit-msg` + `pre-commit` (blocks forbidden files, Prettier on staged files) for people.                     |
| `.vscode/`                          | LF, format on save with Prettier, Git Bash terminal, recommended extensions.                                   |
| `.gitattributes`                    | Enforces LF for every text file, even on Windows.                                                              |
| `.claude/agents/versioner.md`       | Subagent (Haiku) that reads the diff and fills `Unreleased`.                                                   |
| `.claude/commands/release.md`       | `/release` — fills missing changelogs, previews, asks, releases through a `release/vX.Y.Z` PR.                 |
| `.claude/commands/ship.md`          | `/ship` — pushes the branch, opens a PR, asks, enables auto-merge, waits for CI, cleans up.                    |
| `scripts/version.mjs`               | `init`, `list`, `mode`, `check`, `release`.                                                                    |
| `scripts/adr.mjs`                   | Creates ADRs, generates the index, checks them (runs in verify).                                               |
| `.claude/hooks/verify-on-stop.sh`   | Stops Claude from reporting "done" while `verify` fails (with an endless-loop guard).                          |
| `scripts/verify.sh`                 | Typecheck + lint + test of the affected parts, terse output.                                                   |
| `.claude/commands/plan-feature.md`  | `/plan-feature` — phase 1 (Opus): plan, contract, red backend tests.                                           |
| `.claude/commands/build-feature.md` | `/build-feature` — phase 2 (Sonnet): green tests, web + mobile in parallel.                                    |
| `.claude/commands/handoff.md`       | `/handoff` — saves todo, spec, unfinished code to git and pushes (before `/clear`, switching machine/account). |
| `.claude/commands/resume.md`        | `/resume` — new machine/account: pulls todo, applies unfinished code from `wip/<branch>`.                      |
| `.claude/commands/todo.md`          | `/todo` — view/record todo per part (`TODO.md`, `docs/todo/`).                                                 |
| `scripts/todo.mjs`                  | `sync`, `check`, `brief` for the two-layer todo (manual + auto).                                               |
| `scripts/wip.mjs`                   | `save`, `status`, `restore`, `drop` for unfinished-work snapshots on the remote.                               |
| `.claude/hooks/statusline.mjs`      | Status line with 5h/7d/context usage; writes the numbers for `usage-guard.mjs`.                                |
| `.claude/hooks/usage-guard.mjs`     | Usage ≥ 90%: only `/handoff` is allowed, then it stops.                                                        |
| `.claude/commands/retro.md`         | `/retro` — turns mistakes into a lint rule / hook / CLAUDE.md line.                                            |
| `.claude/agents/app-builder.md`     | Subagent that builds one app (web or mobile), runs in parallel.                                                |
| `.claude/agents/code-reviewer.md`   | Subagent that reviews the diff in its own context, runs on Sonnet.                                             |
| `docs/specs/_template.md`           | Spec template for each feature.                                                                                |

## Requirements

- Windows 11, [Git for Windows](https://git-scm.com/download/win) (with Git Bash — hooks and scripts need `bash`), Node ≥ 20, pnpm.
- VSCode: open the root folder and install the recommended extensions (`.vscode/extensions.json`): Claude Code, Prettier, ESLint, Markdown Mermaid.

## Setup

1. Add to the root `package.json`: `"verify": "bash scripts/verify.sh"`.
2. Each app/package needs `typecheck`, `lint` and `test` scripts for Turborepo to call.
3. Declare those tasks in `turbo.json`.
4. `chmod +x .claude/hooks/*.sh scripts/*.sh` — on Windows this bit does not reach git; after `git add`, also run `git update-index --chmod=+x .claude/hooks/*.sh scripts/*.sh .githooks/*`.
5. Add `CLAUDE.local.md`, `.claude/.allow-red` and `.claude/state/` to `.gitignore`. Public repo: also add `history/` or set `CLAUDE_PROMPT_LOG=off`.
6. Delete the kit's ADRs (`docs/decisions/0*.md`), then run `node scripts/adr.mjs index` — they are the kit's history, not the project's.
7. `node scripts/version.mjs init` — creates `versions.json` and a `CHANGELOG.md` per app/package (default mode `changelog`; set `"mode": "off"` if you do not want automation).
8. Fix the migration path in `deny` if you do not use Prisma.
9. Git: copy `.gitattributes`, `.githooks/`, `docs/GIT.md`; then
   ```bash
   chmod +x .githooks/*
   git config core.hooksPath .githooks   # per machine, per clone
   git config pull.ff only
   git switch -c chore/normalize-line-endings
   git add --renormalize . && git commit -m "chore: normalize line endings to lf"
   ```
   GitHub: copy `.github/`, install `gh` (`winget install GitHub.cli`), `gh auth login`, push `main` one last time, then run `bash scripts/github-setup.sh` (`main` ruleset, rebase-merge only, auto-merge; private repos need GitHub Pro/Team). From then on every change reaches `main` through `/ship`.
   A project that already released without a tag: tag the last release commit, `git tag -a vX.Y.Z <sha> -m "vX.Y.Z"`, otherwise `version.mjs check` compares against the first commit.
   Optional, stricter permissions in `.claude/settings.json`: add `Bash(git clean:*)`, `Bash(git branch -D:*)`, `Bash(git tag -d:*)`, `Bash(git commit --no-verify:*)`, `Bash(git config:*)` to `"deny"`; `"ask"`: `["Bash(git push:*)", "Bash(git rebase:*)", "Bash(git tag:*)"]`.
10. Run `claude` and type `/hooks` to check the hooks were picked up.
11. Todo: `node scripts/todo.mjs sync` creates `TODO.md` and `docs/todo/`. Change the list of parts in the `SCOPES` constant of `scripts/todo.mjs` if the project is split differently.
12. Language: the repo is English-only (ADR 0020R); `node scripts/lang.mjs check` lists anything else. Only the hand-written `docs/todo/<part>.md` files may be in another language.

## Daily loop

See the README, section "Workflow".

**Switching machine or Claude account:** on the old machine `/handoff` (todo + spec + unfinished code to `wip/<branch>`, pushed) → on the new machine `git pull` then `/resume`. First time on a new machine: clone, `git config core.hooksPath .githooks`, `git config pull.ff only`. All state lives in the repo: plans (`docs/plans/`), todo, specs, ADRs, the prompt log; Claude's auto memory is off for the project (`autoMemoryEnabled: false`).

**Usage ≥ 90%** (5-hour or 7-day window, Pro/Max plans): the status line records the numbers, the `usage-guard` hook only allows `/handoff` work, and once saved it blocks every tool so Claude stops. Change the threshold: `CLAUDE_WIP_THRESHOLD=95`. The guard only has numbers when the status line runs — if your interface does not show the status line, the guard never triggers.

The `.claude/.allow-red` flag allows deliberately red tests in phase 1: verify skips tests but still requires typecheck and lint. If the flag is forgotten, the SessionStart hook warns at the start of every session.
