import { describe, it, expect } from 'vitest';
import { attachmentSrc, attachmentIdFrom } from './attachmentSrc';

describe('attachmentSrc', () => {
  it('round-trips an id', () => {
    expect(attachmentIdFrom(attachmentSrc('abc-123'))).toBe('abc-123');
  });

  it('ignores anything that is not a reference', () => {
    expect(attachmentIdFrom('https://example.com/a.png')).toBeNull();
    expect(attachmentIdFrom('data:image/jpeg;base64,AAAA')).toBeNull();
    expect(attachmentIdFrom('')).toBeNull();
    expect(attachmentIdFrom(null)).toBeNull();
    expect(attachmentIdFrom(undefined)).toBeNull();
  });

  it('treats a bare prefix with no id as not a reference', () => {
    expect(attachmentIdFrom('attachment:')).toBeNull();
  });
});