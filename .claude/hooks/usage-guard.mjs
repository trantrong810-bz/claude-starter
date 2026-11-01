#!/usr/bin/env node
// PreToolUse (mọi tool) + Stop: khi usage 5h/7 ngày ≥ ngưỡng (mặc định 90%, env CLAUDE_WIP_THRESHOLD),
// ép Claude lưu WIP (/handoff) rồi dừng, để đổi máy/tài khoản không mất việc.
// Số usage do statusline.mjs ghi vào .claude/state/usage.json; dấu "đã lưu" do wip.mjs ghi vào handoff.json.
//
//   node .claude/hooks/usage-guard.mjs pre    chưa lưu: chỉ cho việc của handoff; đã lưu: chỉ cho đọc
//   node .claude/hooks/usage-guard.mjs stop   chưa lưu: không cho kết thúc (một lần, tránh lặp)
// Exit 2 + stderr => tool bị chặn / Claude phải làm tiếp, kèm hướng dẫn.
import { readFileSync } from "node:fs";
import { relative } from "node:path";

const mode = process.argv[2];
const threshold = Number(process.env.CLAUDE_WIP_THRESHOLD) || 90;
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  const input = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  })();
  const usage = readJson(".claude/state/usage.json");
  if (!usage) process.exit(0);
  const max = Math.max(usage.fiveHour ?? 0, usage.sevenDay ?? 0);
  // resetsAt (giây) đã qua → cửa sổ mới, số cũ không còn đúng.
  if (max < threshold || (usage.resetsAt && usage.resetsAt * 1000 < Date.now()))
    process.exit(0);

  const handoff = readJson(".claude/state/handoff.json");
  const saved = handoff && handoff.resetsAt === usage.resetsAt;
  const block = (msg) => {
    process.stderr.write(msg + "\n");
    process.exit(2);
  };

  if (mode === "stop") {
    if (saved || input.stop_hook_active) process.exit(0);
    block(
      `Usage ${max}% ≥ ${threshold}%: chưa lưu WIP. Làm /handoff ngay (cập nhật docs/todo/<phần>.auto.md + spec, ` +
        `node scripts/todo.mjs sync, commit, node scripts/wip.mjs save) rồi mới dừng.`,
    );
  }

  const tool = input.tool_name ?? "";
  const ti = input.tool_input ?? {};
  if (["Read", "Grep", "Glob", "TodoWrite", "ToolSearch"].includes(tool))
    process.exit(0);
  if (saved) {
    block(
      `Usage ${max}% ≥ ${threshold}% và WIP đã lưu: dừng làm việc. Báo người dùng: đổi tài khoản/máy, ` +
        `git pull rồi /resume (hoặc chờ reset; tăng CLAUDE_WIP_THRESHOLD nếu muốn làm tiếp).`,
    );
  }

  const handoffPath = (p) => {
    const rel = relative(process.cwd(), String(p ?? "")).replace(/\\/g, "/");
    return rel === "TODO.md" || /^docs\/(todo|specs|plans)\//.test(rel);
  };
  const handoffCommand = (cmd) =>
    String(cmd ?? "")
      .split(/&&|;|\|\|/)
      .map((s) => s.trim())
      .filter(Boolean)
      .every((s) =>
        // `git switch -c`: /handoff từ main phải tạo nhánh trước (main chỉ nhận qua PR).
        /^(git (status|diff|log|add|commit|switch -c)\b|node scripts\/(wip|todo)\.mjs\b)/.test(
          s,
        ),
      );

  if (
    ["Edit", "Write", "MultiEdit"].includes(tool) &&
    handoffPath(ti.file_path)
  )
    process.exit(0);
  if (tool === "Bash" && handoffCommand(ti.command)) process.exit(0);
  if (tool === "Skill" && /handoff/.test(ti.skill ?? "")) process.exit(0);

  block(
    `Usage ${max}% ≥ ${threshold}%: dừng việc đang làm, chỉ làm /handoff — ghi "Đang dở"/"Tiếp theo" cụ thể vào ` +
      `docs/todo/<phần>.auto.md (và spec), node scripts/todo.mjs sync, commit todo, node scripts/wip.mjs save. ` +
      `Được phép: Read/Grep/Glob, Edit/Write trong docs/todo|specs|plans, TODO.md, git status|diff|log|add|commit, node scripts/wip.mjs|todo.mjs.`,
  );
});
