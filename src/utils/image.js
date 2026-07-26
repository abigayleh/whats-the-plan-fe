const MAX_EDGE = 1200;
const QUALITY = 0.72;

export function imageFilesFrom(dataTransfer) {
  return [...(dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
}

// Pasted images arrive at screenshot or camera size, and a page's whole document is
// re-sent on every autosave — so an unshrunk photo would go up the wire again on each
// keystroke. Downscaling to a sane edge keeps a screenshot near 100-200KB.
//
// Encoded as JPEG on a white background: alpha would come out black otherwise, and
// keeping PNG doubles the size of exactly the screenshots people paste most.
export async function fileToScaledDataUrl(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close?.();
  }
}