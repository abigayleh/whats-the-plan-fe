import { describe, it, expect } from 'vitest';
import slashCommand from './slashCommand';

describe('slashCommand extension', () => {
  it('is named slashCommand', () => {
    expect(slashCommand.name).toBe('slashCommand');
  });

  it('registers ProseMirror plugins (the "/" suggestion menu)', () => {
    const plugins = slashCommand.config.addProseMirrorPlugins.call({ editor: {} });
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });
});