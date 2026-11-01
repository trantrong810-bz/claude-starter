#!/usr/bin/env node
// Versions for each part of the repo + a changelog per part. No external dependencies.
//
//   node scripts/version.mjs init                  create versions.json + CHANGELOG.md for the project (apps/*, packages/*)
//   node scripts/version.mjs list                  current version of every part
//   node scripts/version.mjs mode                  active automation mode: off | changelog | full
//   node scripts/version.mjs check [--json] [--auto]
//        which parts changed files since the last release while Unreleased is still empty.
//        --json: print the list for the versioner subagent. --auto: do nothing when mode is off.
//   node scripts/version.mjs release [--dry-run] [--no-tag]
//        bump the parts with Unreleased entries, write changelogs, commit, tag vX.Y.Z.
//        --no-tag: no tag — release goes through a PR and CI tags after merge (docs/GIT.md).
//   node scripts/version.mjs tag                   tag HEAD vX.Y.Z if HEAD is the "release: vX.Y.Z" commit
//                                                   (CI runs it after the release PR merges into main)
//
// Automation settings in versions.json:  "automation": { "mode": "changelog", "confirmRelease": true }
//   off: no automation, commits never blocked · changelog: block commits missing a changelog, versioner fills it
//   full: like changelog + release automatically after merge (asks first when confirmRelease)
// Override for one session on this machine: CLAUDE_AUTO_VERSION=off
//
// The bump level comes from Unreleased: "### Removed" or an entry starting with BREAKING → major; "### Added" → minor; otherwise → patch.
// For 0.x versions, major is lowered to minor (the SemVer convention for unstable versions).

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Run at the git repo root; outside a git repo (e.g. before git init) use the current directory.
try {
  process.chdir(
    execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim(),
  );
} catch {
  /* not a git repo */
}

const CONFIG = "versions.json";
const MODES = ["off", "changelog", "full"];
const CHANGELOG_HEADER = `# Changelog

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).
Record changes under \`Unreleased\` in the same commit (the \`versioner\` subagent fills it when automation is on); \`node scripts/version.mjs release\` turns it into a new version.

## [Unreleased]
`;
const cmd0 = process.argv[2];
if (cmd0 !== "init" && !existsSync(CONFIG)) {
  console.error(`No ${CONFIG} yet. Run: node scripts/version.mjs init`);
  process.exit(cmd0 === "check" && process.argv.includes("--auto") ? 0 : 1);
}
const config = cmd0 === "init" ? {} : JSON.parse(readFileSync(CONFIG, "utf8"));

function mode() {
  if (String(process.env.CLAUDE_AUTO_VERSION ?? "").toLowerCase() === "off")
    return "off";
  const m = config.automation?.mode ?? "off";
  return MODES.includes(m) ? m : "off";
}
const LEVELS = ["none", "patch", "minor", "major"];

const sh = (cmd) =>
  execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
const lines = (s) => s.split("\n").filter(Boolean);

