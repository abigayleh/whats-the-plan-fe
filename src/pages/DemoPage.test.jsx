import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, waitFor } from '../test/utils';
import DemoPage from './DemoPage';
import useAuth from '../hooks/useAuth';

vi.mock('../hooks/useAuth');

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

describe('DemoPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signs in and replaces the entry in history so Back leaves the app', async () => {
    const demoLogin = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ demoLogin });

    renderWithRouter(<DemoPage />);
    expect(screen.getByText(/Opening the demo/)).toBeInTheDocument();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(demoLogin).toHaveBeenCalledTimes(1);
  });

  it('shows a failure state instead of hanging when the demo is unavailable', async () => {
    useAuth.mockReturnValue({ demoLogin: vi.fn().mockRejectedValue(new Error('404')) });

    renderWithRouter(<DemoPage />);
    expect(await screen.findByText('Demo unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to log in' })).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Re-running the effect would spend a request against the demo rate limit for nothing.
  it('only signs in once even if the effect runs again', async () => {
    const demoLogin = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ demoLogin });

    const { rerender } = renderWithRouter(<DemoPage />);
    rerender(<DemoPage />);

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(demoLogin).toHaveBeenCalledTimes(1);
  });
});