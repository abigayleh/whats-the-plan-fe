import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../test/utils';
import LoginPage from './LoginPage';
import useAuth from '../hooks/useAuth';
import { resendVerification } from '../api/auth';

vi.mock('../hooks/useAuth', () => ({ default: vi.fn() }));
vi.mock('../api/auth', () => ({ resendVerification: vi.fn() }));

describe('LoginPage', () => {
  let login;
  beforeEach(() => {
    login = vi.fn().mockResolvedValue();
    vi.mocked(useAuth).mockReturnValue({ login });
    vi.mocked(resendVerification).mockResolvedValue();
  });

  async function fillAndSubmit() {
    await userEvent.type(screen.getByLabelText('Email'), 'me@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  }

  it('submits credentials to login', async () => {
    renderWithRouter(<LoginPage />);
    await fillAndSubmit();
    expect(login).toHaveBeenCalledWith('me@example.com', 'secret');
  });

  it('shows an error message when login rejects', async () => {
    login.mockRejectedValue(new Error('Bad credentials'));
    renderWithRouter(<LoginPage />);
    await fillAndSubmit();
    expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
  });

  it('offers to resend verification for an unverified account', async () => {
    login.mockRejectedValue(Object.assign(new Error('x'), { code: 'EMAIL_UNVERIFIED' }));
    renderWithRouter(<LoginPage />);
    await fillAndSubmit();
    const resend = await screen.findByRole('button', { name: 'Resend verification email' });
    await userEvent.click(resend);
    expect(resendVerification).toHaveBeenCalledWith('me@example.com');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Verification email resent' })).toBeDisabled());
  });

  it('shows a success banner after email verification', () => {
    renderWithRouter(<LoginPage />, { route: '/login?verified=1' });
    expect(screen.getByText('Email verified — you can log in now.')).toBeInTheDocument();
  });

  it('links to the register page', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });
});