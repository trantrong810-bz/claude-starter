# English-only repository

## Goal

Everything in the repo is English, except hand-written `docs/todo/<part>.md`. A check in verify enforces it. ADR 0020R. Plan: `docs/plans/english-only.md`.

## Contract

No app API change. Kit-level breaking renames:

- ADR frontmatter: `so` → `number`, `pham-vi` → `scope` (`rong`/`tinh-nang` → `broad`/`feature`), `trang-thai` → `status` (`de-xuat`/`chap-nhan`/`bi-thay-the` → `proposed`/`accepted`/`superseded`), `thay-the-boi` → `superseded-by`, `ngay` → `date`, `nguon` → `source`.
- `adr.mjs new --rong` → `--broad`.
- Todo sections in `*.auto.md`: `In progress`, `To do`, `Recently done`, `From manual`. Markers `from:` and `branch:`.
- Workflow files: `overview`, `git`, `safeguards`, `release`, `switch-machine`, `switch-model`, `lookup`.

## Checklist

- [x] Commit 1: ADR 0020R + `CLAUDE.md` in English
- [x] Commit 2: scripts translated, identifiers renamed, `lang.mjs`, data migrated
- [x] Commit 3: `.claude/` translated
- [x] Commit 4: docs translated, ADR/workflow files renamed
- [x] Commit 5: example, `.github`, `.githooks`, `.gitattributes`
- [x] `lang.mjs check` clean, `verify.sh --quick` OK
- [ ] `/ship`

## Progress

Commits 1–5 done; `lang.mjs` runs in `verify.sh`. Next: `/ship`.

## Notes

- `docs/tmp.md` is the user's draft (uncommitted edits); do not stage it.
- `pnpm` is not on PATH in this shell; use `bash scripts/verify.sh --quick`, CI runs the rest.
