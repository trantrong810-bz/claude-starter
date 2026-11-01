#!/usr/bin/env node
// Clean up local branches after their PR merged on GitHub. No external dependencies.
//
//   node scripts/pr.mjs stale              list local branches whose commits are all on main
//   node scripts/pr.mjs cleanup <branch>   delete that local branch if all its commits are on main
//
// GitHub merges by rebase, so commits on main get new hashes: `git branch -d` refuses, and `-D` is
// forbidden (docs/GIT.md). This compares patch content (`git cherry`) and deletes only when nothing is lost.

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
  console.error("Not inside a git repo.");
  process.exit(1);
}

const REMOTE = "origin";
const MAIN = "main";
// Branches never cleaned up: main and WIP snapshots (scripts/wip.mjs).
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

// Baseline: main on the remote (freshly fetched) if present, otherwise local main.
function base() {
  tryGit(`fetch --prune ${REMOTE}`);
  return tryGit(`rev-parse -q --verify ${REMOTE}/${MAIN}`)
    ? `${REMOTE}/${MAIN}`
    : MAIN;
}

// Branch commits not yet on main (by patch content).
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
  if (!branch) fail("Usage: node scripts/pr.mjs cleanup <branch>");
  if (KEEP.test(branch)) fail(`Not cleaning up branch ${branch}.`);
  if (!tryGit(`rev-parse -q --verify "refs/heads/${branch}"`))
    fail(`No local branch ${branch}.`);
  if (git("branch --show-current") === branch)
    fail(`Currently on ${branch}: switch to ${MAIN} first (git switch ${MAIN}).`);
  const ref = base();
  const left = missing(branch, ref);
  if (left.length) {
    fail(
      `${branch} has ${left.length} commit(s) not on ${ref} — not deleting:\n` +
        left
          .map((sha) => "- " + git(`log -1 --format="%h %s" ${sha}`))
          .join("\n"),
    );
  }
  git(`update-ref -d "refs/heads/${branch}"`);
  console.log(`Deleted local branch ${branch} (all commits are on ${ref}).`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "stale") stale();
else if (cmd === "cleanup") cleanup(arg);
else {
  console.log("Usage: node scripts/pr.mjs <stale|cleanup <branch>>");
  process.exit(cmd ? 1 : 0);
}
