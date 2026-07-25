---
name: project-worktree-branch-staleness
description: Agent worktrees in this repo can have a HEAD that lags far behind local `master` — always diff HEAD against master before branching or trusting file contents.
metadata:
  type: project
---

This repo runs many parallel Claude Code agent worktrees at once (`.claude/worktrees/agent-*`,
visible via `git worktree list`). Each worktree's checked-out branch (`worktree-agent-*`) is a
snapshot from whenever that worktree was created — it does **not** auto-update, so it can be
many merged features behind the local `master` even though `git log` on that branch looks
normal/self-consistent.

**Why:** hit this directly on a "polish the chip hover buttons" task — the worktree's checked-out
file (`TaskChip.jsx`) was the pre-refactor version with no hover-actions panel at all, while local
`master` (`git rev-parse master`) was dozens of commits ahead and already had the exact feature
the task described. Trusting the worktree's working tree instead of checking master first would
have produced code that "added" a feature that already existed upstream, on a stale base.

**How to apply:** before starting any task that says "create a branch from master" (or before
assuming a described-as-existing feature is missing), run
`git rev-parse HEAD master` and `git diff HEAD master --stat` first. If they differ, create the
new feature branch explicitly off `master` (`git checkout -b <branch> master`), not off the
worktree's current HEAD — otherwise the branch silently forks from stale code and any PR/merge
will look like it's reverting unrelated upstream work.
