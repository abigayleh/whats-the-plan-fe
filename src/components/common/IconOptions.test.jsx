import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import IconOptions from './IconOptions';

describe('IconOptions', () => {
  it('reports the picked icon key', async () => {
    const onSelect = vi.fn();
    render(<IconOptions icon={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Travel' }));
    expect(onSelect).toHaveBeenCalledWith('travel');
  });

  it('clears the icon via the No icon option', async () => {
    const onSelect = vi.fn();
    render(<IconOptions icon="travel" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'No icon' }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('offers an emoji row', async () => {
    const onSelect = vi.fn();
    render(<IconOptions icon={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: '🎯' }));
    expect(onSelect).toHaveBeenCalledWith('🎯');
  });

  it('accepts a typed emoji outside the offered set', async () => {
    const onSelect = vi.fn();
    render(<IconOptions icon={null} onSelect={onSelect} />);
    await userEvent.type(screen.getByLabelText('Use a custom emoji'), '🦕');
    await userEvent.click(screen.getByRole('button', { name: 'Use' }));
    expect(onSelect).toHaveBeenCalledWith('🦕');
  });

  it('accepts a typed emoji on Enter without submitting a surrounding form', async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(<form onSubmit={onSubmit}><IconOptions icon={null} onSelect={onSelect} /></form>);
    await userEvent.type(screen.getByLabelText('Use a custom emoji'), '🦕{Enter}');
    expect(onSelect).toHaveBeenCalledWith('🦕');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marks the active option as pressed', () => {
    render(<IconOptions icon="travel" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Travel' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'No icon' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('will not use an empty custom emoji', () => {
    render(<IconOptions icon={null} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Use' })).toBeDisabled();
  });
});
