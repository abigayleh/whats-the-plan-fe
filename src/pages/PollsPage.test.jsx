import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  render, screen, userEvent, waitFor,
} from '../test/utils';
import PollsPage from './PollsPage';
import useAppData from '../hooks/useAppData';
import usePolls from '../hooks/usePolls';
import * as pollsApi from '../api/polls';

vi.mock('../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../hooks/usePolls', () => ({ default: vi.fn() }));
vi.mock('../api/polls', () => ({
  vote: vi.fn(), remove: vi.fn(), create: vi.fn(), listForGroup: vi.fn(),
}));

const group = { id: 'g1', name: 'Foodies', colorKey: 'amber', role: 'MEMBER' };
const currentUser = { id: 'u1' };

const poll = (over = {}) => ({
  id: 'p1',
  groupId: 'g1',
  question: 'Lunch spot?',
  totalVotes: 1,
  myVote: null,
  expiresAt: null,
  createdById: 'u1',
  options: [
    { id: 'o1', text: 'Tacos', voteCount: 1 },
    { id: 'o2', text: 'Pizza', voteCount: 0 },
  ],
  ...over,
});

function mockData({ groups = [group], polls = [], refetch = vi.fn() } = {}) {
  vi.mocked(useAppData).mockReturnValue({ groups, currentUser });
  vi.mocked(usePolls).mockReturnValue({ polls, refetch });
  return { refetch };
}

describe('PollsPage', () => {
  beforeEach(() => {
    vi.mocked(pollsApi.vote).mockResolvedValue();
    vi.mocked(pollsApi.remove).mockResolvedValue();
    vi.mocked(pollsApi.create).mockResolvedValue();
  });

  it('prompts to join a group and disables New Poll when the user has none', () => {
    mockData({ groups: [] });
    render(<PollsPage />);
    expect(screen.getByText('Join a group to start polling.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Poll/ })).toBeDisabled();
  });

  it('shows an empty message when a group has no polls', () => {
    mockData({ polls: [] });
    render(<PollsPage />);
    expect(screen.getByText('No polls yet.')).toBeInTheDocument();
  });

  it('renders poll cards for visible groups', () => {
    mockData({ polls: [poll()] });
    render(<PollsPage />);
    expect(screen.getByText('Lunch spot?')).toBeInTheDocument();
  });

  it('votes through the api and refetches', async () => {
    const { refetch } = mockData({ polls: [poll()] });
    render(<PollsPage />);
    await userEvent.click(screen.getByText('Pizza'));
    expect(pollsApi.vote).toHaveBeenCalledWith('p1', 'o2');
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('opens the create modal from New Poll', async () => {
    mockData({ polls: [] });
    render(<PollsPage />);
    await userEvent.click(screen.getByRole('button', { name: /New Poll/ }));
    expect(screen.getByRole('heading', { name: 'New Poll' })).toBeInTheDocument();
  });

  it('lets the poll creator delete via the confirm dialog', async () => {
    const { refetch } = mockData({ polls: [poll()] });
    render(<PollsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
    expect(screen.getByText(/Delete "Lunch spot\?"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(pollsApi.remove).toHaveBeenCalledWith('p1');
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('hides delete for polls the user cannot remove', () => {
    mockData({ polls: [poll({ createdById: 'someone-else' })] });
    render(<PollsPage />);
    expect(screen.queryByRole('button', { name: 'Delete poll' })).not.toBeInTheDocument();
  });

  it('shows delete for an admin even on another user\'s poll', () => {
    mockData({
      groups: [{ ...group, role: 'ADMIN' }],
      polls: [poll({ createdById: 'someone-else' })],
    });
    render(<PollsPage />);
    expect(screen.getByRole('button', { name: 'Delete poll' })).toBeInTheDocument();
  });
});