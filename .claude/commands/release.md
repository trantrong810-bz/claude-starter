---
description: Release a new version — fill missing changelogs, preview, (ask), bump each part on a release/ branch, open a PR; CI tags after merge.
argument-hint: "[--yes to skip the question]"
---

1. `node scripts/version.mjs mode`: tell me the current mode in one line.
2. `git switch main && git pull --ff-only`. `git status --porcelain` must be empty (ignoring `history/`); otherwise stop and ask me.
3. `node scripts/version.mjs check`. If a changelog is missing, do the following, then go back to step 2:
   - call the `versioner` subagent;
   - commit the CHANGELOG.md files on a `docs/changelog-<date>` branch (`docs(changelog): fill unreleased for <part>`);
   - `/ship`.
4. `node scripts/version.mjs release --dry-run`: show me the table of new versions, plus every `BREAKING` entry in the Unreleased sections.
5. Ask me before releasing, UNLESS: `$ARGUMENTS` contains `--yes`, or `versions.json` has `"confirmRelease": false`.
6. `git switch -c release/v<X.Y.Z>` (the project version from the dry run), then `node scripts/version.mjs release --no-tag`.
7. Follow `/ship`. Ask about the merge as for any PR, unless step 5 was skipped with `--yes`. After the merge, the `release-tag` Action tags the release commit on `main` with `vX.Y.Z`. Never create the tag yourself.
