import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import { fireEvent } from '../../../test/utils';
import { normalizeUrl, promptUrl } from './urlPrompt';

describe('normalizeUrl', () => {
  it('prepends https:// to a bare host', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('www.example.com/path')).toBe('https://www.example.com/path');
  });

  it('leaves an existing scheme untouched', () => {
    expect(normalizeUrl('http://x.com')).toBe('http://x.com');
    expect(normalizeUrl('https://x.com')).toBe('https://x.com');
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizeUrl('ftp://host/file')).toBe('ftp://host/file');
  });
});

// A minimal editor stand-in — promptUrl only needs a selection position and coordinates.
function fakeEditor() {
  return {
    view: { coordsAtPos: () => ({ left: 10, bottom: 20 }) },
    state: { selection: { from: 1 } },
  };
}

describe('promptUrl', () => {
  afterEach(() => {
    document.querySelectorAll('.suggestion-popup').forEach((n) => n.remove());
  });

  it('mounts an input seeded with the initial value', () => {
    promptUrl({ editor: fakeEditor(), initial: 'https://seed.com', onSubmit: vi.fn() });
    const input = document.querySelector('.page-doc__url-input');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('https://seed.com');
  });

  it('submits the trimmed value on Enter and removes the popup', () => {
    const onSubmit = vi.fn();
    promptUrl({ editor: fakeEditor(), onSubmit });
    const input = document.querySelector('.page-doc__url-input');
    input.value = '  example.com  ';
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('example.com');
    expect(document.querySelector('.suggestion-popup')).not.toBeInTheDocument();
  });

  it('closes on Escape without submitting', () => {
    const onSubmit = vi.fn();
    promptUrl({ editor: fakeEditor(), onSubmit });
    const input = document.querySelector('.page-doc__url-input');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('.suggestion-popup')).not.toBeInTheDocument();
  });

  it('closes on an outside mousedown without submitting', () => {
    const onSubmit = vi.fn();
    promptUrl({ editor: fakeEditor(), onSubmit });
    fireEvent.mouseDown(document.body);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector('.suggestion-popup')).not.toBeInTheDocument();
  });
});