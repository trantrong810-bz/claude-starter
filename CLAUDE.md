# Project: <PROJECT NAME>

<1–2 sentences: what the app does and for whom.>

## Stack

- Monorepo: pnpm workspaces + Turborepo
- apps/backend: Node + <Hono/NestJS>, PostgreSQL (Prisma/Drizzle)
- apps/web: Next.js (App Router)
- apps/mobile: Expo (React Native)
- packages/shared: types, Zod schemas, API client — the SINGLE SOURCE OF TRUTH for the API contract

## Environment

- Windows 11, VSCode + the Claude Code extension. The terminal is PowerShell; hooks and `scripts/*.sh` run in Git Bash (Git for Windows), so commands in the Bash tool use POSIX syntax and `/` paths.
- Node's `execSync`/`exec` run through cmd.exe: use double quotes, not single quotes.
- Text files are LF (`.gitattributes`); scripts that read files must tolerate CRLF (like `readText` in `scripts/version.mjs`).
- `chmod +x` is not stored in git on Windows: use `git update-index --chmod=+x <file>`.

## Commands

- `pnpm dev` — run everything (needs `docker compose up -d` first)
- `pnpm verify` — typecheck + lint + test of the affected parts. Prints "VERIFY OK" or only the error lines.
- `pnpm db:reset` — migrate + reseed the local DB
- Test accounts: see `docs/dev-accounts.md`

## Rules

- Language: everything in the repo is English — code, comments, docs, ADRs, changelogs, specs, plans, script/hook output, commit and PR text, file names. The only exception is the hand-written `docs/todo/<part>.md` (and its mirror in `*.auto.md`), which may be in any language. Reply in chat in the user's language. `scripts/lang.mjs check` (part of verify) enforces this. ADR 0020R.
- Git (commit messages, branches, merge, tags, forbidden commands): follow @docs/GIT.md. The `commit-guard.sh` hook blocks commits that break the conventions.
- API changes: edit the schema in packages/shared FIRST, then backend, then web/mobile.
- Call the API only through the client in packages/shared (it parses responses with the schema and encodes URL params). Apps contain UI only.
- Never edit an existing migration; create a new one.
- Do not read or edit `.env*`. Sample environment variables live in `.env.example`.
- A task is not done until `pnpm verify` passes.
- Classify a task before starting: small (one spot) → just do it; medium (no contract change) → short plan in chat; large (API contract change) → `/plan-feature` then `/build-feature`. Every kind is done on a branch and reaches `main` through `/ship` (PR, ask the user, then GitHub auto-merges when CI is green). Never commit on `main`.
- Multi-session tasks: the plan and progress live in `docs/specs/<feature>.md`; update it before ending the session.
- Todo: the overview is `TODO.md` (generated). `docs/todo/<part>.md` belongs to the user — read only, Claude may only tick `[x]`. Claude writes WIP and tasks to `docs/todo/<part>.auto.md` (`/todo`), then runs `node scripts/todo.mjs sync`. Do not store progress in Claude's memory — all state lives in the repo.
- Switching machine/account or usage ≥ 90%: `/handoff` (saves and pushes unfinished code to `wip/<branch>`); on the new side: `git pull` then `/resume`.
- Changing a command, hook, subagent or the task classification rule in `.claude/` → update the Mermaid diagram in `docs/workflows/` in the same commit (new workflow: copy `docs/workflows/_template.md`, then `node scripts/workflow.mjs index` regenerates the index in `docs/WORKFLOW.md`).
- Contested decisions (≥2 reasonable options) → write an ADR: `node scripts/adr.mjs new <slug> [--broad] --model <your model>`, fill it in, run `node scripts/adr.mjs index`. Use `--broad` when it affects ≥2 parts, changes a shared process/contract, or is hard to reverse.
- Looking up decisions and prompt history: `/why <question>`. Do not read `history/` unless you need to look something up.
- Changelog: each part (declared in `versions.json`) has a `CHANGELOG.md`; record changes under `Unreleased` in the same commit. When automation is on (`automation.mode` is not `off`), a commit missing its changelog is blocked by the hook → call the `versioner` subagent and commit again. Never edit version numbers by hand; release with `/release`.

## Docs (read when needed, not all at once)

- Architecture: @docs/ARCHITECTURE.md
- Feature specs: docs/specs/
