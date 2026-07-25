---
name: architecture
description: How the PlanItem (event/to-do) abstraction is wired across hooks/usePlanItems.js, api/adapters.js, and PlanItemModal.jsx
metadata:
  type: project
---

Events and to-dos are separate DB entities/APIs but share one FE shape ("PlanItem") and one editor
(`PlanItemModal.jsx`). Key pieces:

- `src/api/adapters.js` — `adaptItem(raw, origin)` maps either a task or event row into the shared
  shape; `origin` is persistence routing only, never a UI identity check. `sourceId` is always the
  real DB row id (what writes target); `id` differs from `sourceId` for expanded calendar
  occurrences (`adaptOccurrence`, id = `${origin}-${instanceId}`).
- `src/hooks/usePlanItems.js` — the single write surface. `saveItem(item, payload)` is the only
  place the event-vs-task branch is allowed to live; pages must not special-case origin themselves.
- `src/components/items/PlanItemModal.jsx` — one modal for both kinds. Every field autosaves via
  `commitChange` → serialized `commitQueueRef` (a promise chain) → `runSave`. `savedItemRef.current`
  (a ref, not state) tracks the live entity so a same-tick double edit on a brand-new item can't
  both see "no item yet" and each create a duplicate — verified this holds for the normal case.

See [[plan-item-gotchas]] for specific correctness traps in this area found during review.
