#!/usr/bin/env node
// Kiểm tra commit message theo docs/GIT.md (Conventional Commits, tiếng Anh). Không phụ thuộc thư viện ngoài.
//
//   node scripts/commit-msg.mjs <file>         git hook commit-msg (.githooks/commit-msg)
//   node scripts/commit-msg.mjs --message <m>  kiểm tra một message
//   node scripts/commit-msg.mjs --command      đọc lệnh bash từ stdin, lấy message từ -m/heredoc
//                                              (hook commit-guard.sh); không lấy được thì bỏ qua
//
// Exit 1 + lỗi ra stderr khi sai.

import { readFileSync } from "node:fs";

const TYPES = ["feat", "fix", "refactor", "perf", "test", "docs", "style", "build", "ci", "chore", "revert"];
const HEADER = new RegExp(`^(${TYPES.join("|")})(\\(([a-z0-9][a-z0-9-]*)\\))?(!)?: (.+)$`);
const RELEASE = /^release: v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
// Message do git tự tạo: chấp nhận nguyên dạng.
const GIT_GENERATED = /^(Merge |Revert "|fixup! |squash! |amend! )/;
const NOT_IMPERATIVE =
  /^(added|adds|fixed|fixes|updated|updates|removed|removes|changed|changes|created|creates|implemented|implements|refactored|refactors|renamed|renames|moved|moves|deleted|deletes|improved|improves)\b/i;
const MAX_HEADER = 72;

function lint(message) {
  const lines = message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => !l.startsWith("#")); // dòng chú thích của git
  while (lines.length && !lines[0].trim()) lines.shift();
  const header = lines[0] ?? "";
  if (!header.trim()) return ["message rỗng"];
  if (GIT_GENERATED.test(header) || RELEASE.test(header)) return [];

  const errors = [];
  const m = header.match(HEADER);
  if (!m) {
    errors.push(
      header.startsWith("release")
        ? `"release" chỉ dùng cho version.mjs: release: vX.Y.Z`
        : `header phải dạng <type>(<scope>): <subject>, type ∈ ${TYPES.join("|")}; scope kebab-case chữ thường`,
    );
  } else {
    const subject = m[5];
    if (/^[A-Z][a-z]/.test(subject)) errors.push(`subject bắt đầu bằng chữ thường: "${subject.split(" ")[0]}"`);
    if (NOT_IMPERATIVE.test(subject))
      errors.push(`subject dùng mệnh lệnh ("add", không "added"/"adds"): "${subject.split(" ")[0]}"`);
    if (/[.。]$/.test(subject)) errors.push("subject không kết thúc bằng dấu chấm");
    if (subject.trim().length < 3) errors.push("subject quá ngắn");
  }
  if (header.length > MAX_HEADER) errors.push(`header dài ${header.length} > ${MAX_HEADER} ký tự`);
  if (/[^\x20-\x7E]/.test(header)) errors.push("header chỉ dùng ASCII (viết tiếng Anh, không dấu)");
  if (lines.length > 1 && lines[1].trim()) errors.push("dòng 2 phải trống (ngăn header với body)");
  return errors;
}

// Lấy message từ lệnh bash: heredoc ($(cat <<'EOF' ... EOF)) hoặc các -m/--message (nhiều -m = nhiều đoạn).
function messageFromCommand(cmd) {
  if (/(^|\s)(-F|--file)(=|\s)/.test(cmd)) return null;
  const heredoc = cmd.match(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n([\s\S]*?)\n[ \t]*\2[ \t]*(\n|\)|$)/);
  if (heredoc) return heredoc[3];
  const parts = [];
  const re = /(?:^|\s)(?:-m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s;&|]+))/g;
  for (const x of cmd.matchAll(re)) {
    parts.push(x[1] !== undefined ? x[1].replace(/\\(["\\$`])/g, "$1") : (x[2] ?? x[3]));
  }
  return parts.length ? parts.join("\n\n") : null;
}

function report(errors) {
  if (!errors.length) return;
  console.error(
    [
      "Commit message sai quy ước (docs/GIT.md):",
      ...errors.map((e) => "- " + e),
      "Ví dụ: feat(todos): add contract, stub and failing tests",
      "       fix(shared): encode query params in listTodos",
    ].join("\n"),
  );
  process.exitCode = 1;
}

const [arg, value] = process.argv.slice(2);
if (arg === "--message") report(lint(value ?? ""));
else if (arg === "--command") {
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    const msg = messageFromCommand(s);
    if (msg !== null) report(lint(msg));
  });
} else if (arg) report(lint(readFileSync(arg, "utf8")));
else {
  console.log("Dùng: node scripts/commit-msg.mjs <file> | --message <m> | --command (stdin)");
}
