export const MIN_IMAGE_WIDTH = 60;

// Keeps a dragged width sane: never narrower than legible, never wider than the column.
// CSS max-width caps the render anyway, but persisting an oversized number means the image
// would silently change size whenever the window did.
export function clampImageWidth(width, maxWidth) {
  if (!Number.isFinite(width)) return MIN_IMAGE_WIDTH;
  const max = Number.isFinite(maxWidth) && maxWidth > MIN_IMAGE_WIDTH ? maxWidth : Infinity;
  return Math.min(Math.max(width, MIN_IMAGE_WIDTH), max);
}