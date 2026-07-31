// Shared drag activation tuning. Mouse drags start after a short move; touch drags start
// only after a deliberate hold, so an immediate horizontal swipe stays a swipe and an
// immediate vertical one stays a scroll. The tolerance lets a finger wobble during the hold.
export const POINTER_ACTIVATION = { distance: 6 };
export const TOUCH_ACTIVATION = { delay: 250, tolerance: 8 };