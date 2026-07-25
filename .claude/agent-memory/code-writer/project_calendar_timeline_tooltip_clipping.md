---
name: project-calendar-timeline-tooltip-clipping
description: Why data-tooltip pills on calendar chip hover-action buttons get clipped inside .calendar-timeline__block / __allday, and the fix pattern used.
metadata:
  type: project
---

`.calendar-timeline__block` (positioned timed chips, `CalendarTimeline.jsx`) and
`.calendar-timeline__allday` (the all-day/to-do strip) both have `overflow: hidden` in
`src/styles/components/_calendar-views.scss`, to hard-clip chip content (e.g. the time label) to
the exact pixel box computed from the event's start/end. The shared tooltip system
(`src/styles/components/_tooltip.scss`, via `data-tooltip`) renders its pill centered *above*
the element (`bottom: calc(100% + ...)`). `TaskChip.jsx`'s hover-action buttons
(`.task-chip__action-button`, e.g. the push-to-tomorrow / complete-toggle pair in
`.task-chip__actions`) sit right at `top: 0.125rem` inside the chip, so the tooltip pill almost
always renders outside the block's own box — meaning it gets clipped by the ancestor's
`overflow: hidden` for basically any block, not just short ones or ones near hour 0.

**Why:** simply flipping the tooltip to render *below* the button doesn't reliably fix it either,
since these blocks can be as short as 30 minutes (~1.5rem) — not enough room in either direction.
The scoped fix (mirrors the collapsed-sidebar tooltip override precedent in
`_side-nav.scss`) is `&:hover { overflow: visible; }` on both `.calendar-timeline__block` and
`.calendar-timeline__allday` — safe because the chip title's own truncation
(`@include truncate`) has its own independent `overflow: hidden`, so releasing the parent's
overflow on hover doesn't un-clip any chip text, only lets the tooltip/action pill escape.

**How to apply:** if adding more hover-revealed UI (tooltips, popovers) to calendar timeline
chips, check whether it lives inside `.calendar-timeline__block`/`__allday` first — if so, it
needs the same `:hover { overflow: visible; }` escape hatch or it will silently render off-screen
inside the clipped box.
