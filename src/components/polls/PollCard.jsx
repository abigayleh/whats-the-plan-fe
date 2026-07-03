import { formatDateShort } from '../../utils/date';

function PollCard({
  poll, group, currentUser, onVote,
}) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  const isExpired = Boolean(poll.expiresAt) && new Date(poll.expiresAt) < new Date();
  const myVoteOptionId = poll.options.find((option) => option.votes.includes(currentUser.id))?.id;

  return (
    <div className={`poll-card poll-card--${group?.colorKey ?? 'primary'}`}>
      <div className="poll-card__header">
        <span className="poll-card__group-name">{group?.name ?? 'Unknown group'}</span>
        {poll.expiresAt && (
          <span className={`poll-card__expiry${isExpired ? ' poll-card__expiry--expired' : ''}`}>
            {isExpired ? 'Closed' : `Closes ${formatDateShort(new Date(poll.expiresAt))}`}
          </span>
        )}
      </div>

      <p className="poll-card__question">{poll.question}</p>

      <div className="poll-card__options">
        {poll.options.map((option) => {
          const percent = totalVotes === 0 ? 0 : Math.round((option.votes.length / totalVotes) * 100);
          const isMine = option.id === myVoteOptionId;
          return (
            <button
              key={option.id}
              type="button"
              className={`poll-card__option${isMine ? ' poll-card__option--selected' : ''}`}
              onClick={() => onVote(poll.id, option.id)}
              disabled={isExpired}
            >
              <span className="poll-card__option-bar" style={{ width: `${percent}%` }} />
              <span className="poll-card__option-text">{option.text}</span>
              <span className="poll-card__option-stats">{percent}% ({option.votes.length})</span>
            </button>
          );
        })}
      </div>

      <p className="poll-card__total">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</p>
    </div>
  );
}

export default PollCard;
