// Mouse and touch are deliberately separate sensors. PointerSensor covers both, but it also
// claims touch pointers — so a vertical swipe starting on a draggable row armed a drag
// instead of scrolling the page. MouseSensor ignores touch and leaves it to TouchSensor.
export const MOUSE_ACTIVATION = { distance: 6 };

// Touch drags start only after a deliberate hold, so an immediate swipe stays a swipe and an
// immediate vertical drag stays a scroll. The tolerance lets a finger wobble during the hold.
export const TOUCH_ACTIVATION = { delay: 250, tolerance: 8 };