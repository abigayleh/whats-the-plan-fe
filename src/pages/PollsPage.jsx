import { useMemo, useState } from 'react';
import { PollsIcon, PlusIcon } from '../components/layout/icons';
import ToggleChips from '../components/calendar/ToggleChips';
import PollCard from '../components/polls/PollCard';
import PollCreateModal from '../components/polls/PollCreateModal';
import useAppData from '../hooks/useAppData';
import usePolls from '../hooks/usePolls';
import * as pollsApi from '../api/polls';

function PollsPage() {
  const { groups, currentUser } = useAppData();
  const { polls, refetch } = usePolls(groups);
  const [hiddenGroupIds, setHiddenGroupIds] = useState(() => new Set());
  const [showModal, setShowModal] = useState(false);

  const groupById = useMemo(() => new Map(groups.map((group) => [group.id, group])), [groups]);
  const activeGroupIds = useMemo(
    () => new Set(groups.filter((g) => !hiddenGroupIds.has(g.id)).map((g) => g.id)),
    [groups, hiddenGroupIds],
  );

  // Polls are only ever fetched per group, so a poll whose group is gone is stale — match
  // against the live groups rather than merely un-hidden, or it would render as "Unknown group".
  const visiblePolls = useMemo(
    () => polls.filter((poll) => activeGroupIds.has(poll.groupId)),
    [polls, activeGroupIds],
  );

  function toggleGroup(groupId) {
    setHiddenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  // Only the poll's creator or an admin of its group may delete it (mirrors the API).
  function canDelete(poll) {
    return poll.createdById === currentUser.id || groupById.get(poll.groupId)?.role === 'ADMIN';
  }

  // Both refetch either way: a rejection means this view is out of date (poll just closed,
  // role changed elsewhere), so re-reading is what corrects it.
  async function handleVote(pollId, optionId) {
    try {
      await pollsApi.vote(pollId, optionId);
    } catch { /* swallowed: the refetch below is what resurfaces the true state */ }
    refetch();
  }

  async function handleDelete(poll) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${poll.question}"? This can't be undone.`)) return;
    try {
      await pollsApi.remove(poll.id);
    } catch { /* swallowed: refetch reveals whether it actually went */ }
    refetch();
  }

  async function handleCreate(payload) {
    await pollsApi.create(payload.groupId, {
      question: payload.question,
      options: payload.optionTexts,
      expiresAt: payload.expiresAt ? payload.expiresAt.toISOString() : null,
    });
    setShowModal(false);
    refetch();
  }

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--amber">
          <PollsIcon />
        </span>
        <h1 className="page__title">Polls</h1>
        <div className="page__header-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => setShowModal(true)}
            disabled={groups.length === 0}
          >
            <PlusIcon width={16} height={16} />
            New Poll
          </button>
        </div>
      </div>

      {groups.length > 0 && (
        <ToggleChips items={groups} activeIds={activeGroupIds} onToggle={toggleGroup} />
      )}

      <div className="poll-list">
        {groups.length === 0 && <p className="page__placeholder">Join a group to start polling.</p>}
        {groups.length > 0 && visiblePolls.length === 0 && <p className="page__placeholder">No polls yet.</p>}
        {visiblePolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            group={groupById.get(poll.groupId)}
            onVote={handleVote}
            onDelete={canDelete(poll) ? handleDelete : null}
          />
        ))}
      </div>

      {showModal && (
        <PollCreateModal
          groups={groups}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
    </section>
  );
}

export default PollsPage;
