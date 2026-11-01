#!/usr/bin/env node
// Mục lục sơ đồ quy trình: mỗi workflow là một file trong docs/workflows/, docs/WORKFLOW.md tự sinh.
//
//   node scripts/workflow.mjs index   sinh lại docs/WORKFLOW.md từ front-matter các file con
//   node scripts/workflow.mjs check   kiểm tra (chạy trong verify)
//
// Thêm workflow: chép docs/workflows/_template.md sang docs/workflows/<ten>.md, điền, chạy index.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "docs/workflows";
const INDEX = "docs/WORKFLOW.md";
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

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
  return { file, meta, hasFrontmatter: !!fm };
}

function load() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md" && !f.startsWith("_"))
    .map(parse)
    .sort(
      (a, b) =>
        (Number(a.meta["thu-tu"]) || 0) - (Number(b.meta["thu-tu"]) || 0) ||
        a.file.localeCompare(b.file),
    );
}

function renderIndex(flows) {
  const rows = flows.map(
    (w) =>
      `| ${w.meta["thu-tu"] ?? ""} | [${w.meta["tieu-de"] ?? w.file}](workflows/${w.file}) | ${w.meta["mo-ta"] ?? ""} |`,
  );
  return `# Quy trình làm việc với Claude Code

> File này do \`node scripts/workflow.mjs index\` sinh ra — đừng sửa tay.
> Sơ đồ phản ánh cấu hình hiện tại trong \`.claude/\`. Đổi command, hook, subagent hay quy tắc phân loại task → cập nhật sơ đồ trong \`docs/workflows/\` cùng commit.

Ô vàng trong sơ đồ là điểm bạn cần có mặt. Mọi bước khác Claude tự làm.

| # | Quy trình | Mô tả |
| --- | --- | --- |
${rows.join("\n")}

Thêm workflow: chép \`workflows/_template.md\` sang \`workflows/<ten>.md\`, điền front-matter và sơ đồ, rồi chạy \`node scripts/workflow.mjs index\`.
`;
}

function check() {
  const flows = load();
  const errors = [];
  const byNo = new Map();
  for (const w of flows) {
    if (!NAME.test(w.file))
      errors.push(`${w.file}: tên file phải kebab-case, chữ thường, không dấu`);
    if (!w.hasFrontmatter) errors.push(`${w.file}: thiếu frontmatter`);
    const no = w.meta["thu-tu"];
    if (!/^\d+$/.test(no ?? "")) errors.push(`${w.file}: thu-tu phải là số`);
    else if (byNo.has(no))
      errors.push(`${w.file}: trùng thu-tu ${no} với ${byNo.get(no).file}`);
    else byNo.set(no, w);
    if (!w.meta["tieu-de"]) errors.push(`${w.file}: thiếu tieu-de`);
    if (!w.meta["mo-ta"]) errors.push(`${w.file}: thiếu mo-ta`);
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
  const expected = renderIndex(flows);
  if (
    !existsSync(INDEX) ||
    norm(readFileSync(INDEX, "utf8").replace(/\r/g, "")) !== norm(expected)
  )
    errors.push(
      `${INDEX}: mục lục chưa cập nhật — chạy: node scripts/workflow.mjs index`,
    );
  if (errors.length) {
    console.error("WORKFLOW LỖI:\n" + errors.map((e) => "- " + e).join("\n"));
    process.exit(1);
  }
}

const [cmd] = process.argv.slice(2);
if (cmd === "check") check();
else if (cmd === "index") writeFileSync(INDEX, renderIndex(load()));
else {
  console.log("Dùng: node scripts/workflow.mjs <index|check>");
  process.exit(cmd ? 1 : 0);
}
