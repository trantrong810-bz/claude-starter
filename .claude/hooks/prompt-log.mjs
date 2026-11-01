#!/usr/bin/env node
// Log prompt history to history/prompts/YYYY-MM.jsonl (committed, outside versioning).
// Claude's answers are not logged — only the prompt, the model/effort that handled it, and the commits it made.
//
// As a hook (reads JSON from stdin):
//   node .claude/hooks/prompt-log.mjs session-start    SessionStart: remember the model if given
//   node .claude/hooks/prompt-log.mjs model-switch     PostModelSwitch: update the model
//   node .claude/hooks/prompt-log.mjs prompt           UserPromptSubmit: log the prompt
//   node .claude/hooks/prompt-log.mjs subagent         SubagentStop: remember which subagent ran
//   node .claude/hooks/prompt-log.mjs stop             Stop: log model, effort, subagents, commits
// By hand:
//   node .claude/hooks/prompt-log.mjs scan [dir]       scan for leftover secrets (exit 1 if any)
//
// Off: CLAUDE_PROMPT_LOG=off. The hook never blocks Claude: every error is swallowed, exit 0.
// Prompts are stored verbatim in the user's language (ADR 0020R exception).

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

// Strings that look like secrets. Shared by logging (redact) and scanning (block).
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

// Model of the last answer, read from the end of the transcript (internal format — read defensively).
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
        /* broken line: skip */
      }
    }
  } catch {
    /* unreadable */
  }
  return null;
}

// Model declared in the subagent file (frontmatter "model:"), or "inherit".
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
      commits,
    });
    // Keep s.turn until the next prompt: if another Stop hook blocks and Claude continues, the next Stop
    // logs a fuller line for the same id. Readers take the last "model" line of each id.
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
      `Secret-like strings in the log (replace them with [REDACTED] before committing):\n${hits.map((h) => "- " + h).join("\n")}`,
    );
    process.exit(1);
  }
}

if (process.env.CLAUDE_PROJECT_DIR) {
  try {
    process.chdir(process.env.CLAUDE_PROJECT_DIR);
  } catch {
    /* keep the current directory */
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
      /* the hook must never break the session */
    }
    process.exit(0);
  });
}
