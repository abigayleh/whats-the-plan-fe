import { describe, it, expect } from 'vitest';
import PageLink from './PageLink';

// Node config only — the visual chip is covered end-to-end in PageDocument.test.jsx.
describe('PageLink node', () => {
  it('is an inline, atomic node named pageLink', () => {
    expect(PageLink.name).toBe('pageLink');
    expect(PageLink.config.group).toBe('inline');
    expect(PageLink.config.inline).toBe(true);
    expect(PageLink.config.atom).toBe(true);
  });

  it('declares a nullable pageId attribute', () => {
    const attrs = PageLink.config.addAttributes.call(PageLink);
    expect(attrs.pageId).toEqual({ default: null });
  });
});