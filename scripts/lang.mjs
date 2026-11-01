#!/usr/bin/env node
// Language check: everything in the repo is English (ADR 0020R). No external dependencies.
//
//   node scripts/lang.mjs check [--all]   list lines with Vietnamese letters in tracked and new files
//                                         (runs in verify; --all shows every line instead of the first 40)
//
// Exceptions, which may be in any language:
//   docs/todo/<part>.md            hand-written todo files
//   docs/todo/<part>.auto.md       only lines that copy a manual task (they link to <part>.md#L<n>)
//   TODO.md                        generated from the files above
//   history/prompts/               raw prompt log
// Detection: accented Latin letters (Vietnamese uses them; × and ÷ are allowed). Unaccented
// Vietnamese is not detected — review catches that.

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

try {
  process.chdir(
    execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim(),
  );
} catch {}

// Built from code points so formatters cannot turn the escapes into literal letters.
const range = (a, b) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`;
const VIETNAMESE = new RegExp(
  `[${range(0xc0, 0xd6)}${range(0xd8, 0xf6)}${range(0xf8, 0x1ef9)}]`,
);
const MANUAL = /^docs\/todo\/[a-z]+\.md$/;
const AUTO = /^docs\/todo\/[a-z]+\.auto\.md$/;
const COPIED = /\]\([a-z]+\.md#L\d+\)|ticked in [a-z]+\.md/;
const SKIP_DIRS = ["history/prompts/", ".claude/state/"];
const SKIP_FILES = ["TODO.md"];
const MAX_SHOWN = 40;

const files = () =>
  execSync("git ls-files --cached --others --exclude-standard", {
    maxBuffer: 64 * 1024 * 1024,
  })
    .toString()
    .split("\n")
    .filter(Boolean);

function findings() {
  const out = [];
  for (const file of files()) {
    if (SKIP_FILES.includes(file) || MANUAL.test(file)) continue;
    if (SKIP_DIRS.some((d) => file.startsWith(d))) continue;
    let buf;
    try {
      buf = readFileSync(file);
    } catch {
      continue; // deleted but not yet staged
    }
    if (buf.includes(0)) continue; // binary
    buf
      .toString("utf8")
      .split("\n")
      .forEach((line, i) => {
        if (!VIETNAMESE.test(line)) return;
        if (AUTO.test(file) && COPIED.test(line)) return;
        out.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
  }
  return out;
}

function check(all) {
  const found = findings();
  if (!found.length) return;
  const files = new Set(found.map((f) => f.split(":")[0]));
  console.error(
    `LANGUAGE: ${found.length} non-English line(s) in ${files.size} file(s) — the repo is English-only (ADR 0020R):`,
  );
  const shown = all ? found : found.slice(0, MAX_SHOWN);
  for (const f of shown) console.error("- " + f);
  if (found.length > shown.length)
    console.error(`- ... and ${found.length - shown.length} more (--all to list them)`);
  process.exitCode = 1;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "check") check(args.includes("--all"));
else {
  console.log("Usage: node scripts/lang.mjs check [--all]");
  process.exitCode = cmd ? 1 : 0;
}
