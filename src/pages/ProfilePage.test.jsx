import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../test/utils';
import ProfilePage from './ProfilePage';
import useAuth from '../hooks/useAuth';
import * as usersApi from '../api/users';

vi.mock('../hooks/useAuth', () => ({ default: vi.fn() }));
vi.mock('../api/users', () => ({
  updateName: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock('../api/client', () => ({ setTokens: vi.fn() }));

const user = { name: 'Ada', email: 'ada@example.com' };

function mockAuth(over = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user, updateUser: vi.fn(), deleteAccount: vi.fn(), ...over,
  });
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockAuth();
    vi.mocked(usersApi.updateName).mockResolvedValue({ user: { name: 'Ada Lovelace' } });
    vi.mocked(usersApi.changePassword).mockResolvedValue({});
    vi.mocked(usersApi.deleteAccount).mockResolvedValue();
  });

  it('prefills the display name', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });

  it('rejects an empty display name', async () => {
    renderWithRouter(<ProfilePage />);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Name cannot be empty')).toBeInTheDocument();
    expect(usersApi.updateName).not.toHaveBeenCalled();
  });

  it('saves a new display name', async () => {
    const updateUser = vi.fn();
    mockAuth({ updateUser });
    renderWithRouter(<ProfilePage />);
    const input = screen.getByLabelText('Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'Ada Lovelace');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(usersApi.updateName).toHaveBeenCalledWith('Ada Lovelace');
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ name: 'Ada Lovelace' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('requires all password fields', async () => {
    renderWithRouter(<ProfilePage />);
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('All fields are required')).toBeInTheDocument();
    expect(usersApi.changePassword).not.toHaveBeenCalled();
  });

  it('rejects mismatched new passwords', async () => {
    renderWithRouter(<ProfilePage />);
    await userEvent.type(screen.getByLabelText('Current password'), 'old');
    await userEvent.type(screen.getByLabelText('New password'), 'newpass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpass2');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('New passwords do not match')).toBeInTheDocument();
    expect(usersApi.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password when the fields are valid', async () => {
    renderWithRouter(<ProfilePage />);
    await userEvent.type(screen.getByLabelText('Current password'), 'old');
    await userEvent.type(screen.getByLabelText('New password'), 'newpass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpass1');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(usersApi.changePassword).toHaveBeenCalledWith('old', 'newpass1');
    expect(await screen.findByText('Password updated')).toBeInTheDocument();
  });

  it('shows a specific message for an incorrect current password', async () => {
    vi.mocked(usersApi.changePassword).mockRejectedValue(
      Object.assign(new Error('x'), { code: 'INVALID_PASSWORD' }),
    );
    renderWithRouter(<ProfilePage />);
    await userEvent.type(screen.getByLabelText('Current password'), 'wrong');
    await userEvent.type(screen.getByLabelText('New password'), 'newpass1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpass1');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
  });

  it('opens the delete account modal', async () => {
    renderWithRouter(<ProfilePage />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete Account' }));
    expect(screen.getByRole('heading', { name: 'Delete account?' })).toBeInTheDocument();
  });
});