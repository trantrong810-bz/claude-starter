#!/usr/bin/env bash
# Create a ready-to-run demo monorepo: example/ + the full Claude Code setup.
# Usage: bash scripts/try-example.sh [target-dir]   (default ../claude-starter-demo)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="${1:-$root/../claude-starter-demo}"

if [ -e "$dest" ]; then
  echo "Directory already exists: $dest — pick another path." >&2
  exit 1
fi

mkdir -p "$dest"
cp -r "$root/example/." "$dest/"
cp -r "$root/.claude" "$root/.githooks" "$root/.vscode" "$root/scripts" "$root/docs" "$root/CLAUDE.md" "$root/.gitattributes" "$dest/"
rm -f "$dest/scripts/try-example.sh"
# The kit's ADRs are the kit's history, not the new project's: keep only the template and an empty index.
find "$dest/docs/decisions" -name "0*.md" -delete 2>/dev/null
chmod +x "$dest/.claude/hooks/"*.sh "$dest/scripts/"*.sh "$dest/.githooks/"*

cd "$dest"
git init -q -b main
git config core.hooksPath .githooks
git config pull.ff only
node scripts/adr.mjs index
pnpm install --silent
node scripts/version.mjs init >/dev/null
git add -A
git -c user.name="demo" -c user.email="demo@example.com" commit -qm "chore: initial demo"

echo "Demo ready at: $dest"
echo "Try: cd \"$dest\" && pnpm verify && claude"
