import { describe, it, expect } from 'vitest';
import { firstEmoji } from './emoji';

describe('firstEmoji', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(firstEmoji('')).toBeNull();
    expect(firstEmoji('   ')).toBeNull();
    expect(firstEmoji(undefined)).toBeNull();
  });

  it('takes a single emoji as-is', () => {
    expect(firstEmoji('🎯')).toBe('🎯');
  });

  it('trims surrounding whitespace', () => {
    expect(firstEmoji('  ⭐  ')).toBe('⭐');
  });

  it('keeps a multi-codepoint emoji whole rather than splitting it', () => {
    expect(firstEmoji('👩‍💻')).toBe('👩‍💻');
    expect(firstEmoji('🇬🇧')).toBe('🇬🇧');
    expect(firstEmoji('👍🏽')).toBe('👍🏽');
  });

  it('takes only the first when several are pasted', () => {
    expect(firstEmoji('🔥💡📚')).toBe('🔥');
  });
});