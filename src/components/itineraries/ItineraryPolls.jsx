import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import * as itinerariesApi from '../../api/itineraries';
import * as pollsApi from '../../api/polls';
import { adaptPoll } from '../../api/adapters';
import PollCard from '../polls/PollCard';
import PollCreateModal from '../polls/PollCreateModal';
import ConfirmModal from '../common/ConfirmModal';
import { PlusIcon } from '../layout/icons';
import useSocketEvents from '../../hooks/useSocketEvents';

const EVENTS = ['poll:created', 'poll:vote', 'poll:deleted'];

// The Polls tab: the itinerary's own polls (scoped to its group), reusing the polls stack.
function ItineraryPolls({ itinerary, group, currentUser }) {
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmingPoll, setConfirmingPoll] = useState(null);
  const latest = useRef(0);

  const refetch = useCallback(async () => {
    const ticket = latest.current + 1;
    latest.current = ticket;
    try {
      const rows = await itinerariesApi.polls(itinerary.id);
      if (ticket === latest.current) setPolls(rows.map(adaptPoll));
    } catch { /* keep last known */ }
  }, [itinerary.id]);

  useEffect(() => { refetch(); }, [refetch]);
  useSocketEvents(EVENTS, refetch);
  const canDelete = (poll) => poll.createdById === currentUser.id || group?.role === 'ADMIN';

  async function handleVote(pollId, optionId) {
    await pollsApi.vote(pollId, optionId);
    refetch();
  }

  async function confirmDelete() {
    await pollsApi.remove(confirmingPoll.id);
    setConfirmingPoll(null);
    refetch();
  }

  async function handleCreate(payload) {
    await itinerariesApi.createPoll(itinerary.id, {
      question: payload.question,
      options: payload.optionTexts,
      expiresAt: payload.expiresAt?.toISOString() ?? null,
    });
    setShowCreate(false);
    refetch();
  }

  return (
    <div className="itinerary-polls">
      <div className="itinerary-polls__header">
        <button type="button" className="button button--primary" onClick={() => setShowCreate(true)}>
          <PlusIcon width={16} height={16} />
          New poll
        </button>
      </div>

      {polls.length === 0 ? (
        <p className="itinerary-detail__placeholder">No polls yet — start one to decide together.</p>
      ) : (
        <div className="itinerary-polls__list">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              group={group}
              onVote={handleVote}
              onDelete={canDelete(poll) ? setConfirmingPoll : null}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <PollCreateModal groups={[group]} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}

      {confirmingPoll && (
        <ConfirmModal
          title="Delete poll"
          message="Delete this poll?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingPoll(null)}
        />
      )}
    </div>
  );
}

export default ItineraryPolls;