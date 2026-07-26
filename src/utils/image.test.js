import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { imageFilesFrom, fileToScaledDataUrl } from './image';

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

describe('fileToScaledDataUrl', () => {
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
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockImplementation((type) => `data:${type};base64,AAAA`);
  });

  it('scales the long edge down to the cap and keeps the aspect ratio', async () => {
    await fileToScaledDataUrl(file('image/png'), { maxEdge: 1200 });
    expect(drawn.slice(3)).toEqual([1200, 600]);
  });

  it('never scales a small image up', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
      width: 40, height: 20, close: vi.fn(),
    })));
    await fileToScaledDataUrl(file('image/png'), { maxEdge: 1200 });
    expect(drawn.slice(3)).toEqual([40, 20]);
  });

  it('encodes as JPEG so alpha does not come out black', async () => {
    const url = await fileToScaledDataUrl(file('image/png'));
    expect(url).toBe('data:image/jpeg;base64,AAAA');
  });
});