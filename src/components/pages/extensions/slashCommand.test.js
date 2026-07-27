import { describe, it, expect } from 'vitest';
import slashCommand, { filterCommands } from './slashCommand';

const titlesFor = (query) => filterCommands(query).map((c) => c.title);

describe('slashCommand extension', () => {
  it('is named slashCommand', () => {
    expect(slashCommand.name).toBe('slashCommand');
  });

  it('registers ProseMirror plugins (the "/" suggestion menu)', () => {
    const plugins = slashCommand.config.addProseMirrorPlugins.call({ editor: {} });
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  // The item is titled "To-do list", so a plain title match found nothing for "/todo".
  it.each(['todo', 'task', 'check', 'checklist', 'to-do'])('finds the to-do block for "/%s"', (query) => {
    expect(titlesFor(query)).toContain('To-do list');
  });

  it('offers nothing for a query that matches no block', () => {
    expect(titlesFor('zzz')).toEqual([]);
  });
});