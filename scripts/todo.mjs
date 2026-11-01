#!/usr/bin/env node
// Todo theo từng phần, hai lớp. Không phụ thuộc thư viện ngoài.
//
//   docs/todo/<phần>.md        người viết tay. Script không bao giờ ghi file này.
//   docs/todo/<phần>.auto.md   Claude ghi (Đang làm, Việc cần làm, Xong gần đây) + mục "Từ viết tay" sinh tự động.
//   TODO.md                    tổng quan mọi phần, sinh tự động toàn bộ.
//
//   node scripts/todo.mjs sync     đồng bộ viết tay → auto, rồi sinh lại TODO.md. Chạy lại vô hại.
//   node scripts/todo.mjs check    TODO.md và mục "Từ viết tay" có khớp không (chạy trong verify)
//   node scripts/todo.mjs brief    vài dòng cho hook SessionStart: tổng số + việc đang làm
//
// Quy ước duy nhất trong file viết tay: việc là dòng "- [ ] ..." (xong: "- [x] ..."), "[P1]" tuỳ chọn.
// Việc bắt đầu từ file viết tay: item "Đang làm" dùng nguyên chữ của việc đó làm tiêu đề, kèm
// "từ: [be.md#L12](be.md#L12)". sync tìm lại theo chữ khi số dòng lệch; việc gốc đã [x] → chuyển sang "Xong gần đây".

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { posix } from "node:path";

const { join } = posix;

try {
  process.chdir(
    execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim(),
  );
} catch {}

const SCOPES = ["root", "shared", "be", "fe", "mobile"];
const DIR = "docs/todo";
const OVERVIEW = "TODO.md";
const DONE_MAX = 10;
const MIRROR_START =
  "<!-- todo:manual:start — sinh bởi node scripts/todo.mjs sync, đừng sửa tay -->";
const MIRROR_END = "<!-- todo:manual:end -->";
const OPEN = /^\s*- \[ \] (.*)$/;
const CLOSED = /^\s*- \[[xX]\] (.*)$/;
const FROM = /từ: \[([a-z]+\.md)#L(\d+)\]\([^)]*\)/;
const GONE = " (việc gốc đã bị xoá khỏi file viết tay)";

const manualPath = (s) => join(DIR, `${s}.md`);
const autoPath = (s) => join(DIR, `${s}.auto.md`);
const readText = (file) =>
  existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
// Chữ của một việc, bỏ ưu tiên và khoảng trắng thừa — dùng để so khớp việc viết tay với item "Đang làm".
const key = (text) =>
  text
    .replace(/\[P\d\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const title = (text) => text.split(" — ")[0].trim();
const branchOf = (text) => (text.match(/nhánh: ([^\s·]+)/) ?? [])[1];

const manualSkeleton = (s) => `# Todo viết tay: ${s}

Viết tự do. Việc là dòng \`- [ ] ...\` (thêm \`[P1]\` nếu gấp), xong thì đánh \`[x]\`. Claude chỉ đọc file này.
`;

const autoSkeleton = (s) => `# Todo tự động: ${s}

← [Tổng quan](../../TODO.md) · Viết tay: [${s}.md](${s}.md)

## Từ viết tay

${MIRROR_START}
${MIRROR_END}

## Đang làm

## Việc cần làm

## Xong gần đây
`;

// --- Đọc ---

function manualItems(s) {
  const lines = (readText(manualPath(s)) ?? "").split("\n");
  const items = [];
  lines.forEach((line, i) => {
    const open = line.match(OPEN);
    const closed = line.match(CLOSED);
    if (open) items.push({ line: i + 1, text: open[1].trim(), done: false });
    else if (closed)
      items.push({ line: i + 1, text: closed[1].trim(), done: true });
  });
  return items;
}

// Các mục "## ..." của file auto: { name, start, end } theo chỉ số dòng (end không gồm).
function sections(lines) {
  const out = [];
  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      if (out.length) out.at(-1).end = i;
      out.push({ name: line.slice(3).trim(), start: i + 1, end: lines.length });
    }
  });
  return out;
}

// Item cấp 1 "- [ ] ..." trong một mục, kèm các dòng thụt lề đi theo nó.
function blocks(lines, sec) {
  const out = [];
  if (!sec) return out;
  for (let i = sec.start; i < sec.end; i++) {
    const line = lines[i];
    if (/^- \[[ xX]\] /.test(line)) out.push({ head: i, end: i + 1 });
    else if (out.length && /^\s+\S/.test(line) && out.at(-1).end === i)
      out.at(-1).end = i + 1;
  }
  return out;
}

function autoStats(s) {
  const lines = (readText(autoPath(s)) ?? "").split("\n");
  const secs = sections(lines);
  const get = (name) => secs.find((x) => x.name === name);
  const openIn = (name) =>
    blocks(lines, get(name))
      .map((b) => lines[b.head])
      .filter((l) => l.startsWith("- [ ] "))
      .map((l) => l.slice(6).trim());
  return { wip: openIn("Đang làm"), todo: openIn("Việc cần làm") };
}

// --- Đồng bộ viết tay → auto ---

