import { useMemo, useState } from 'react';
import { PollsIcon, PlusIcon } from '../components/layout/icons';
import ToggleChips from '../components/calendar/ToggleChips';
import PollCard from '../components/polls/PollCard';
import PollCreateModal from '../components/polls/PollCreateModal';
import useAppData from '../hooks/useAppData';

function PollsPage() {
  const {
    groups, polls, currentUser, addPoll, vote,
  } = useAppData();
  const [activeGroupIds, setActiveGroupIds] = useState(() => new Set(groups.map((group) => group.id)));
  const [showModal, setShowModal] = useState(false);

  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);

  const visiblePolls = useMemo(
    () => polls.filter((poll) => activeGroupIds.has(poll.groupId)),
    [polls, activeGroupIds],
  );

  function toggleGroup(groupId) {
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--amber">
          <PollsIcon />
        </span>
        <h1 className="page__title">Polls</h1>
        <button
          type="button"
          className="button button--primary page__header-action"
          onClick={() => setShowModal(true)}
          disabled={groups.length === 0}
        >
          <PlusIcon width={16} height={16} />
          New Poll
        </button>
      </div>

      {groups.length > 0 && (
        <ToggleChips items={groups} activeIds={activeGroupIds} onToggle={toggleGroup} />
      )}

      <div className="poll-list">
        {visiblePolls.length === 0 && <p className="page__placeholder">No polls yet.</p>}
        {visiblePolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            group={groupById.get(poll.groupId)}
            currentUser={currentUser}
            onVote={vote}
          />
        ))}
      </div>

      {showModal && (
        <PollCreateModal
          groups={groups}
          onClose={() => setShowModal(false)}
          onSave={(payload) => {
            addPoll(payload);
            setShowModal(false);
          }}
        />
      )}
    </section>
  );
}

export default PollsPage;
