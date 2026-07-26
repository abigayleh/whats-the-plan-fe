import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, userEvent } from '../../test/utils';
import Header from './Header';
import useAppData from '../../hooks/useAppData';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../../hooks/useAuth', () => ({ default: vi.fn() }));

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useAppData).mockReturnValue({ currentUser: { name: 'Ada' } });
    vi.mocked(useAuth).mockReturnValue({ signOut: vi.fn() });
  });

  it('shows a greeting and the current user name and avatar initial', () => {
    renderWithRouter(<Header onOpenNav={vi.fn()} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toHaveTextContent('A');
  });

  it('calls onOpenNav from the menu toggle', async () => {
    const onOpenNav = vi.fn();
    renderWithRouter(<Header onOpenNav={onOpenNav} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(onOpenNav).toHaveBeenCalledTimes(1);
  });

  it('toggles the profile menu open', async () => {
    renderWithRouter(<Header onOpenNav={vi.fn()} />);
    expect(screen.queryByText('Profile settings')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
  });
});