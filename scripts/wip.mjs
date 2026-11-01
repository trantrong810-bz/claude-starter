#!/usr/bin/env node
// Snapshot unfinished work to the remote so it can continue on another machine or Claude account. No external dependencies.
//
//   node scripts/wip.mjs save               snapshot the working tree (new files too, except history/) → push branch + wip/<branch>
//   node scripts/wip.mjs status             fetch and list the snapshots on the remote
//   node scripts/wip.mjs restore [branch]   apply a snapshot to the (clean) working tree, then delete it on the remote
//   node scripts/wip.mjs drop <branch>      delete a snapshot on the remote
//
// A snapshot is a detached commit (parent = the branch HEAD) at refs/heads/wip/<branch>: it never touches the
// working tree, index or real branch history, and is never checked out or merged. Rules: docs/GIT.md "WIP snapshots".
// history/ is excluded because the prompt-log hook edits it on every machine — including it always conflicts on restore.

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
  console.error("Not inside a git repo.");
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
  fail("HEAD is detached: switch to a branch first.");
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

// Mark for the usage-guard hook: WIP was saved in the current usage window.
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
    // Nothing unfinished: an old snapshot (if any) is stale.
    const stale = tryGit(`ls-remote --heads ${REMOTE} "wip/${branch}"`);
    git(`push -u ${REMOTE} "${branch}"${stale ? ` ":${wipRef(branch)}"` : ""}`);
    markHandoff();
    console.log(
      `Working tree clean: pushed ${branch}${stale ? ", deleted the old snapshot" : ""}. Other machine: git pull then /resume.`,
    );
    return;
  }
  // Temporary index: capture every file (respecting .gitignore) without touching the real index.
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
    `Saved ${files} unfinished file(s) to wip/${branch} (${sha.slice(0, 7)}) and pushed. Other machine: git pull then /resume.`,
  );
}

function status() {
  const snaps = fetchSnapshots();
  if (!snaps.length) return console.log("No WIP snapshots on the remote.");
  for (const s of snaps) {
    const parent = tryGit(`rev-parse ${s.sha}~1`);
    const tip = tryGit(`rev-parse "refs/remotes/${REMOTE}/${s.branch}"`);
    const note = parent === tip ? "" : " — STALE: the branch has commits after the snapshot";
    console.log(
      `- ${s.branch}: ${s.subject.replace(/^wip: \S+ @ /, "")} (${s.sha.slice(0, 7)})${note}`,
    );
  }
}

function restore(name) {
  const snaps = fetchSnapshots();
  if (!snaps.length) return console.log("No WIP snapshots on the remote.");
  const here = tryGit("branch --show-current");
  const snap =
    snaps.find((s) => s.branch === name) ??
    (!name &&
      (snaps.length === 1 ? snaps[0] : snaps.find((s) => s.branch === here)));
  if (!snap)
    fail(
      `Pick a branch: node scripts/wip.mjs restore <branch>. Available: ${snaps.map((s) => s.branch).join(", ")}`,
    );
  if (dirty())
    fail(
      "The working tree has uncommitted changes: commit or ask the user before restoring (never discard them).",
    );

  if (here !== snap.branch) git(`switch "${snap.branch}"`);
  if (tryGit(`rev-parse --verify -q "refs/remotes/${REMOTE}/${snap.branch}"`)) {
    git(`merge --ff-only "refs/remotes/${REMOTE}/${snap.branch}"`);
  }
  const parent = git(`rev-parse ${snap.sha}~1`);
  if (git("rev-parse HEAD") !== parent) {
    fail(
      `Snapshot wip/${snap.branch} was taken from ${parent.slice(0, 7)}, the branch is at ${git("rev-parse --short HEAD")}: ` +
        `stale snapshot or diverged branch. Inspect: git diff HEAD ${snap.sha.slice(0, 7)} — discard: node scripts/wip.mjs drop ${snap.branch}`,
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
    `Applied ${snap.subject} to ${snap.branch} (unstaged) and deleted the snapshot on the remote.`,
  );
}

function drop(branch, quiet = false) {
  if (!branch) fail("Usage: node scripts/wip.mjs drop <branch>");
  tryGit(`push ${REMOTE} ":${wipRef(branch)}"`);
  tryGit(`update-ref -d ${trackRef(branch)}`);
  if (!quiet) console.log(`Deleted snapshot wip/${branch}.`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "save") save();
else if (cmd === "status") status();
else if (cmd === "restore") restore(arg);
else if (cmd === "drop") drop(arg);
else
  fail(
    "Usage: node scripts/wip.mjs save | status | restore [branch] | drop <branch>",
  );
