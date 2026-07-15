import { TrashIcon } from '../layout/icons';
import { formatDateShort } from '../../utils/date';

function PollCard({
  poll, group, onVote, onDelete,
}) {
  const { totalVotes, myVote } = poll;
  // Derived at render, not read from the payload, so a poll left open on screen closes itself.
  const closed = Boolean(poll.expiresAt) && poll.expiresAt <= new Date();

  return (
    <div className={`poll-card poll-card--${group?.colorKey ?? 'primary'}`}>
      <div className="poll-card__header">
        <span className="poll-card__group-name">{group?.name ?? 'Unknown group'}</span>
        {poll.expiresAt && (
          <span className={`poll-card__expiry${closed ? ' poll-card__expiry--expired' : ''}`}>
            {closed ? 'Closed' : `Closes ${formatDateShort(poll.expiresAt)}`}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            className="task-actions__button task-actions__button--danger"
            onClick={() => onDelete(poll)}
            aria-label="Delete poll"
            data-tooltip="Delete poll"
          >
            <TrashIcon width={15} height={15} />
          </button>
        )}
      </div>

      <p className="poll-card__question">{poll.question}</p>

      <div className="poll-card__options">
        {poll.options.map((option) => {
          const percent = totalVotes === 0 ? 0 : Math.round((option.voteCount / totalVotes) * 100);
          const isMine = option.id === myVote;
          return (
            <button
              key={option.id}
              type="button"
              className={`poll-card__option${isMine ? ' poll-card__option--selected' : ''}`}
              onClick={() => onVote(poll.id, option.id)}
              disabled={closed || isMine}
            >
              <span className="poll-card__option-bar" style={{ width: `${percent}%` }} />
              <span className="poll-card__option-text">{option.text}</span>
              <span className="poll-card__option-stats">{percent}% ({option.voteCount})</span>
            </button>
          );
        })}
      </div>

      <p className="poll-card__total">{totalVotes} vote{totalVotes === 1 ? '' : 's'}</p>
    </div>
  );
}

export default PollCard;
