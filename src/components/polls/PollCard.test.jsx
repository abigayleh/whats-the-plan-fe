import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/utils';
import PollCard from './PollCard';

const basePoll = (over = {}) => ({
  id: 'p1',
  question: 'Lunch spot?',
  totalVotes: 4,
  myVote: null,
  expiresAt: null,
  createdById: 'u1',
  options: [
    { id: 'o1', text: 'Tacos', voteCount: 3 },
    { id: 'o2', text: 'Pizza', voteCount: 1 },
  ],
  ...over,
});

const group = { id: 'g1', name: 'Foodies', colorKey: 'amber', role: 'MEMBER' };

describe('PollCard', () => {
  it('renders the question, group name, and option percentages', () => {
    render(<PollCard poll={basePoll()} group={group} onVote={vi.fn()} />);
    expect(screen.getByText('Lunch spot?')).toBeInTheDocument();
    expect(screen.getByText('Foodies')).toBeInTheDocument();
    expect(screen.getByText('75% (3)')).toBeInTheDocument();
    expect(screen.getByText('25% (1)')).toBeInTheDocument();
    expect(screen.getByText('4 votes')).toBeInTheDocument();
  });

  it('shows 0% for every option when there are no votes', () => {
    const poll = basePoll({
      totalVotes: 0,
      options: [{ id: 'o1', text: 'A', voteCount: 0 }, { id: 'o2', text: 'B', voteCount: 0 }],
    });
    render(<PollCard poll={poll} group={group} onVote={vi.fn()} />);
    expect(screen.getAllByText('0% (0)')).toHaveLength(2);
    expect(screen.getByText('0 votes')).toBeInTheDocument();
  });

  it('uses singular "vote" for a single total vote', () => {
    render(<PollCard poll={basePoll({ totalVotes: 1 })} group={group} onVote={vi.fn()} />);
    expect(screen.getByText('1 vote')).toBeInTheDocument();
  });

  it('calls onVote with poll and option ids when an option is clicked', async () => {
    const onVote = vi.fn();
    render(<PollCard poll={basePoll()} group={group} onVote={onVote} />);
    await userEvent.click(screen.getByText('Tacos'));
    expect(onVote).toHaveBeenCalledWith('p1', 'o1');
  });

  it('disables the option the user already voted for', () => {
    render(<PollCard poll={basePoll({ myVote: 'o1' })} group={group} onVote={vi.fn()} />);
    expect(screen.getByText('Tacos').closest('button')).toBeDisabled();
    expect(screen.getByText('Pizza').closest('button')).toBeEnabled();
  });

  it('disables all options and shows Closed for an expired poll', () => {
    const poll = basePoll({ expiresAt: new Date(Date.now() - 1000) });
    render(<PollCard poll={poll} group={group} onVote={vi.fn()} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Tacos').closest('button')).toBeDisabled();
    expect(screen.getByText('Pizza').closest('button')).toBeDisabled();
  });

  it('shows a "Closes" label for a future expiry', () => {
    const poll = basePoll({ expiresAt: new Date(Date.now() + 86400000) });
    render(<PollCard poll={poll} group={group} onVote={vi.fn()} />);
    expect(screen.getByText(/^Closes /)).toBeInTheDocument();
  });

  it('renders a delete button that calls onDelete only when provided', async () => {
    const onDelete = vi.fn();
    const poll = basePoll();
    const { rerender } = render(
      <PollCard poll={poll} group={group} onVote={vi.fn()} onDelete={onDelete} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete poll' }));
    expect(onDelete).toHaveBeenCalledWith(poll);

    rerender(<PollCard poll={poll} group={group} onVote={vi.fn()} onDelete={null} />);
    expect(screen.queryByRole('button', { name: 'Delete poll' })).not.toBeInTheDocument();
  });

  it('falls back to "Unknown group" when no group is supplied', () => {
    render(<PollCard poll={basePoll()} group={undefined} onVote={vi.fn()} />);
    expect(screen.getByText('Unknown group')).toBeInTheDocument();
  });
});