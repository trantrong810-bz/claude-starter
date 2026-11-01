---
number: 0015
scope: broad # broad | feature
status: accepted # proposed | accepted | superseded
superseded-by: # number of the new ADR, only when superseded
date: 2026-11-01
model: claude-opus-5-5
source: request "add the working environment: windows 11, VSCode"; ADR 0014R
---

# Windows 11 + VSCode is the kit's standard environment; scripts stay POSIX

## Context

The kit is used on Windows 11 with VSCode and the Claude Code extension, but the docs did not say so. Every bug hit so far came from platform differences: CRLF checkouts made `adr.mjs` unable to read frontmatter, single quotes in `execSync` (cmd.exe) made `version.mjs` miss tags, and `chmod +x` is not stored in git. Every Claude session had to rediscover them.

## Options

- Declare no environment and write generic cross-platform code: flexible, but platform bugs only show up at run time.
- Declare Windows 11 + VSCode as the standard environment, with the caveats in CLAUDE.md and a shared `.vscode/`; scripts stay POSIX (Git Bash) so they still run on macOS/Linux.
- Move the scripts to PowerShell: natural on Windows, but loses macOS/Linux and the existing hooks.

## Decision

Option 2. CLAUDE.md has an "Environment" section (loaded every session); `.vscode/settings.json` enforces LF, format on save with Prettier, and a Git Bash terminal; `.vscode/extensions.json` recommends Claude Code, Prettier, ESLint and Markdown Mermaid.

## Consequences

- Claude knows the Windows traps up front, at the cost of a few context lines per session.
- macOS/Linux users can still use the kit; `defaultProfile.windows` does not affect them.
- Script changes must be tested in Git Bash (Windows); a newly found platform difference → one more line in the "Environment" section.
