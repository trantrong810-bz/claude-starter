#!/usr/bin/env node
// Version cho từng phần của repo + changelog mỗi phần. Không phụ thuộc thư viện ngoài.
//
//   node scripts/version.mjs init                  tạo versions.json + CHANGELOG.md cho dự án (apps/*, packages/*)
//   node scripts/version.mjs list                  version hiện tại của mọi phần
//   node scripts/version.mjs mode                  chế độ tự động đang áp dụng: off | changelog | full
//   node scripts/version.mjs check [--json] [--auto]
//        phần nào đổi file từ bản phát hành trước mà Unreleased còn trống.
//        --json: in danh sách cho subagent versioner. --auto: không làm gì nếu chế độ là off.
//   node scripts/version.mjs release [--dry-run]   bump các phần có Unreleased, ghi changelog, commit, tag vX.Y.Z
//
// Cấu hình tự động trong versions.json:  "automation": { "mode": "changelog", "confirmRelease": true }
//   off: không tự động, không chặn commit · changelog: chặn commit thiếu changelog, versioner tự điền
//   full: như changelog + tự phát hành sau khi merge (hỏi trước nếu confirmRelease)
// Ghi đè cho một session trên máy: CLAUDE_AUTO_VERSION=off
//
// Mức bump suy ra từ mục Unreleased: "### Removed" hoặc mục bắt đầu bằng BREAKING → major; "### Added" → minor; còn lại → patch.
// Với version 0.x, major được hạ xuống minor (quy ước SemVer cho giai đoạn chưa ổn định).

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Chạy ở gốc repo git; ngoài repo git (ví dụ trước khi git init) thì dùng thư mục hiện tại.
try {
  process.chdir(
    execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim(),
  );
} catch {
  /* không phải repo git */
}

const CONFIG = "versions.json";
const MODES = ["off", "changelog", "full"];
const CHANGELOG_HEADER = `# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/); version theo [SemVer](https://semver.org/lang/vi/).
Ghi thay đổi vào mục \`Unreleased\` cùng commit (subagent \`versioner\` tự điền khi bật tự động); \`node scripts/version.mjs release\` chuyển nó thành version mới.

## [Unreleased]
`;
const cmd0 = process.argv[2];
if (cmd0 !== "init" && !existsSync(CONFIG)) {
  console.error(`Chưa có ${CONFIG}. Chạy: node scripts/version.mjs init`);
  process.exit(cmd0 === "check" && process.argv.includes("--auto") ? 0 : 1);
}
const config = cmd0 === "init" ? {} : JSON.parse(readFileSync(CONFIG, "utf8"));

