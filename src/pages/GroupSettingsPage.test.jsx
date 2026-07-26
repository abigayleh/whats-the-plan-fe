import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { Routes, Route } from 'react-router-dom';
import {
  renderWithRouter, screen, userEvent, waitFor,
} from '../test/utils';
import GroupSettingsPage from './GroupSettingsPage';
import useAppData from '../hooks/useAppData';
import * as groupsApi from '../api/groups';

vi.mock('../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../api/groups', () => ({
  get: vi.fn(),
  createInvite: vi.fn(),
  revokeInvite: vi.fn(),
}));
vi.mock('../socket/socketClient', () => ({
  socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

const currentUser = { id: 'u1' };

const group = (over = {}) => ({
  id: 'g1',
  name: 'Barcelona',
  role: 'ADMIN',
  inviteCodes: [{ code: 'JOIN99' }],
  members: [
    { id: 'u1', name: 'Me', role: 'ADMIN', color: 'teal' },
    { id: 'u2', name: 'Bob', role: 'MEMBER', color: 'coral' },
  ],
  ...over,
});

function mockApp(over = {}) {
  vi.mocked(useAppData).mockReturnValue({
    currentUser,
    setMemberRole: vi.fn().mockResolvedValue(),
    removeMember: vi.fn().mockResolvedValue(),
    leaveGroup: vi.fn().mockResolvedValue({ ok: true }),
    deleteGroup: vi.fn().mockResolvedValue(),
    updateGroup: vi.fn().mockResolvedValue(),
    ...over,
  });
}

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/groups" element={<p>Groups list</p>} />
      <Route path="/groups/:groupId/settings" element={<GroupSettingsPage />} />
    </Routes>,
    { route: '/groups/g1/settings' },
  );
}

describe('GroupSettingsPage', () => {
  beforeEach(() => {
    mockApp();
    vi.mocked(groupsApi.get).mockResolvedValue(group());
    vi.mocked(groupsApi.createInvite).mockResolvedValue();
    vi.mocked(groupsApi.revokeInvite).mockResolvedValue();
  });

  it('shows the group name and members once loaded', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Barcelona' })).toBeInTheDocument();
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows a not-found state when the group fails to load', async () => {
    vi.mocked(groupsApi.get).mockRejectedValue(new Error('404'));
    renderPage();
    expect(await screen.findByText('Group not found')).toBeInTheDocument();
  });

  it('exposes admin-only invite code and member controls', async () => {
    renderPage();
    expect(await screen.findByText('JOIN99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeInTheDocument();
    // Actions target the other member, not yourself.
    expect(screen.getByRole('button', { name: 'Make Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('hides admin controls for a non-admin member', async () => {
    vi.mocked(groupsApi.get).mockResolvedValue(group({ role: 'MEMBER' }));
    renderPage();
    await screen.findByRole('heading', { name: 'Barcelona' });
    expect(screen.queryByText('Invite Code')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make Admin' })).not.toBeInTheDocument();
  });

  it('promotes a member through setMemberRole', async () => {
    const setMemberRole = vi.fn().mockResolvedValue();
    mockApp({ setMemberRole });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Make Admin' }));
    expect(setMemberRole).toHaveBeenCalledWith('g1', 'u2', 'ADMIN');
  });

  it('warns the last admin instead of leaving', async () => {
    const leaveGroup = vi.fn().mockResolvedValue({ ok: false, reason: 'LAST_ADMIN' });
    mockApp({ leaveGroup });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Leave Group' }));
    expect(await screen.findByText("You're the only admin")).toBeInTheDocument();
  });

  it('leaves and returns to the group list when not the last admin', async () => {
    const leaveGroup = vi.fn().mockResolvedValue({ ok: true });
    mockApp({ leaveGroup });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Leave Group' }));
    await waitFor(() => expect(screen.getByText('Groups list')).toBeInTheDocument());
  });
});