import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent,
} from '../test/utils';
import RegisterPage from './RegisterPage';
import useAuth from '../hooks/useAuth';
import { resendVerification } from '../api/auth';

vi.mock('../hooks/useAuth', () => ({ default: vi.fn() }));
vi.mock('../api/auth', () => ({ resendVerification: vi.fn() }));

describe('RegisterPage', () => {
  let register;
  beforeEach(() => {
    register = vi.fn().mockResolvedValue();
    vi.mocked(useAuth).mockReturnValue({ register });
    vi.mocked(resendVerification).mockResolvedValue();
  });

  async function fill({ password = 'secret', confirm = 'secret' } = {}) {
    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), password);
    await userEvent.type(screen.getByLabelText('Confirm password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
  }

  it('blocks submission when passwords do not match', async () => {
    renderWithRouter(<RegisterPage />);
    await fill({ confirm: 'different' });
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers and shows the check-your-email screen', async () => {
    renderWithRouter(<RegisterPage />);
    await fill();
    expect(register).toHaveBeenCalledWith('ada@example.com', 'secret', 'Ada');
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('shows an error when registration fails', async () => {
    register.mockRejectedValue(new Error('Email taken'));
    renderWithRouter(<RegisterPage />);
    await fill();
    expect(await screen.findByText('Email taken')).toBeInTheDocument();
  });

  it('resends the verification email from the success screen', async () => {
    renderWithRouter(<RegisterPage />);
    await fill();
    const resend = await screen.findByRole('button', { name: 'Resend email' });
    await userEvent.click(resend);
    expect(resendVerification).toHaveBeenCalledWith('ada@example.com');
  });
});