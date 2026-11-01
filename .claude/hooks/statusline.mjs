#!/usr/bin/env node
// statusLine: in usage 5h / 7 ngày / context, và ghi số đó vào .claude/state/usage.json cho usage-guard.mjs.
// Hook không nhận được số usage, chỉ statusline nhận — nên statusline là cảm biến, usage-guard là cái phanh.
// rate_limits chỉ có với gói Pro/Max/Ultra và sau phản hồi API đầu tiên; thiếu thì guard không kích hoạt.
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
  // Cửa sổ đang cao hơn quyết định thời điểm hết chặn; usage-guard và wip.mjs so marker theo giá trị này.
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
  if (max >= threshold) line += " · ⛔ dừng: /handoff rồi đổi tài khoản";
  else if (max >= threshold - 10) line += " · ⚠ gần ngưỡng";
  process.stdout.write(line + "\n");
});
