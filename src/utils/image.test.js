import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { imageFilesFrom, fileToScaledBlob } from './image';

const file = (type, name = 'f') => new File(['x'], name, { type });

describe('imageFilesFrom', () => {
  it('returns an empty list for missing or empty transfers', () => {
    expect(imageFilesFrom(null)).toEqual([]);
    expect(imageFilesFrom({})).toEqual([]);
    expect(imageFilesFrom({ files: [] })).toEqual([]);
  });

  it('keeps only image files', () => {
    const png = file('image/png');
    const transfer = { files: [file('text/plain'), png, file('application/pdf')] };
    expect(imageFilesFrom(transfer)).toEqual([png]);
  });
});

describe('fileToScaledBlob', () => {
  let drawn;

  beforeEach(() => {
    drawn = null;
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
      width: 3000, height: 1500, close: vi.fn(),
    })));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn((...args) => { drawn = args; }),
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb, type) => cb(new Blob(['x'], { type })));
  });

  it('scales the long edge down to the cap and keeps the aspect ratio', async () => {
    await fileToScaledBlob(file('image/png'), { maxEdge: 1200 });
    expect(drawn.slice(3)).toEqual([1200, 600]);
  });

  it('never scales a small image up', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
      width: 40, height: 20, close: vi.fn(),
    })));
    await fileToScaledBlob(file('image/png'), { maxEdge: 1200 });
    expect(drawn.slice(3)).toEqual([40, 20]);
  });

  it('encodes as JPEG so alpha does not come out black', async () => {
    const blob = await fileToScaledBlob(file('image/png'));
    expect(blob.type).toBe('image/jpeg');
  });

  it('falls back to the original file when the encode yields nothing', async () => {
    HTMLCanvasElement.prototype.toBlob.mockImplementation((cb) => cb(null));
    const original = file('image/png', 'shot.png');
    expect(await fileToScaledBlob(original)).toBe(original);
  });
});