// ---------- version ----------
function getVersion(c) {
  return c.package
    ? JSON.parse(readFileSync(c.package, "utf8")).version
    : c.version;
}
function setVersion(c, v) {
  if (c.package) {
    const pkg = JSON.parse(readFileSync(c.package, "utf8"));
    pkg.version = v;
    writeFileSync(c.package, JSON.stringify(pkg, null, 2) + "\n");
  } else {
    c.version = v;
  }
}
// At 0.x, breaking changes only bump minor (the SemVer convention for unstable versions).
function effective(v, level) {
  return level === "major" && v.startsWith("0.") ? "minor" : level;
}
function bump(v, level) {
  const [maj, min, pat] = v.split(".").map(Number);
  if (level === "major") return `${maj + 1}.0.0`;
  if (level === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

// ---------- changelog ----------
const UNRELEASED = /^## \[Unreleased\][^\n]*\n([\s\S]*?)(?=^## \[|(?![\s\S]))/m;

// Normalize CRLF: files may be checked out with CRLF on Windows.
const readText = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");

function unreleased(file) {
  if (!existsSync(file)) return "";
  const m = readText(file).match(UNRELEASED);
  return m ? m[1].trim() : "";
}
function hasEntries(body) {
  return /^\s*[-*] \S/m.test(body);
}
function levelOf(body) {
  if (!hasEntries(body)) return "none";
  const section = (name) => {
    const m = body.match(
      new RegExp(`^### ${name}\\s*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, "m"),
    );
    return m ? hasEntries(m[1]) : false;
  };
  if (section("Removed") || /^\s*[-*]\s+(\*\*)?BREAKING\b/m.test(body))
    return "major";
  if (section("Added")) return "minor";
  return "patch";
}
function stamp(file, version, date, extra = "") {
  const text = readText(file);
  const body = unreleased(file);
  const block = `## [Unreleased]\n\n## [${version}] - ${date}\n\n${body}${extra ? `\n\n${extra}` : ""}\n\n`;
  writeFileSync(
    file,
    text.replace(UNRELEASED, block).replace(/\n{3,}/g, "\n\n"),
  );
}

// ---------- changes since the last release ----------
// Baseline: the latest release tag; a project that never released uses its first commit.
// Human-readable baseline: the tag name, or "first commit <short hash>" before any release.
function baseLabel(base) {
  if (!base) return "the start";
  return /^v\d/.test(base)
    ? base
    : `first commit ${base.slice(0, 7)} (not released yet)`;
}
// Format the files just written if the repo has Prettier (optional).
function formatIfPossible(globs) {
  try {
    sh(`npx --no-install prettier --write --log-level=warn ${globs}`);
  } catch {
    /* no Prettier: leave as is */
  }
}
function lastTag() {
  try {
    // Double quotes: cmd.exe (execSync on Windows) does not understand single quotes.
    return sh('git describe --tags --abbrev=0 --match "v[0-9]*"');
  } catch {
    try {
      return lines(sh("git rev-list --max-parents=0 HEAD")).pop() ?? null;
    } catch {
      return null;
    }
  }
}
// Paths outside versioning (e.g. the prompt log): belong to no part and need no changelog.
// Changelog files do not count as changes to their part: editing a changelog needs no changelog entry.
const changelogFiles = () =>
  new Set([
    config.project?.changelog,
    ...Object.values(config.components ?? {}).map((c) => c.changelog),
  ]);
const isIgnored = (file) =>
  changelogFiles().has(file) ||
  (config.ignore ?? []).some((p) =>
    p.endsWith("/") ? file.startsWith(p) : file === p,
  );

function changedFiles(base) {
  const tracked = base
    ? lines(sh(`git diff --name-only ${base}`))
    : lines(sh("git ls-files"));
  const untracked = lines(sh("git ls-files --others --exclude-standard"));
  return [...new Set([...tracked, ...untracked])];
}
// Each file belongs to the part with the longest matching path; no match → project level.
function ownerOf(file) {
  let best = null;
  let bestLen = -1;
  for (const [id, c] of Object.entries(config.components)) {
    for (const p of c.paths) {
      const hit = p.endsWith("/") ? file.startsWith(p) : file === p;
      if (hit && p.length > bestLen) {
        best = id;
        bestLen = p.length;
      }
    }
  }
  return best ?? "project";
}

function analyze() {
  const base = lastTag();
  const files = {};
  for (const f of changedFiles(base).filter((f) => !isIgnored(f)))
    (files[ownerOf(f)] ??= []).push(f);
  const touched = new Set(Object.keys(files));
  const rows = [];
  for (const [id, c] of Object.entries(config.components)) {
    const body = unreleased(c.changelog);
    rows.push({
      id,
      label: c.label,
      version: getVersion(c),
      touched: touched.has(id),
      level: levelOf(body),
    });
  }
  const projectBody = unreleased(config.project.changelog);
  return {
    base,
    rows,
    files,
    projectTouched: touched.has("project"),
    projectLevel: levelOf(projectBody),
  };
}

// ---------- commands ----------
function cmdList() {
  const { base } = analyze();
  console.log(`Project ${config.project.version}   (since: ${baseLabel(base)})`);
  for (const [, c] of Object.entries(config.components)) {
    console.log(`${c.label.padEnd(8)}${getVersion(c)}`);
  }
}

function cmdCheck({ quiet = false, json = false, auto = false } = {}) {
  if (auto && mode() === "off") return true;
  const { base, rows, projectTouched, projectLevel, files } = analyze();
  if (json) {
    const missing = rows
      .filter((r) => r.touched && r.level === "none")
      .map((r) => ({
        id: r.id,
        label: r.label,
        changelog: config.components[r.id].changelog,
        files: files[r.id] ?? [],
      }));
    if (projectTouched && projectLevel === "none")
      missing.push({
        id: "project",
        label: "project",
        changelog: config.project.changelog,
        files: files.project ?? [],
      });
    console.log(JSON.stringify({ base, mode: mode(), missing }, null, 2));
    if (missing.length) process.exitCode = 1;
    return !missing.length;
  }
  const errors = rows
    .filter((r) => r.touched && r.level === "none")
    .map(
      (r) =>
        `- ${r.label}: files changed since ${baseLabel(base)} but Unreleased in ${config.components[r.id].changelog} is empty`,
    );
  if (projectTouched && projectLevel === "none") {
    errors.push(
      `- project: files outside every part changed but Unreleased in ${config.project.changelog} is empty`,
    );
  }
  if (errors.length) {
    const hint =
      mode() === "off"
        ? ""
        : "\nCall the versioner subagent to fill it in (it runs: node scripts/version.mjs check --json).";
    console.error("CHANGELOG MISSING:\n" + errors.join("\n") + hint);
    process.exitCode = 1;
    return false;
  }
  if (!quiet) console.log("CHECK OK");
  return true;
}

function cmdRelease(dryRun, noTag) {
  if (!dryRun && sh("git status --porcelain")) {
    console.error("There are uncommitted changes. Commit before releasing.");
    process.exitCode = 1;
    return;
  }
  if (!cmdCheck({ quiet: true })) return;

  const { rows, projectLevel } = analyze();
  const releasing = rows.filter((r) => r.level !== "none");
  if (!releasing.length && projectLevel === "none") {
    console.log("Nothing to release (every Unreleased section is empty).");
    return;
  }

  // Date in local time (not UTC), as YYYY-MM-DD.
  const date = new Date().toLocaleDateString("sv-SE");
  const top = [projectLevel, ...releasing.map((r) => r.level)].reduce((a, b) =>
    LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b,
  );
  const projectLevelEff = effective(config.project.version, top);
  const projectVersion = bump(config.project.version, projectLevelEff);

  const plan = rows.map((r) => {
    const eff = r.level === "none" ? "none" : effective(r.version, r.level);
    return {
      ...r,
      level: eff,
      note: eff !== r.level ? ` (${r.level} lowered to ${eff} because 0.x)` : "",
      next: eff === "none" ? r.version : bump(r.version, eff),
    };
  });
  const projNote =
    projectLevelEff !== top
      ? ` (${top} lowered to ${projectLevelEff} because 0.x)`
      : "";
  console.log(
    `Project: ${config.project.version} → ${projectVersion} — ${projectLevelEff}${projNote}`,
  );
  for (const r of plan) {
    console.log(
      `  ${r.label.padEnd(8)}${r.level === "none" ? `${r.version} (unchanged)` : `${r.version} → ${r.next} — ${r.level}${r.note}`}`,
    );
  }
  if (dryRun) return;

  for (const r of plan.filter((r) => r.level !== "none")) {
    const c = config.components[r.id];
    setVersion(c, r.next);
    stamp(c.changelog, r.next, date);
  }

  const table = [
    "| Part | Version | Change | Changelog |",
    "| --- | --- | --- | --- |",
    ...plan.map((r) => {
      const c = config.components[r.id];
      return `| ${r.label} | ${r.next} | ${r.level === "none" ? "—" : r.level} | [${c.changelog}](${c.changelog}) |`;
    }),
  ].join("\n");
  stamp(config.project.changelog, projectVersion, date, table);
  config.project.version = projectVersion;
  writeFileSync(CONFIG, JSON.stringify(config, null, 2) + "\n");

  // Reformat the files just written if the repo has Prettier (optional).
  formatIfPossible("CHANGELOG.md '**/CHANGELOG.md' versions.json");

  sh("git add -A");
  sh(`git commit -q -m "release: v${projectVersion}"`);
  if (noTag) {
    console.log(
      `Committed release: v${projectVersion}. Open a PR with /ship; CI tags it after merge.`,
    );
    return;
  }
  sh(`git tag -a v${projectVersion} -m "v${projectVersion}"`);
  console.log(
    `Committed and tagged v${projectVersion}. Push: git push && git push origin v${projectVersion}`,
  );
}

// Tag the release commit after merge (GitHub rebase-merge changes commit hashes, so it cannot be tagged earlier).
function cmdTag() {
  const tag = `v${config.project.version}`;
  const subject = sh("git log -1 --format=%s");
  if (subject !== `release: ${tag}`) {
    console.error(
      `HEAD is not the "release: ${tag}" commit (it is "${subject}") — not tagging.`,
    );
    process.exitCode = 1;
    return;
  }
  try {
    sh(`git rev-parse -q --verify "refs/tags/${tag}"`);
    console.error(`Tag ${tag} already exists.`);
    process.exitCode = 1;
    return;
  } catch {
    /* no tag yet: create it */
  }
  sh(`git tag -a ${tag} -m "${tag}"`);
  console.log(tag);
}

function cmdInit() {
  if (existsSync(CONFIG)) {
    console.error(`${CONFIG} already exists — not overwriting.`);
    process.exitCode = 1;
    return;
  }
  const components = {};
  for (const group of ["apps", "packages"]) {
    if (!existsSync(group)) continue;
    for (const name of readdirSync(group).sort()) {
      const pkg = join(group, name, "package.json");
      if (!existsSync(pkg)) continue;
      const j = JSON.parse(readFileSync(pkg, "utf8"));
      if (!j.version) {
        j.version = "0.1.0";
        writeFileSync(pkg, JSON.stringify(j, null, 2) + "\n");
      }
      const changelog = join(group, name, "CHANGELOG.md");
      if (!existsSync(changelog)) writeFileSync(changelog, CHANGELOG_HEADER);
      components[name] = {
        label: name,
        paths: [`${group}/${name}/`],
        package: pkg,
        changelog,
      };
    }
  }
  if (!existsSync("CHANGELOG.md"))
    writeFileSync("CHANGELOG.md", CHANGELOG_HEADER);
  const rootVersion = existsSync("package.json")
    ? JSON.parse(readFileSync("package.json", "utf8")).version
    : null;
  const out = {
    automation: { mode: "changelog", confirmRelease: true },
    ignore: ["history/", ".claude/state/", "docs/decisions/", "docs/specs/"],
    project: { version: rootVersion ?? "0.1.0", changelog: "CHANGELOG.md" },
    components,
  };
  writeFileSync(CONFIG, JSON.stringify(out, null, 2) + "\n");
  formatIfPossible(
    "versions.json 'apps/*/package.json' 'packages/*/package.json'",
  );
  console.log(
    `Created ${CONFIG} with ${Object.keys(components).length} parts: ${Object.keys(components).join(", ")}. Mode: changelog.`,
  );
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "init") cmdInit();
else if (cmd === "mode") console.log(mode());
else if (cmd === "list") cmdList();
else if (cmd === "check")
  cmdCheck({ json: args.includes("--json"), auto: args.includes("--auto") });
else if (cmd === "release")
  cmdRelease(args.includes("--dry-run"), args.includes("--no-tag"));
else if (cmd === "tag") cmdTag();
else {
  console.log(
    "Usage: node scripts/version.mjs <init|list|mode|check [--json] [--auto]|release [--dry-run] [--no-tag]|tag>",
  );
  process.exitCode = cmd ? 1 : 0;
}
