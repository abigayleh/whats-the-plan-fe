---
name: be-fk-cascade-verification
description: How to query real Postgres FK delete rules on the BE Supabase DB (Prisma db execute doesn't return SELECT output), and confirmed state of Group->List->Task cascade as of 2026-07-16.
metadata:
  type: project
---

## How to query real FK constraints on whats-the-plan-be's DB

`npx prisma db execute --stdin` does NOT print SELECT query results to stdout (only reports "Script executed successfully") — it's meant for DDL, not for reading data. To actually see results, write a small Node script using `@prisma/client` and `$queryRawUnsafe`, requiring the client via its **absolute path** inside the BE repo's `node_modules` (a script run from outside the repo, e.g. the scratchpad, won't resolve a bare `require('@prisma/client')`).

Load env vars via `set -a && source .env && set +a` before `node script.js` — the repo's schema uses `env("DATABASE_URL")` / `env("DIRECT_URL")` directly (no dotenv config), and `dotenv` may not be present at repo root anyway.

Cast `regclass` columns to `::text` in the query — Prisma's raw-query deserializer errors on the `regclass` type (`P2010 Failed to deserialize column of type 'regclass'`) unless cast to text first.

pg_constraint query template (works):
```sql
SELECT conname, conrelid::regclass::text, confrelid::regclass::text, confdeltype,
       pg_get_constraintdef(oid) AS def
FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text IN ('"Task"','"List"');
```

## Confirmed DB state (2026-07-16)

`List_groupId_fkey` (List.groupId -> Group.id) and `Task_listId_fkey` (Task.listId -> List.id) **both already have `ON DELETE CASCADE`** in the real Supabase DB — matching `prisma/schema.prisma`. This contradicts the common assumption that the "no `prisma migrate dev`, all schema changes applied by hand via raw `ALTER TABLE`" workflow left FK delete-rules out of sync with the schema file. At least for these two FKs, they are in sync.

Verified via direct repro: created a real Group -> List -> Task chain, called `prisma.group.delete({where:{id}})` (the exact same call used in `src/routes/groups.js` `router.delete('/:id', requireAdmin, ...)`), and both the List and Task rows were correctly cascade-deleted. No orphaned List or Task rows existed in the DB beforehand either (checked via LEFT JOIN / NOT EXISTS queries).

**Do not assume this "shadow-DB / hand-applied migrations" framing means FK cascades are broken without re-verifying** — it may have been true once and since fixed, or only true for other FKs (untested: Event.groupId, Poll.groupId, Itinerary.groupId, Conversation.groupId, Attachment.taskId — none of these were checked in this session).

If a "group delete leaves orphaned tasks" bug is reported again, it did NOT reproduce via direct backend/DB testing as of 2026-07-16. Prime suspects for a future recheck: (1) frontend not clearing stale task/list state from its store after a group-delete socket event (`group:deleted`) — this repo keeps one consolidated `AppProvider`/`useAppData` store per FE convention, so a missed invalidation there would look exactly like "orphaned" data client-side while the DB is actually clean; (2) whether the report was observed before this FK state was corrected.

Also note: `whats-the-plan-be/trigger` is a stray plain **file** (not a directory, not a DB trigger), containing only a date string. Red herring if seen in a directory listing.
