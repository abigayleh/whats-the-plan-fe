import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, userEvent, waitFor } from '../../test/utils';
import ProfileMenu from './ProfileMenu';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({ default: vi.fn() }));

describe('ProfileMenu', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ signOut: vi.fn().mockResolvedValue() });
  });

  it('links to profile settings and closes on click', async () => {
    const onClose = vi.fn();
    renderWithRouter(<ProfileMenu onClose={onClose} />);
    const link = screen.getByRole('link', { name: 'Profile settings' });
    expect(link).toHaveAttribute('href', '/profile');
    await userEvent.click(link);
    expect(onClose).toHaveBeenCalled();
  });

  it('signs out when Log out is clicked', async () => {
    const signOut = vi.fn().mockResolvedValue();
    vi.mocked(useAuth).mockReturnValue({ signOut });
    renderWithRouter(<ProfileMenu onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    renderWithRouter(<ProfileMenu onClose={onClose} />);
    await userEvent.click(document.querySelector('.profile-menu__backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});