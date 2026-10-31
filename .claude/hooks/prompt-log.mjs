#!/usr/bin/env node
// Ghi lịch sử prompt vào history/prompts/YYYY-MM.jsonl (được commit, nằm ngoài versioning).
// Không ghi câu trả lời của Claude — chỉ prompt, model/effort xử lý, và commit tạo ra.
//
// Dùng làm hook (đọc JSON từ stdin):
//   node .claude/hooks/prompt-log.mjs session-start    SessionStart: nhớ model nếu có
//   node .claude/hooks/prompt-log.mjs model-switch     PostModelSwitch: cập nhật model
//   node .claude/hooks/prompt-log.mjs prompt           UserPromptSubmit: ghi prompt
//   node .claude/hooks/prompt-log.mjs subagent         SubagentStop: nhớ subagent đã chạy
//   node .claude/hooks/prompt-log.mjs stop             Stop: ghi model, effort, subagent, commit
// Dùng tay:
//   node .claude/hooks/prompt-log.mjs scan [thư-mục]   quét secret còn sót (exit 1 nếu có)
//
// Tắt: CLAUDE_PROMPT_LOG=off. Hook không bao giờ chặn Claude: mọi lỗi đều bị nuốt, exit 0.

import { execSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const MAX_PROMPT = 4000;
const STATE_DIR = ".claude/state";
const LOG_DIR = "history/prompts";

// Chuỗi trông giống secret. Dùng chung cho lúc ghi (che) và lúc quét (chặn).
export const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{20,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{30,}/g,
  /github_pat_[A-Za-z0-9_]{30,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /AIza[0-9A-Za-z_-]{35}/g,
  /xox[abprs]-[A-Za-z0-9-]{10,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /\b(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{6,}/gi,
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@/]{4,}@/gi,
];

export function redact(text) {
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, (m) => {
      const kv = m.match(/^([A-Za-z_-]+\s*[:=]\s*["']?)/);
      return kv && /password|passwd|pwd|secret|token|api/i.test(kv[1]) ? `${kv[1]}[REDACTED]` : "[REDACTED]";
    });
  }
  return out;
}

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

function stateFile(sessionId) {
  return join(STATE_DIR, `${String(sessionId || "unknown").replace(/[^A-Za-z0-9_-]/g, "")}.json`);
}
function loadState(sessionId) {
  try {
    return JSON.parse(readFileSync(stateFile(sessionId), "utf8"));
  } catch {
    return {};
  }
}
function saveState(sessionId, state) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(stateFile(sessionId), JSON.stringify(state));
}

function logLine(entry) {
  const now = new Date();
  const month = now.toLocaleDateString("sv-SE").slice(0, 7);
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(join(LOG_DIR, `${month}.jsonl`), JSON.stringify(entry) + "\n");
}
const localTime = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
  const mm = String(Math.abs(off) % 60).padStart(2, "0");
  return `${d.toLocaleString("sv-SE").replace(" ", "T")}${sign}${hh}:${mm}`;
};

// Model của câu trả lời cuối, đọc từ đuôi transcript (định dạng nội bộ — đọc phòng thủ).
function modelFromTranscript(path) {
  try {
    if (!path || !existsSync(path)) return null;
    const lines = readFileSync(path, "utf8").trimEnd().split("\n").slice(-200).reverse();
    for (const l of lines) {
      try {
        const j = JSON.parse(l);
        const m = j?.message?.model ?? j?.model;
        if ((j?.type === "assistant" || j?.message?.role === "assistant") && typeof m === "string") return m;
      } catch {
        /* dòng hỏng: bỏ qua */
      }
    }
  } catch {
    /* không đọc được */
  }
  return null;
}

// Model khai báo trong file subagent (frontmatter "model:"), hoặc "inherit".
function declaredAgentModel(agentType) {
  try {
    const f = join(".claude/agents", `${agentType}.md`);
    const m = readFileSync(f, "utf8").match(/^model:\s*(\S+)/m);
    return m ? m[1] : "inherit";
  } catch {
    return "unknown";
  }
}

const handlers = {
  "session-start"(input) {
    const s = loadState(input.session_id);
    if (input.model) s.model = input.model;
    saveState(input.session_id, s);
  },
  "model-switch"(input) {
    const s = loadState(input.session_id);
    if (input.to_model) s.model = input.to_model;
    saveState(input.session_id, s);
  },
  prompt(input) {
    const raw = String(input.prompt ?? "");
    const clean = redact(raw);
    const s = loadState(input.session_id);
    s.turn = { prompt_id: input.prompt_id ?? null, head: git("rev-parse HEAD"), subagents: [] };
    saveState(input.session_id, s);
    const entry = {
      id: input.prompt_id ?? null,
      t: localTime(),
      src: "claude-code",
      session: input.session_id ?? null,
      branch: git("branch --show-current") || null,
      prompt: clean.length > MAX_PROMPT ? clean.slice(0, MAX_PROMPT) : clean,
    };
    if (clean.length > MAX_PROMPT) entry.truncated_from = clean.length;
    logLine(entry);
  },
  subagent(input) {
    const s = loadState(input.session_id);
    s.turn ??= { subagents: [] };
    s.turn.subagents.push({
      type: input.agent_type ?? "unknown",
      model: declaredAgentModel(input.agent_type),
      effort: input.effort?.level ?? "unknown",
    });
    saveState(input.session_id, s);
  },
  stop(input) {
    const s = loadState(input.session_id);
    const turn = s.turn ?? {};
    const model = modelFromTranscript(input.transcript_path) ?? s.model ?? "unknown";
    const head = git("rev-parse HEAD");
    const commits =
      turn.head && head && turn.head !== head
        ? git(`log --format=%h ${turn.head}..${head}`).split("\n").filter(Boolean).reverse()
        : [];
    logLine({
      id: input.prompt_id ?? turn.prompt_id ?? null,
      type: "model",
      model,
      effort: input.effort?.level ?? "unknown",
      subagents: turn.subagents ?? [],
      ket_qua: commits,
    });
    // Giữ s.turn tới prompt kế tiếp: nếu Stop hook khác chặn và Claude làm tiếp, lần Stop sau
    // ghi lại một dòng đầy đủ hơn cho cùng id. Người đọc lấy dòng "model" cuối cùng của mỗi id.
    if (model !== "unknown") s.model = model;
    saveState(input.session_id, s);
  },
};

function scan(dir) {
  const hits = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else
        readFileSync(p, "utf8")
          .split("\n")
          .forEach((line, i) => {
            for (const re of SECRET_PATTERNS) {
              re.lastIndex = 0;
              if (re.test(line.replaceAll("[REDACTED]", ""))) {
                hits.push(`${p}:${i + 1}`);
                break;
              }
            }
          });
    }
  };
  walk(dir);
  if (hits.length) {
    console.error(
      `Có chuỗi giống secret trong log (sửa thành [REDACTED] trước khi commit):\n${hits.map((h) => "- " + h).join("\n")}`,
    );
    process.exit(1);
  }
}

if (process.env.CLAUDE_PROJECT_DIR) {
  try {
    process.chdir(process.env.CLAUDE_PROJECT_DIR);
  } catch {
    /* giữ thư mục hiện tại */
  }
}

const mode = process.argv[2];
if (mode === "scan") {
  scan(process.argv[3] ?? LOG_DIR);
} else if (process.env.CLAUDE_PROMPT_LOG !== "off" && handlers[mode]) {
  let data = "";
  process.stdin.on("data", (d) => (data += d));
  process.stdin.on("end", () => {
    try {
      handlers[mode](JSON.parse(data || "{}"));
    } catch {
      /* hook không được làm hỏng phiên làm việc */
    }
    process.exit(0);
  });
}
