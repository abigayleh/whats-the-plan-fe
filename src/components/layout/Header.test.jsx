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
    renderWithRouter(<Header />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open profile menu' })).toHaveTextContent('A');
  });

  // The drawer is opened from the tab bar's More on mobile; the header no longer duplicates it.
  it('has no menu toggle', () => {
    renderWithRouter(<Header />);
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('toggles the profile menu open', async () => {
    renderWithRouter(<Header />);
    expect(screen.queryByText('Profile settings')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
  });
});