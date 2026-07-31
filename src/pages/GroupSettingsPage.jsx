import { useState, useEffect, useCallback } from 'react';
import {
  Link, useNavigate, useParams,
} from 'react-router-dom';
import { GroupsIcon } from '../components/layout/icons';
import ConfirmModal from '../components/common/ConfirmModal';
import { ACCENT_KEYS } from '../constants/colors';
import useAppData from '../hooks/useAppData';
import useSocketEvents from '../hooks/useSocketEvents';
import useDocumentTitle from '../hooks/useDocumentTitle';
import * as groupsApi from '../api/groups';
import { socket } from '../socket/socketClient';

const MEMBER_EVENTS = ['group:member-joined', 'group:member-left'];

function GroupSettingsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const {
    currentUser, setMemberRole, removeMember, leaveGroup, deleteGroup, updateGroup,
  } = useAppData();
  const [group, setGroup] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [error, setError] = useState(null);
  useDocumentTitle(group ? `${group.name} settings` : 'Group settings');

  const reload = useCallback(async () => {
    try {
      setGroup(await groupsApi.get(groupId));
      setStatus('ready');
    } catch {
      setStatus('notfound');
    }
  }, [groupId]);

  useEffect(() => { reload(); }, [reload]);

  // Keep this page in sync with membership changes — and with whatever was missed while the
  // socket was down, which arrives as a payload-less 'connect' (see useSocketEvents).
  const onMemberChange = useCallback(
    (payload) => { if (!payload || payload.groupId === groupId) reload(); },
    [groupId, reload],
  );
  useSocketEvents(MEMBER_EVENTS, onMemberChange);

  useEffect(() => {
    const onDeleted = ({ groupId: gid }) => { if (gid === groupId) navigate('/groups'); };
    socket.on('group:deleted', onDeleted);
    return () => socket.off('group:deleted', onDeleted);
  }, [groupId, navigate]);

  if (status === 'loading') return <section className="page"><p>Loading…</p></section>;

  if (status === 'notfound') {
    return (
      <section className="page">
        <div className="page__header">
          <span className="page__badge page__badge--coral"><GroupsIcon /></span>
          <h1 className="page__title">Group not found</h1>
        </div>
        <Link to="/groups" className="page__back-link">‹ Back to Groups</Link>
      </section>
    );
  }

  const isYouAdmin = group.role === 'ADMIN';
  const myColor = group.members.find((m) => m.id === currentUser.id)?.color || 'primary';
  const activeCode = group.inviteCodes?.[0]?.code;

  async function run(action) {
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err.code === 'LAST_ADMIN' ? 'This would leave the group without an admin.' : (err.message || 'Something went wrong'));
    }
  }

  async function regenerateInvite() {
    await run(async () => {
      if (activeCode) await groupsApi.revokeInvite(groupId, activeCode);
      await groupsApi.createInvite(groupId);
    });
  }

  async function handleLeaveClick() {
    const result = await leaveGroup(group.id);
    if (!result.ok && result.reason === 'LAST_ADMIN') {
      setShowLeaveWarning(true);
      return;
    }
    navigate('/groups');
  }

  async function handleDeleteGroup() {
    await deleteGroup(group.id);
    navigate('/groups');
  }

  return (
    <section className="page">
      <Link to="/groups" className="page__back-link">‹ Back to Groups</Link>

      <div className="page__header">
        <span className={`page__badge page__badge--${myColor}`}>
          <GroupsIcon />
        </span>
        <h1 className="page__title">{group.name}</h1>
      </div>

      {error && <p className="auth-card__error">{error}</p>}

      <div className="page__card">
        <h2 className="group-settings__section-title">Color</h2>
        <div className="color-picker">
          {ACCENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`color-picker__swatch color-picker__swatch--${key}${myColor === key ? ' color-picker__swatch--active' : ''}`}
              onClick={() => run(() => updateGroup(group.id, { colorKey: key }))}
              aria-label={key}
              aria-pressed={myColor === key}
            />
          ))}
        </div>
      </div>

      {isYouAdmin && (
        <div className="page__card">
          <h2 className="group-settings__section-title">Invite Code</h2>
          <div className="group-settings__invite">
            <code className="group-settings__invite-code">{activeCode || 'No active code'}</code>
            <button type="button" className="button button--ghost" onClick={regenerateInvite}>
              {activeCode ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      <div className="page__card">
        <h2 className="group-settings__section-title">Members</h2>
        <div className="member-list">
          {group.members.map((member) => {
            const label = member.name || member.email;
            return (
              <div key={member.id} className="member-list__row">
                <span className="member-list__avatar">{label.charAt(0).toUpperCase()}</span>
                <span className="member-list__name">{label}</span>
                <span
                  className={`member-list__role-badge${member.role === 'ADMIN' ? ' member-list__role-badge--admin' : ''}`}
                >
                  {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                </span>
                {isYouAdmin && member.id !== currentUser.id && (
                  <div className="member-list__actions">
                    <button
                      type="button"
                      className="member-list__action-button"
                      onClick={() => run(() => setMemberRole(
                        group.id,
                        member.id,
                        member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN',
                      ))}
                    >
                      {member.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                    </button>
                    <button
                      type="button"
                      className="member-list__action-button member-list__action-button--danger"
                      onClick={() => run(() => removeMember(group.id, member.id))}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Danger Zone</h2>
        <div className="group-settings__danger-zone">
          <button type="button" className="button button--danger-solid" onClick={handleLeaveClick}>
            Leave Group
          </button>
        </div>
      </div>

      {showLeaveWarning && (
        <ConfirmModal
          title="You're the only admin"
          message="Promote another member to admin before leaving, or leave anyway to permanently delete this group."
          confirmLabel="Leave & Delete Group"
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowLeaveWarning(false)}
        />
      )}
    </section>
  );
}

export default GroupSettingsPage;
