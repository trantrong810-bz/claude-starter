#!/usr/bin/env node
// Snapshot code đang sửa dở lên remote, để làm tiếp ở máy hoặc tài khoản Claude khác. Không phụ thuộc thư viện ngoài.
//
//   node scripts/wip.mjs save               chụp working tree (cả file mới, trừ history/) → push nhánh + wip/<nhánh>
//   node scripts/wip.mjs status             fetch và liệt kê snapshot trên remote
//   node scripts/wip.mjs restore [nhánh]    áp snapshot vào working tree (phải sạch), rồi xoá snapshot trên remote
//   node scripts/wip.mjs drop <nhánh>       xoá snapshot trên remote
//
// Snapshot là một commit rời (cha = HEAD của nhánh) ở ref refs/heads/wip/<nhánh>: không đổi working tree,
// index hay lịch sử nhánh thật, không bao giờ được checkout hay merge. Quy ước: docs/GIT.md mục "Snapshot WIP".
// history/ bị loại vì hook ghi prompt sửa nó ở mọi máy — đưa vào sẽ luôn xung đột khi restore.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";

try {
  process.chdir(
    execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim(),
  );
} catch {
  console.error("Không ở trong repo git.");
  process.exit(1);
}

const REMOTE = "origin";
const EXCLUDE = '":(exclude)history/"';
const STATE = ".claude/state";

const git = (args, opts = {}) =>
  execSync(`git ${args}`, {
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 256 * 1024 * 1024,
    ...opts,
  })
    .toString()
    .replace(/\r\n/g, "\n")
    .trim();
const tryGit = (args, opts) => {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
};
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const currentBranch = () =>
  git("branch --show-current") ||
  fail("HEAD đang detached: chuyển sang một nhánh trước.");
const dirty = () => git(`status --porcelain -- . ${EXCLUDE}`) !== "";
const wipRef = (branch) => `refs/heads/wip/${branch}`;
const trackRef = (branch) => `refs/remotes/${REMOTE}/wip/${branch}`;

function fetchSnapshots() {
  git(
    `fetch --prune ${REMOTE} "+refs/heads/wip/*:refs/remotes/${REMOTE}/wip/*"`,
  );
  const out = git(
    `for-each-ref "refs/remotes/${REMOTE}/wip/" --format="%(refname)|%(objectname)|%(subject)"`,
  );
  return out
    ? out.split("\n").map((line) => {
        const [ref, sha, subject] = line.split("|");
        return {
          branch: ref.slice(`refs/remotes/${REMOTE}/wip/`.length),
          sha,
          subject,
        };
      })
    : [];
}

// Ghi dấu cho hook usage-guard: đã lưu WIP trong cửa sổ usage hiện tại.
function markHandoff() {
  let resetsAt = null;
  try {
    resetsAt =
      JSON.parse(readFileSync(join(STATE, "usage.json"), "utf8")).resetsAt ??
      null;
  } catch {}
  mkdirSync(STATE, { recursive: true });
  writeFileSync(
    join(STATE, "handoff.json"),
    JSON.stringify({ resetsAt, at: Date.now() }) + "\n",
  );
}