function mirrorLines(s, items) {
  const open = items.filter((it) => !it.done);
  const p1 = open.filter((it) => /\[P1\]/.test(it.text));
  const rest = open.filter((it) => !/\[P1\]/.test(it.text));
  return [...p1, ...rest].map(
    (it) => `- ${it.text} — [${s}.md#L${it.line}](${s}.md#L${it.line})`,
  );
}

function syncAuto(s, today) {
  const file = autoPath(s);
  let text = readText(file) ?? autoSkeleton(s);
  const items = manualItems(s);

  // Mục "Từ viết tay": thay toàn bộ nội dung giữa marker.
  const mirror = mirrorLines(s, items);
  const a = text.indexOf(MIRROR_START);
  const b = text.indexOf(MIRROR_END);
  if (a === -1 || b === -1) {
    text = text.replace(
      /\n## /,
      `\n## Từ viết tay\n\n${MIRROR_START}\n${MIRROR_END}\n\n## `,
    );
  }
  const start = text.indexOf(MIRROR_START) + MIRROR_START.length;
  text =
    text.slice(0, start) +
    "\n" +
    (mirror.length ? "\n" + mirror.join("\n") + "\n\n" : "") +
    text.slice(text.indexOf(MIRROR_END));

  // Item "Đang làm" trỏ về file viết tay: sửa số dòng, chuyển sang Xong khi việc gốc đã [x].
  const lines = text.split("\n");
  const secs = sections(lines);
  const wipSec = secs.find((x) => x.name === "Đang làm");
  const doneSec = secs.find((x) => x.name === "Xong gần đây");
  const finished = [];
  for (const blk of blocks(lines, wipSec)) {
    const head = lines[blk.head];
    const from = head.match(FROM);
    if (!from || from[1] !== `${s}.md` || !head.startsWith("- [ ] ")) continue;
    const t = key(title(head.slice(6)));
    const at = items.find(
      (it) => it.line === Number(from[2]) && key(it.text) === t,
    );
    const found = at ?? items.find((it) => key(it.text) === t);
    if (!found) {
      if (!head.includes(GONE)) lines[blk.head] = head + GONE;
      continue;
    }
    lines[blk.head] = head
      .replace(FROM, `từ: [${s}.md#L${found.line}](${s}.md#L${found.line})`)
      .replace(GONE, "");
    if (found.done) finished.push(blk);
  }
  if (finished.length && doneSec) {
    const moved = finished.map(
      (blk) =>
        `- [x] ${title(lines[blk.head].slice(6))} (${today}, đánh dấu trong ${s}.md)`,
    );
    // Xoá từ dưới lên để chỉ số không lệch, rồi chèn đầu mục Xong.
    for (const blk of [...finished].reverse())
      lines.splice(blk.head, blk.end - blk.head);
    const secs2 = sections(lines);
    const done2 = secs2.find((x) => x.name === "Xong gần đây");
    const old = blocks(lines, done2).map((blk) =>
      lines.slice(blk.head, blk.end).join("\n"),
    );
    const kept = [...moved, ...old].slice(0, DONE_MAX);
    lines.splice(done2.start, done2.end - done2.start, "", ...kept, "");
  }
  text = tidy(lines.join("\n"));
  return { file, text };
}

// Đúng một dòng trống giữa các khối, một dòng trống quanh tiêu đề — giống Prettier để sync không làm bẩn diff.
function tidy(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const blank = line.trim() === "";
    if (blank && (out.length === 0 || out.at(-1) === "")) continue;
    if (line.startsWith("#") && out.length && out.at(-1) !== "") out.push("");
    if (!blank && out.length && out.at(-1).startsWith("#")) out.push("");
    out.push(blank ? "" : line);
  }
  while (out.at(-1) === "") out.pop();
  return out.join("\n") + "\n";
}

// --- TODO.md ---

