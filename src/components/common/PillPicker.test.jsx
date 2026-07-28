import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import PillPicker from './PillPicker';

const options = [
  { value: null, label: 'Personal' },
  { value: 'g1', label: 'Crew' },
];

describe('PillPicker', () => {
  it('marks the selected option as pressed', () => {
    render(<PillPicker options={options} value="g1" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Crew' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Personal' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the clicked option value', async () => {
    const onChange = vi.fn();
    render(<PillPicker options={options} value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Crew' }));
    expect(onChange).toHaveBeenCalledWith('g1');
  });

  it('disables every option when disabled', () => {
    render(<PillPicker options={options} value={null} onChange={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Personal' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Crew' })).toBeDisabled();
  });
});
