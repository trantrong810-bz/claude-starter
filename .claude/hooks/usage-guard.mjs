#!/usr/bin/env node
// PreToolUse (every tool) + Stop: when 5h/7-day usage ≥ the threshold (default 90%, env CLAUDE_WIP_THRESHOLD),
// force Claude to save WIP (/handoff) and stop, so switching machine/account loses nothing.
// statusline.mjs writes the usage numbers to .claude/state/usage.json; wip.mjs writes the "saved" mark to handoff.json.
//
//   node .claude/hooks/usage-guard.mjs pre    not saved: only handoff work allowed; saved: read only
//   node .claude/hooks/usage-guard.mjs stop   not saved: do not let Claude finish (once, to avoid loops)
// Exit 2 + stderr => the tool is blocked / Claude must continue, with guidance.
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
  // resetsAt (seconds) has passed → new window, the old numbers no longer apply.
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
      `Usage ${max}% ≥ ${threshold}%: WIP not saved. Run /handoff now (update docs/todo/<part>.auto.md + spec, ` +
        `node scripts/todo.mjs sync, commit, node scripts/wip.mjs save) before stopping.`,
    );
  }

  const tool = input.tool_name ?? "";
  const ti = input.tool_input ?? {};
  if (["Read", "Grep", "Glob", "TodoWrite", "ToolSearch"].includes(tool))
    process.exit(0);
  if (saved) {
    block(
      `Usage ${max}% ≥ ${threshold}% and WIP is saved: stop working. Tell the user: switch account/machine, ` +
        `git pull then /resume (or wait for the reset; raise CLAUDE_WIP_THRESHOLD to keep going).`,
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
        // `git switch -c`: /handoff from main must create a branch first (main only accepts PRs).
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
    `Usage ${max}% ≥ ${threshold}%: stop the current work and only do /handoff — write a concrete "Stopped at"/"Next" into ` +
      `docs/todo/<part>.auto.md (and the spec), node scripts/todo.mjs sync, commit todo, node scripts/wip.mjs save. ` +
      `Allowed: Read/Grep/Glob, Edit/Write in docs/todo|specs|plans, TODO.md, git status|diff|log|add|commit, node scripts/wip.mjs|todo.mjs.`,
  );
});