function save() {
  const branch = currentBranch();
  if (!dirty()) {
    // Không còn gì dở: snapshot cũ (nếu có) đã lỗi thời.
    const stale = tryGit(`ls-remote --heads ${REMOTE} "wip/${branch}"`);
    git(`push -u ${REMOTE} "${branch}"${stale ? ` ":${wipRef(branch)}"` : ""}`);
    markHandoff();
    console.log(
      `Working tree sạch: đã push ${branch}${stale ? ", xoá snapshot cũ" : ""}. Máy khác: git pull rồi /resume.`,
    );
    return;
  }
  // Index tạm: chụp mọi file (tôn trọng .gitignore) mà không đụng index thật.
  const index = join(tmpdir(), `wip-index-${process.pid}`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  let sha;
  try {
    git("read-tree HEAD", { env });
    git(`add -A -- . ${EXCLUDE}`, { env });
    const tree = git("write-tree", { env });
    const msg = `wip: ${branch} @ ${hostname()} ${new Date().toISOString().slice(0, 16)}`;
    sha = git(`commit-tree ${tree} -p HEAD -m "${msg}"`);
  } finally {
    rmSync(index, { force: true });
  }
  git(`push -u ${REMOTE} "${branch}" "+${sha}:${wipRef(branch)}"`);
  git(`update-ref ${trackRef(branch)} ${sha}`);
  markHandoff();
  const files = git(`diff --name-only HEAD ${sha}`)
    .split("\n")
    .filter(Boolean).length;
  console.log(
    `Đã lưu ${files} file dở vào wip/${branch} (${sha.slice(0, 7)}) và push. Máy khác: git pull rồi /resume.`,
  );
}

function status() {
  const snaps = fetchSnapshots();
  if (!snaps.length) return console.log("Không có snapshot WIP trên remote.");
  for (const s of snaps) {
    const parent = tryGit(`rev-parse ${s.sha}~1`);
    const tip = tryGit(`rev-parse "refs/remotes/${REMOTE}/${s.branch}"`);
    const note = parent === tip ? "" : " — CŨ: nhánh đã có commit sau snapshot";
    console.log(
      `- ${s.branch}: ${s.subject.replace(/^wip: \S+ @ /, "")} (${s.sha.slice(0, 7)})${note}`,
    );
  }
}

function restore(name) {
  const snaps = fetchSnapshots();
  if (!snaps.length) return console.log("Không có snapshot WIP trên remote.");
  const here = tryGit("branch --show-current");
  const snap =
    snaps.find((s) => s.branch === name) ??
    (!name &&
      (snaps.length === 1 ? snaps[0] : snaps.find((s) => s.branch === here)));
  if (!snap)
    fail(
      `Chọn nhánh: node scripts/wip.mjs restore <nhánh>. Có: ${snaps.map((s) => s.branch).join(", ")}`,
    );
  if (dirty())
    fail(
      "Working tree còn thay đổi chưa commit: commit hoặc hỏi người dùng trước khi restore (không tự xoá).",
    );

  if (here !== snap.branch) git(`switch "${snap.branch}"`);
  if (tryGit(`rev-parse --verify -q "refs/remotes/${REMOTE}/${snap.branch}"`)) {
    git(`merge --ff-only "refs/remotes/${REMOTE}/${snap.branch}"`);
  }
  const parent = git(`rev-parse ${snap.sha}~1`);
  if (git("rev-parse HEAD") !== parent) {
    fail(
      `Snapshot wip/${snap.branch} chụp từ ${parent.slice(0, 7)}, nhánh đang ở ${git("rev-parse --short HEAD")}: ` +
        `snapshot cũ hoặc nhánh lệch. Xem: git diff HEAD ${snap.sha.slice(0, 7)} — bỏ: node scripts/wip.mjs drop ${snap.branch}`,
    );
  }
  const patch = execSync(`git diff --binary HEAD ${snap.sha}`, {
    maxBuffer: 256 * 1024 * 1024,
  });
  execSync("git apply --binary --whitespace=nowarn -", {
    input: patch,
    stdio: ["pipe", "pipe", "pipe"],
  });
  drop(snap.branch, true);
  console.log(
    `Đã áp ${snap.subject} vào ${snap.branch} (chưa stage) và xoá snapshot trên remote.`,
  );
}

function drop(branch, quiet = false) {
  if (!branch) fail("Dùng: node scripts/wip.mjs drop <nhánh>");
  tryGit(`push ${REMOTE} ":${wipRef(branch)}"`);
  tryGit(`update-ref -d ${trackRef(branch)}`);
  if (!quiet) console.log(`Đã xoá snapshot wip/${branch}.`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "save") save();
else if (cmd === "status") status();
else if (cmd === "restore") restore(arg);
else if (cmd === "drop") drop(arg);
else
  fail(
    "Dùng: node scripts/wip.mjs save | status | restore [nhánh] | drop <nhánh>",
  );
