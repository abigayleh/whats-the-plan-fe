---
name: feedback-worktree-branching
description: How to create a feature branch from master when working inside a whats-the-plan-fe git worktree
metadata:
  type: feedback
---

This repo uses many git worktrees (one per agent task, named `worktree-agent-*`), each checked out to its own branch. `master` itself is often already checked out in another worktree, so `git checkout master` or `git checkout -b <branch> master` from inside a worktree can fail (branch already checked out elsewhere).

**How to apply:** to branch from up-to-date master without checking it out, find master's tip commit hash (`git rev-parse master` or `git log --oneline master -1`) and create the new branch directly from that hash: `git checkout -b feat/my-branch <master-sha>`. Don't assume the worktree's current HEAD is up to date with master — check `git log HEAD..master` first, since worktrees are often several commits behind.

Also: task instructions may say `ln -s .../node_modules node_modules` — worktrees don't get their own `node_modules`, symlink to the main repo's before running lint/build.
