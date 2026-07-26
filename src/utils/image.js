const MAX_EDGE = 1200;
const QUALITY = 0.72;

export function imageFilesFrom(dataTransfer) {
  return [...(dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
}

// Pasted images arrive at screenshot or camera size. Downscaling before upload keeps a
// screenshot near 100-200KB, which is mostly about how fast it loads back afterwards.
//
// Encoded as JPEG on a white background: alpha would come out black otherwise, and PNG
// roughly doubles the size of exactly the screenshots people paste most.
export async function fileToScaledBlob(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
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

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    // A failed encode falls back to the original bytes rather than dropping the paste.
    return blob ?? file;
  } finally {
    bitmap.close?.();
  }
}