function overview() {
  const rows = SCOPES.map((s) => {
    const manual = manualItems(s).filter((it) => !it.done);
    const { wip, todo } = autoStats(s);
    const p1 = [...manual.map((it) => it.text), ...wip, ...todo].filter((t) =>
      /\[P1\]/.test(t),
    ).length;
    const doing = wip.length
      ? `${key(title(wip[0]))}${branchOf(wip[0]) ? ` (${branchOf(wip[0])})` : ""}${wip.length > 1 ? ` +${wip.length - 1}` : ""}`
      : "—";
    return {
      cells: [
        s,
        `[${s}.md](docs/todo/${s}.md)`,
        `[${s}.auto.md](docs/todo/${s}.auto.md)`,
        String(wip.length),
        String(manual.length),
        String(todo.length),
        String(p1),
        doing.replace(/\|/g, "\\|"),
      ],
      wip: wip.length,
      manual: manual.length,
      todo: todo.length,
      p1,
    };
  });
  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);
  const table = [
    [
      "Phần",
      "Viết tay",
      "Tự động",
      "WIP",
      "Todo tay",
      "Todo auto",
      "P1",
      "Đang làm",
    ],
    ...rows.map((r) => r.cells),
    [
      "**Tổng**",
      "",
      "",
      `**${sum("wip")}**`,
      `**${sum("manual")}**`,
      `**${sum("todo")}**`,
      `**${sum("p1")}**`,
      "",
    ],
  ];
  return `# Todo — tổng quan

> Sinh tự động bởi \`node scripts/todo.mjs sync\` — đừng sửa tay. Sửa file viết tay hoặc file auto của từng phần.

${markdownTable(table)}

## Cách dùng

- **Viết tay**: \`docs/todo/<phần>.md\` — của bạn, viết tự do; việc là dòng \`- [ ] ...\` (\`[P1]\` nếu gấp). Claude chỉ đọc, chỉ được đánh \`[x]\` khi xong.
- **Tự động**: \`docs/todo/<phần>.auto.md\` — Claude ghi việc đang làm (đang dở, bước tiếp), việc phát hiện thêm, việc đã xong. Mục "Từ viết tay" là bản sao các việc còn mở của file viết tay.
- Commit file viết tay → hook tự đồng bộ file auto và \`TODO.md\` vào cùng commit.
- \`/todo\` xem/thêm việc · \`/handoff\` trước khi đổi máy hoặc tài khoản (lưu WIP, đẩy code dở lên \`wip/<nhánh>\`) · máy mới: \`git pull\` rồi \`/resume\`.
`;
}

// Bảng căn cột như Prettier (độ rộng theo số ký tự sau NFC) để file không đổi sau khi format.
function markdownTable(rows) {
  const width = (s) => [...s.normalize("NFC")].length;
  const cols = rows[0].map((_, c) =>
    Math.max(3, ...rows.map((r) => width(r[c]))),
  );
  const line = (r) =>
    "| " +
    r.map((cell, c) => cell + " ".repeat(cols[c] - width(cell))).join(" | ") +
    " |";
  return [
    line(rows[0]),
    "| " + cols.map((w) => "-".repeat(w)).join(" | ") + " |",
    ...rows.slice(1).map(line),
  ].join("\n");
}

// So sánh bỏ qua khoảng trắng/gạch căn cột — Prettier có thể căn khác một chút.
const loose = (t) =>
  (t ?? "")
    .replace(/-{3,}/g, "---")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();

// --- Lệnh ---

function sync(only) {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const changed = [];
  for (const s of SCOPES) {
    if (!existsSync(manualPath(s))) {
      writeFileSync(manualPath(s), manualSkeleton(s));
      changed.push(manualPath(s));
    }
    if (only.length && !only.includes(s) && existsSync(autoPath(s))) continue;
    const { file, text } = syncAuto(s, today);
    if (text !== readText(file)) {
      writeFileSync(file, text);
      changed.push(file);
    }
  }
  const text = overview();
  if (loose(text) !== loose(readText(OVERVIEW))) {
    writeFileSync(OVERVIEW, text);
    changed.push(OVERVIEW);
  }
  console.log(
    changed.length ? `Đã cập nhật: ${changed.join(", ")}` : "Todo đã đồng bộ.",
  );
}

function check() {
  const errors = [];
  for (const s of SCOPES) {
    if (!existsSync(manualPath(s)) || !existsSync(autoPath(s))) {
      errors.push(`thiếu ${manualPath(s)} hoặc ${autoPath(s)}`);
      continue;
    }
    const cur = readText(autoPath(s));
    const want = mirrorLines(s, manualItems(s)).join("\n");
    const a = cur.indexOf(MIRROR_START);
    const b = cur.indexOf(MIRROR_END);
    const have =
      a === -1 || b === -1 ? null : cur.slice(a + MIRROR_START.length, b);
    if (have === null || loose(have) !== loose(want))
      errors.push(`${autoPath(s)}: mục "Từ viết tay" lệch với ${s}.md`);
  }
  if (loose(readText(OVERVIEW)) !== loose(overview()))
    errors.push(`${OVERVIEW} lệch với docs/todo/`);
  if (errors.length) {
    console.error("Todo chưa đồng bộ — chạy: node scripts/todo.mjs sync");
    for (const e of errors) console.error(`- ${e}`);
    process.exit(1);
  }
}

function brief() {
  let wipTotal = 0;
  let todoTotal = 0;
  const lines = [];
  for (const s of SCOPES) {
    const { wip, todo } = autoStats(s);
    const manual = manualItems(s).filter((it) => !it.done).length;
    wipTotal += wip.length;
    todoTotal += todo.length + manual;
    for (const w of wip)
      lines.push(
        `- [${s}] ${title(w)}${branchOf(w) ? ` (nhánh ${branchOf(w)})` : ""}`,
      );
  }
  if (!wipTotal && !todoTotal) return;
  console.log(
    `Todo: ${wipTotal} đang làm, ${todoTotal} việc chờ — tổng quan trong TODO.md.`,
  );
  for (const l of lines) console.log(l);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "sync") sync(args.filter((a) => SCOPES.includes(a)));
else if (cmd === "check") check();
else if (cmd === "brief") brief();
else {
  console.error("Dùng: node scripts/todo.mjs sync [phần...] | check | brief");
  process.exit(1);
}
