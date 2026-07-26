import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import ToggleChips from './ToggleChips';

const items = [
  { id: null, name: 'Personal', colorKey: 'primary' },
  { id: 'g1', name: 'Barcelona', colorKey: 'coral' },
];

describe('ToggleChips', () => {
  it('renders a chip per item labelled by name', () => {
    render(<ToggleChips items={items} activeIds={new Set([null, 'g1'])} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barcelona' })).toBeInTheDocument();
  });

  it('reflects active state via aria-pressed', () => {
    render(<ToggleChips items={items} activeIds={new Set(['g1'])} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Barcelona' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Personal' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggle with the item id (including null for personal)', async () => {
    const onToggle = vi.fn();
    render(<ToggleChips items={items} activeIds={new Set()} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: 'Personal' }));
    expect(onToggle).toHaveBeenCalledWith(null);
    await userEvent.click(screen.getByRole('button', { name: 'Barcelona' }));
    expect(onToggle).toHaveBeenCalledWith('g1');
  });
});