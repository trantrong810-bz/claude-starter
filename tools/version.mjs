#!/usr/bin/env node
// Version cho từng phần của repo + changelog mỗi phần. Không phụ thuộc thư viện ngoài.
//
//   node tools/version.mjs list               version hiện tại của mọi phần
//   node tools/version.mjs check              phần nào đổi file từ bản phát hành trước mà chưa ghi changelog
//   node tools/version.mjs release [--dry-run] bump các phần có Unreleased, ghi changelog, commit, tag vX.Y.Z
//
// Mức bump suy ra từ mục Unreleased: "### Removed" hoặc chữ BREAKING → major; "### Added" → minor; còn lại → patch.
// Với version 0.x, major được hạ xuống minor (quy ước SemVer cho giai đoạn chưa ổn định).

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const root = execSync("git rev-parse --show-toplevel").toString().trim();
process.chdir(root);

const CONFIG = "versions.json";
const config = JSON.parse(readFileSync(CONFIG, "utf8"));
const LEVELS = ["none", "patch", "minor", "major"];

const sh = (cmd) =>
  execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
const lines = (s) => s.split("\n").filter(Boolean);

// ---------- version ----------
function getVersion(c) {
  return c.package ? JSON.parse(readFileSync(c.package, "utf8")).version : c.version;
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
// Ở 0.x, thay đổi phá vỡ chỉ bump minor (quy ước SemVer cho giai đoạn chưa ổn định).
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

function unreleased(file) {
  if (!existsSync(file)) return "";
  const m = readFileSync(file, "utf8").match(UNRELEASED);
  return m ? m[1].trim() : "";
}
function hasEntries(body) {
  return /^\s*[-*] \S/m.test(body);
}
function levelOf(body) {
  if (!hasEntries(body)) return "none";
  const section = (name) => {
    const m = body.match(new RegExp(`^### ${name}\\s*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, "m"));
    return m ? hasEntries(m[1]) : false;
  };
  if (section("Removed") || /BREAKING/.test(body)) return "major";
  if (section("Added")) return "minor";
  return "patch";
}
function stamp(file, version, date, extra = "") {
  const text = readFileSync(file, "utf8");
  const body = unreleased(file);
  const block = `## [Unreleased]\n\n## [${version}] - ${date}\n\n${body}${extra ? `\n\n${extra}` : ""}\n\n`;
  writeFileSync(file, text.replace(UNRELEASED, block).replace(/\n{3,}/g, "\n\n"));
}

// ---------- thay đổi kể từ bản phát hành trước ----------
function lastTag() {
  try {
    return sh("git describe --tags --abbrev=0 --match 'v[0-9]*'");
  } catch {
    return null;
  }
}
function changedFiles(base) {
  const tracked = base ? lines(sh(`git diff --name-only ${base}`)) : lines(sh("git ls-files"));
  const untracked = lines(sh("git ls-files --others --exclude-standard"));
  return [...new Set([...tracked, ...untracked])];
}
// Mỗi file thuộc phần có đường dẫn khớp dài nhất; không khớp phần nào → cấp dự án.
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
  const touched = new Set(changedFiles(base).map(ownerOf));
  const rows = [];
  for (const [id, c] of Object.entries(config.components)) {
    const body = unreleased(c.changelog);
    rows.push({ id, label: c.label, version: getVersion(c), touched: touched.has(id), level: levelOf(body) });
  }
  const projectBody = unreleased(config.project.changelog);
  return { base, rows, projectTouched: touched.has("project"), projectLevel: levelOf(projectBody) };
}

// ---------- lệnh ----------
function cmdList() {
  const { base } = analyze();
  console.log(`Dự án   ${config.project.version}   (tag gần nhất: ${base ?? "chưa có"})`);
  for (const [, c] of Object.entries(config.components)) {
    console.log(`${c.label.padEnd(8)}${getVersion(c)}`);
  }
}

function cmdCheck({ quiet = false } = {}) {
  const { base, rows, projectTouched, projectLevel } = analyze();
  const errors = rows
    .filter((r) => r.touched && r.level === "none")
    .map(
      (r) =>
        `- ${r.label}: có file thay đổi từ ${base ?? "đầu"} nhưng Unreleased trong ${config.components[r.id].changelog} trống`,
    );
  if (projectTouched && projectLevel === "none") {
    errors.push(
      `- dự án: file ngoài mọi phần đã đổi nhưng Unreleased trong ${config.project.changelog} trống`,
    );
  }
  if (errors.length) {
    console.error("CHANGELOG THIẾU:\n" + errors.join("\n"));
    process.exitCode = 1;
    return false;
  }
  if (!quiet) console.log("CHECK OK");
  return true;
}

function cmdRelease(dryRun) {
  if (!dryRun && sh("git status --porcelain")) {
    console.error("Còn thay đổi chưa commit. Commit trước khi phát hành.");
    process.exitCode = 1;
    return;
  }
  if (!cmdCheck({ quiet: true })) return;

  const { rows, projectLevel } = analyze();
  const releasing = rows.filter((r) => r.level !== "none");
  if (!releasing.length && projectLevel === "none") {
    console.log("Không có gì để phát hành (mọi mục Unreleased đều trống).");
    return;
  }

  // Ngày theo giờ máy (không phải UTC), dạng YYYY-MM-DD.
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
      note: eff !== r.level ? ` (${r.level} hạ xuống ${eff} vì 0.x)` : "",
      next: eff === "none" ? r.version : bump(r.version, eff),
    };
  });
  const projNote = projectLevelEff !== top ? ` (${top} hạ xuống ${projectLevelEff} vì 0.x)` : "";
  console.log(`Dự án: ${config.project.version} → ${projectVersion} — ${projectLevelEff}${projNote}`);
  for (const r of plan) {
    console.log(
      `  ${r.label.padEnd(8)}${r.level === "none" ? `${r.version} (giữ nguyên)` : `${r.version} → ${r.next} — ${r.level}${r.note}`}`,
    );
  }
  if (dryRun) return;

  for (const r of plan.filter((r) => r.level !== "none")) {
    const c = config.components[r.id];
    setVersion(c, r.next);
    stamp(c.changelog, r.next, date);
  }

  const table = [
    "| Phần | Version | Thay đổi | Changelog |",
    "| --- | --- | --- | --- |",
    ...plan.map((r) => {
      const c = config.components[r.id];
      return `| ${r.label} | ${r.next} | ${r.level === "none" ? "—" : r.level} | [${c.changelog}](${c.changelog}) |`;
    }),
  ].join("\n");
  stamp(config.project.changelog, projectVersion, date, table);
  config.project.version = projectVersion;
  writeFileSync(CONFIG, JSON.stringify(config, null, 2) + "\n");

  // Định dạng lại các file vừa ghi nếu repo có Prettier (không bắt buộc).
  try {
    sh("npx --no-install prettier --write --log-level=warn CHANGELOG.md '**/CHANGELOG.md' versions.json");
  } catch {
    /* không có Prettier: giữ nguyên */
  }

  sh("git add -A");
  sh(`git commit -q -m "release: v${projectVersion}"`);
  sh(`git tag -a v${projectVersion} -m "v${projectVersion}"`);
  console.log(`Đã commit và tag v${projectVersion}. Push: git push && git push origin v${projectVersion}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "list") cmdList();
else if (cmd === "check") cmdCheck();
else if (cmd === "release") cmdRelease(args.includes("--dry-run"));
else {
  console.log("Dùng: node tools/version.mjs <list|check|release [--dry-run]>");
  process.exitCode = cmd ? 1 : 0;
}
