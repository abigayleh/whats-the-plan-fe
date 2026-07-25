---
name: project-icon-registry
description: Where list/task icons are defined and registered in whats-the-plan-fe, for adding or editing selectable icons
metadata:
  type: project
---

Icon SVG components live in `src/components/layout/icons.jsx` (all icons, layout and task-style, in one file). Shared `strokeProps` const at top: `fill: none, stroke: currentColor, strokeWidth: 1.8, strokeLinecap/Linejoin: round`, viewBox `0 0 24 24`. Task/list-style icons use `width="16" height="16"`; larger nav icons use `22`/`18`.

The selectable icon set for lists (used by the icon picker) is a separate registry: `src/constants/taskIcons.jsx` exports `TASK_ICONS` (array of `{ key, label, Icon }`) and `getTaskIcon(key)`. To add a new selectable icon: (1) define the SVG component in `icons.jsx` matching the existing strokeProps/16x16 style, (2) import it and add an entry to `TASK_ICONS` in `taskIcons.jsx` with a stable lowercase key.

`TASK_ICONS`/`getTaskIcon` is consumed in several places beyond the picker (`ListModal.jsx`, `ListSection.jsx`, `TaskRow.jsx`, `ToggleChips.jsx`, `ListsPage.jsx`, `CalendarPage.jsx`, `src/utils/tasks.js`) — adding to the registry alone is enough to make a new icon selectable and rendered everywhere.

The icon picker UI (`.icon-picker` class in `src/styles/components/_modal.scss`) uses `flex-wrap`, so it scales to any number of icons with no CSS changes needed.

See [[feedback_worktree_branching]] for how branch creation works in this repo's worktree setup.
