import { describe, it, expect } from 'vitest';
import pageMention from './pageMention';

describe('pageMention extension', () => {
  it('is named pageMention', () => {
    expect(pageMention.name).toBe('pageMention');
  });

  it('defaults getPages to an empty list', () => {
    const options = pageMention.config.addOptions.call(pageMention);
    expect(options.getPages()).toEqual([]);
  });
});