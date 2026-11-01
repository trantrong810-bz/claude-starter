#!/usr/bin/env node
// Dọn nhánh local sau khi PR đã merge trên GitHub. Không phụ thuộc thư viện ngoài.
//
//   node scripts/pr.mjs stale              liệt kê nhánh local mà mọi commit đã có trên main
//   node scripts/pr.mjs cleanup <nhánh>    xoá nhánh local đó nếu mọi commit đã có trên main
//
// GitHub merge bằng rebase nên commit trên main có mã mới: `git branch -d` từ chối xoá, còn `-D`
// bị cấm (docs/GIT.md). Ở đây so theo nội dung patch (`git cherry`), chỉ xoá khi không mất gì.

import { execSync } from "node:child_process";

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
const MAIN = "main";
// Nhánh không bao giờ dọn: main và snapshot WIP (scripts/wip.mjs).
const KEEP = /^(main|wip\/.*)$/;

const git = (args) =>
  execSync(`git ${args}`, { stdio: ["pipe", "pipe", "pipe"] })
    .toString()
    .replace(/\r\n/g, "\n")
    .trim();
const tryGit = (args) => {
  try {
    return git(args);
  } catch {
    return null;
  }
};
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

// Mốc so sánh: main trên remote (vừa fetch) nếu có, không thì main local.
function base() {
  tryGit(`fetch --prune ${REMOTE}`);
  return tryGit(`rev-parse -q --verify ${REMOTE}/${MAIN}`)
    ? `${REMOTE}/${MAIN}`
    : MAIN;
}

// Commit của nhánh chưa có trên main (theo nội dung patch).
const missing = (branch, ref) =>
  git(`cherry ${ref} "${branch}"`)
    .split("\n")
    .filter((l) => l.startsWith("+"))
    .map((l) => l.slice(2));

const localBranches = () =>
  git('for-each-ref --format="%(refname:short)" refs/heads/')
    .split("\n")
    .filter((b) => b && !KEEP.test(b));

function stale() {
  const ref = base();
  const current = git("branch --show-current");
  for (const b of localBranches()) {
    if (b !== current && missing(b, ref).length === 0) console.log(b);
  }
}

function cleanup(branch) {
  if (!branch) fail("Dùng: node scripts/pr.mjs cleanup <nhánh>");
  if (KEEP.test(branch)) fail(`Không dọn nhánh ${branch}.`);
  if (!tryGit(`rev-parse -q --verify "refs/heads/${branch}"`))
    fail(`Không có nhánh local ${branch}.`);
  if (git("branch --show-current") === branch)
    fail(`Đang ở ${branch}: chuyển sang ${MAIN} trước (git switch ${MAIN}).`);
  const ref = base();
  const left = missing(branch, ref);
  if (left.length) {
    fail(
      `${branch} còn ${left.length} commit chưa có trên ${ref} — không xoá:\n` +
        left
          .map((sha) => "- " + git(`log -1 --format="%h %s" ${sha}`))
          .join("\n"),
    );
  }
  git(`update-ref -d "refs/heads/${branch}"`);
  console.log(`Đã xoá nhánh local ${branch} (mọi commit đã có trên ${ref}).`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "stale") stale();
else if (cmd === "cleanup") cleanup(arg);
else {
  console.log("Dùng: node scripts/pr.mjs <stale|cleanup <nhánh>>");
  process.exit(cmd ? 1 : 0);
}