function mode() {
  if (String(process.env.CLAUDE_AUTO_VERSION ?? "").toLowerCase() === "off") return "off";
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

// Chuẩn hoá CRLF: file có thể bị checkout với CRLF trên Windows.
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
    const m = body.match(new RegExp(`^### ${name}\\s*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, "m"));
    return m ? hasEntries(m[1]) : false;
  };
  if (section("Removed") || /^\s*[-*]\s+(\*\*)?BREAKING\b/m.test(body)) return "major";
  if (section("Added")) return "minor";
  return "patch";
}
function stamp(file, version, date, extra = "") {
  const text = readText(file);
  const body = unreleased(file);
  const block = `## [Unreleased]\n\n## [${version}] - ${date}\n\n${body}${extra ? `\n\n${extra}` : ""}\n\n`;
  writeFileSync(file, text.replace(UNRELEASED, block).replace(/\n{3,}/g, "\n\n"));
}

// ---------- thay đổi kể từ bản phát hành trước ----------
// Mốc so sánh: tag phát hành gần nhất; dự án chưa phát hành thì dùng commit đầu tiên.
// Mô tả mốc so sánh cho người đọc: tên tag, hoặc "commit đầu <mã ngắn>" khi chưa phát hành.
function baseLabel(base) {
  if (!base) return "đầu";
  return /^v\d/.test(base) ? base : `commit đầu ${base.slice(0, 7)} (chưa phát hành)`;
}
// Định dạng file vừa ghi nếu repo có Prettier (không bắt buộc).
function formatIfPossible(globs) {
  try {
    sh(`npx --no-install prettier --write --log-level=warn ${globs}`);
  } catch {
    /* không có Prettier: giữ nguyên */
  }
}
function lastTag() {
  try {
    // Nháy kép: cmd.exe (execSync trên Windows) không hiểu nháy đơn.
    return sh('git describe --tags --abbrev=0 --match "v[0-9]*"');
  } catch {
    try {
      return lines(sh("git rev-list --max-parents=0 HEAD")).pop() ?? null;
    } catch {
      return null;
    }
  }
}
// Đường dẫn nằm ngoài versioning (ví dụ log prompt): không thuộc phần nào, không đòi changelog.
// File changelog không tính là thay đổi của phần: sửa changelog không đòi ghi changelog.
const changelogFiles = () =>
  new Set([config.project?.changelog, ...Object.values(config.components ?? {}).map((c) => c.changelog)]);
const isIgnored = (file) =>
  changelogFiles().has(file) ||
  (config.ignore ?? []).some((p) => (p.endsWith("/") ? file.startsWith(p) : file === p));

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
  const files = {};
  for (const f of changedFiles(base).filter((f) => !isIgnored(f))) (files[ownerOf(f)] ??= []).push(f);
  const touched = new Set(Object.keys(files));
  const rows = [];
  for (const [id, c] of Object.entries(config.components)) {
    const body = unreleased(c.changelog);
    rows.push({ id, label: c.label, version: getVersion(c), touched: touched.has(id), level: levelOf(body) });
  }
  const projectBody = unreleased(config.project.changelog);
  return { base, rows, files, projectTouched: touched.has("project"), projectLevel: levelOf(projectBody) };
}

// ---------- lệnh ----------
function cmdList() {
  const { base } = analyze();
  console.log(`Dự án   ${config.project.version}   (mốc: ${baseLabel(base)})`);
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
        label: "dự án",
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
        `- ${r.label}: có file thay đổi từ ${baseLabel(base)} nhưng Unreleased trong ${config.components[r.id].changelog} trống`,
    );
  if (projectTouched && projectLevel === "none") {
    errors.push(
      `- dự án: file ngoài mọi phần đã đổi nhưng Unreleased trong ${config.project.changelog} trống`,
    );
  }
  if (errors.length) {
    const hint =
      mode() === "off"
        ? ""
        : "\nGọi subagent versioner để điền (nó chạy: node scripts/version.mjs check --json).";
    console.error("CHANGELOG THIẾU:\n" + errors.join("\n") + hint);
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
  formatIfPossible("CHANGELOG.md '**/CHANGELOG.md' versions.json");

  sh("git add -A");
  sh(`git commit -q -m "release: v${projectVersion}"`);
  sh(`git tag -a v${projectVersion} -m "v${projectVersion}"`);
  console.log(`Đã commit và tag v${projectVersion}. Push: git push && git push origin v${projectVersion}`);
}

function cmdInit() {
  if (existsSync(CONFIG)) {
    console.error(`${CONFIG} đã tồn tại — không ghi đè.`);
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
      components[name] = { label: name, paths: [`${group}/${name}/`], package: pkg, changelog };
    }
  }
  if (!existsSync("CHANGELOG.md")) writeFileSync("CHANGELOG.md", CHANGELOG_HEADER);
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
  formatIfPossible("versions.json 'apps/*/package.json' 'packages/*/package.json'");
  console.log(
    `Đã tạo ${CONFIG} với ${Object.keys(components).length} phần: ${Object.keys(components).join(", ")}. Chế độ: changelog.`,
  );
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "init") cmdInit();
else if (cmd === "mode") console.log(mode());
else if (cmd === "list") cmdList();
else if (cmd === "check") cmdCheck({ json: args.includes("--json"), auto: args.includes("--auto") });
else if (cmd === "release") cmdRelease(args.includes("--dry-run"));
else {
  console.log("Dùng: node scripts/version.mjs <init|list|mode|check [--json] [--auto]|release [--dry-run]>");
  process.exitCode = cmd ? 1 : 0;
}
