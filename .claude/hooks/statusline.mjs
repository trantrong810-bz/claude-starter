#!/usr/bin/env node
// statusLine: print 5h / 7-day / context usage and write those numbers to .claude/state/usage.json for usage-guard.mjs.
// Hooks do not receive usage numbers, only the status line does — so the status line is the sensor, usage-guard the brake.
// rate_limits exist only on Pro/Max/Ultra plans and after the first API response; without them the guard stays off.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {}
  const limits = data.rate_limits ?? {};
  const pct = (w) =>
    typeof w?.used_percentage === "number"
      ? Math.round(w.used_percentage)
      : null;
  const fiveHour = pct(limits.five_hour);
  const sevenDay = pct(limits.seven_day);
  const context = pct(data.context_window);
  // The higher window decides when the block lifts; usage-guard and wip.mjs compare their marker against this value.
  const top =
    (sevenDay ?? -1) > (fiveHour ?? -1) ? limits.seven_day : limits.five_hour;

  const dir = join(
    data.workspace?.project_dir ?? process.cwd(),
    ".claude/state",
  );
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "usage.json"),
      JSON.stringify({
        fiveHour,
        sevenDay,
        resetsAt: top?.resets_at ?? null,
        context,
        at: Date.now(),
      }) + "\n",
    );
  } catch {}

  const threshold = Number(process.env.CLAUDE_WIP_THRESHOLD) || 90;
  const max = Math.max(fiveHour ?? 0, sevenDay ?? 0);
  const show = (label, v) => (v === null ? null : `${label} ${v}%`);
  const parts = [
    show("5h", fiveHour),
    show("7d", sevenDay),
    show("ctx", context),
  ].filter(Boolean);
  let line = parts.length ? parts.join(" · ") : "usage: n/a";
  if (max >= threshold) line += " · ⛔ stop: /handoff then switch account";
  else if (max >= threshold - 10) line += " · ⚠ near the limit";
  process.stdout.write(line + "\n");
});
