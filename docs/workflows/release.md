---
order: 7
title: Releasing a version
description: Changelog per part, automation.mode, /release bumps on a release/ branch then a PR; CI tags.
---

# Releasing a version

Each part has its own version and changelog; the whole project has a version and a `vX.Y.Z` tag. The part → path table and the automation settings live in `versions.json`:

```json
"automation": { "mode": "changelog", "confirmRelease": true }
```

`off`: no automation, commits never blocked · `changelog` (default): commits missing a changelog are blocked and `versioner` fills it · `full`: like `changelog` + `/release` runs after merge. Off for one session: `CLAUDE_AUTO_VERSION=off`.

```mermaid
flowchart TD
    CHANGE["Edit files in a part"] --> MODE{"automation.mode"}
    MODE -->|"off"| MANUAL["Write Unreleased when you like; check runs only at release"]
    MODE -->|"changelog or full"| GUARD["git commit blocked if the changelog is missing"]
    GUARD --> VERS["versioner subagent (Haiku) reads the diff, writes Added, Changed, Fixed, Removed, BREAKING"]
    VERS --> COMMIT["Commit with code and changelog"]
    MANUAL --> REL
    COMMIT --> TRIG{"When to release?"}
    TRIG -->|"full mode: right after merging into main"| REL["/release: check, dry-run"]
    TRIG -->|"changelog mode: when you call /release"| REL
    REL --> ASK{"confirmRelease: you approve"}
    ASK -->|"OK"| DO["Branch release/vX.Y.Z; release --no-tag: bump per changelog, write the table into the root CHANGELOG, commit"]
    DO --> PUSH["/ship: PR, you agree, auto-merge when CI is green"]
    PUSH --> TAG["release-tag Action: version.mjs tag puts vX.Y.Z on the release commit on main, pushes the tag"]

    classDef human fill:#fff4d6,stroke:#c98a00,color:#000
    class ASK human
```

The bump level comes from `Unreleased`: a `### Removed` section or an entry starting with `BREAKING` → major; `### Added` → minor; otherwise → patch. At `0.x`, major is lowered to minor.
