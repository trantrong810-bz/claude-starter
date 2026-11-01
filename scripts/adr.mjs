#!/usr/bin/env node
// Quản lý ADR (Architecture Decision Record) trong docs/decisions/. Không phụ thuộc thư viện ngoài.
//
//   node scripts/adr.mjs new <slug> [--rong] [--model <id>]   tạo ADR mới từ mẫu, số kế tiếp
//   node scripts/adr.mjs index                                 sinh lại docs/decisions/README.md
//   node scripts/adr.mjs check                                 kiểm tra (chạy trong verify)
//
// Quyết định ảnh hưởng rộng (≥2 phần, đổi quy trình/contract dùng chung, hoặc khó đảo ngược):
// pham-vi: rong, tên file có chữ R (0003R-ten.md), nằm ở bảng riêng trên cùng của mục lục.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "docs/decisions";
const INDEX = join(DIR, "README.md");
const TEMPLATE = join(DIR, "_template.md");
const NAME = /^(\d{4})(R?)-([a-z0-9-]+)\.md$/;
const STATUSES = { "de-xuat": "Đề xuất", "chap-nhan": "Chấp nhận", "bi-thay-the": "Bị thay thế" };
const SCOPES = ["rong", "tinh-nang"];

function parse(file) {
  // Chuẩn hoá CRLF: file có thể bị checkout với CRLF trên Windows.
  const text = readFileSync(join(DIR, file), "utf8").replace(/\r\n/g, "\n");
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const meta = {};
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const m = line.match(/^([a-z-]+):\s*(.*?)\s*(#.*)?$/);
      if (m) meta[m[1]] = m[2];
    }
  }
  const title = (text.match(/^# (.+)$/m) ?? [])[1] ?? "(chưa có tiêu đề)";
  return { file, meta, title, hasFrontmatter: !!fm };
}

function load() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md" && !f.startsWith("_"))
    .sort()
    .map(parse);
}

function renderIndex(adrs) {
  const row = (a) => {
    const st = STATUSES[a.meta["trang-thai"]] ?? a.meta["trang-thai"];
    const title = a.meta["trang-thai"] === "bi-thay-the" ? `~~${a.title}~~` : a.title;
    const by = a.meta["thay-the-boi"] ? ` → ${a.meta["thay-the-boi"]}` : "";
    return `| ${a.meta.so} | [${title}](${a.file}) | ${st}${by} | ${a.meta.ngay ?? ""} | ${a.meta.model ?? ""} |`;
  };
  const table = (list) =>
    list.length
      ? [
          "| Số | Quyết định | Trạng thái | Ngày | Model |",
          "| --- | --- | --- | --- | --- |",
          ...list.map(row),
        ].join("\n")
      : "_Chưa có._";
  const broad = adrs.filter((a) => a.meta["pham-vi"] === "rong");
  const feature = adrs.filter((a) => a.meta["pham-vi"] !== "rong");
  return `# Quyết định (ADR)

> File này do \`node scripts/adr.mjs index\` sinh ra — đừng sửa tay.
> Mọi quyết định có tranh cãi đều có ADR. Tra cứu nhanh: \`/why <câu hỏi>\`.

## Ảnh hưởng rộng (R)

Ảnh hưởng từ 2 phần trở lên, đổi quy trình hoặc contract dùng chung, hoặc khó đảo ngược.

${table(broad)}

## Cấp tính năng

${table(feature)}
`;
}

function check() {
  const adrs = load();
  const errors = [];
  const byNo = new Map();
  for (const a of adrs) {
    const m = a.file.match(NAME);
    if (!m) {
      errors.push(`${a.file}: tên file phải dạng 0001-ten.md hoặc 0001R-ten.md`);
      continue;
    }
    if (!a.hasFrontmatter) errors.push(`${a.file}: thiếu frontmatter`);
    const [, no, r] = m;
    if (a.meta.so !== no) errors.push(`${a.file}: so (${a.meta.so}) không khớp tên file (${no})`);
    if (byNo.has(no)) errors.push(`${a.file}: trùng số ${no} với ${byNo.get(no).file}`);
    byNo.set(no, a);
    if (!SCOPES.includes(a.meta["pham-vi"])) errors.push(`${a.file}: pham-vi phải là rong hoặc tinh-nang`);
    if ((a.meta["pham-vi"] === "rong") !== (r === "R"))
      errors.push(`${a.file}: chữ R trong tên file phải khớp pham-vi: rong`);
    if (!STATUSES[a.meta["trang-thai"]])
      errors.push(`${a.file}: trang-thai phải là ${Object.keys(STATUSES).join(" | ")}`);
    if (!a.meta.model) errors.push(`${a.file}: thiếu model (model đã đưa ra quyết định)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.meta.ngay ?? "")) errors.push(`${a.file}: ngay phải dạng YYYY-MM-DD`);
  }
  for (const a of adrs) {
    const by = a.meta["thay-the-boi"];
    if (a.meta["trang-thai"] === "bi-thay-the") {
      const target = byNo.get(by);
      if (!target)
        errors.push(`${a.file}: bi-thay-the nhưng thay-the-boi (${by || "trống"}) không trỏ tới ADR có thật`);
      else if (target.meta["trang-thai"] === "bi-thay-the" && !target.meta["thay-the-boi"])
        errors.push(`${a.file}: ADR thay thế ${by} cũng đã bị thay thế mà không trỏ tiếp`);
    } else if (by) {
      errors.push(`${a.file}: có thay-the-boi nhưng trang-thai không phải bi-thay-the`);
    }
  }
  // So sánh bỏ qua khoảng trắng căn lề bảng (Prettier định dạng lại mục lục).
  const norm = (s) =>
    s
      .split("\n")
      .map((l) =>
        l
          .trim()
          .replace(/\s*\|\s*/g, "|")
          .replace(/-{3,}/g, "---"),
      )
      .filter(Boolean)
      .join("\n");
  const expected = renderIndex(adrs);
  if (!existsSync(INDEX) || norm(readFileSync(INDEX, "utf8").replace(/\r/g, "")) !== norm(expected))
    errors.push(`${INDEX}: mục lục chưa cập nhật — chạy: node scripts/adr.mjs index`);
  if (errors.length) {
    console.error("ADR LỖI:\n" + errors.map((e) => "- " + e).join("\n"));
    process.exit(1);
  }
}

function create(args) {
  const slug = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--model");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.error("Dùng: node scripts/adr.mjs new <slug-chu-thuong> [--rong] [--model <id>]");
    process.exit(1);
  }
  const broad = args.includes("--rong");
  const model = args.includes("--model") ? args[args.indexOf("--model") + 1] : "";
  const adrs = load();
  const next = String(Math.max(0, ...adrs.map((a) => Number(a.meta.so) || 0)) + 1).padStart(4, "0");
  const file = `${next}${broad ? "R" : ""}-${slug}.md`;
  const today = new Date().toLocaleDateString("sv-SE");
  const body = readFileSync(TEMPLATE, "utf8")
    .replace("so: 0000", `so: ${next}`)
    .replace("pham-vi: tinh-nang", `pham-vi: ${broad ? "rong" : "tinh-nang"}`)
    .replace("ngay: YYYY-MM-DD", `ngay: ${today}`)
    .replace(/^model:.*$/m, `model: ${model}`);
  writeFileSync(join(DIR, file), body);
  writeFileSync(INDEX, renderIndex(load()));
  console.log(join(DIR, file));
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "check") check();
else if (cmd === "index") writeFileSync(INDEX, renderIndex(load()));
else if (cmd === "new") create(args);
else {
  console.log("Dùng: node scripts/adr.mjs <new|index|check>");
  process.exit(cmd ? 1 : 0);
}
