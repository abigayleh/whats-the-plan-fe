import {
  describe, it, expect, vi,
} from 'vitest';
import {
  renderWithRouter, screen, waitFor,
} from '../test/utils';
import VerifyPage from './VerifyPage';
import { verifyEmail } from '../api/auth';

vi.mock('../api/auth', () => ({ verifyEmail: vi.fn() }));

// NB: no beforeEach mockReset here — the config's clearMocks/restoreMocks already reset
// between tests. Calling mockReset() in beforeEach orphaned vitest's tracking of the
// failure test's rejected promise and surfaced it as a spurious unhandled rejection.
describe('VerifyPage', () => {
  it('shows an error when no token is present', () => {
    renderWithRouter(<VerifyPage />, { route: '/verify' });
    expect(screen.getByText('Link expired or invalid')).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('verifies the token and shows success', async () => {
    vi.mocked(verifyEmail).mockResolvedValue();
    renderWithRouter(<VerifyPage />, { route: '/verify?token=abc' });
    await waitFor(() => expect(screen.getByText('Email verified')).toBeInTheDocument());
    expect(verifyEmail).toHaveBeenCalledWith('abc');
  });

  it('shows an error when verification fails', async () => {
    vi.mocked(verifyEmail).mockRejectedValue(new Error('expired'));
    renderWithRouter(<VerifyPage />, { route: '/verify?token=bad' });
    await waitFor(() => expect(screen.getByText('Link expired or invalid')).toBeInTheDocument());
    expect(verifyEmail).toHaveBeenCalledWith('bad');
  });
});