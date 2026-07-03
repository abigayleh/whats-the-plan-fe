import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { GroupsIcon } from '../components/layout/icons';
import { ACCENT_KEYS } from '../constants/colors';
import useAppData from '../hooks/useAppData';

function GroupSettingsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const {
    groups, currentUser, setMemberRole, removeMember, regenerateInvite, leaveGroup, deleteGroup, updateGroup,
  } = useAppData();
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);

  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <section className="page">
        <div className="page__header">
          <span className="page__badge page__badge--coral">
            <GroupsIcon />
          </span>
          <h1 className="page__title">Group not found</h1>
        </div>
        <Link to="/groups" className="page__back-link">‹ Back to Groups</Link>
      </section>
    );
  }

  const isYouAdmin = group.members.find((member) => member.id === currentUser.id)?.role === 'ADMIN';

  function handleLeaveClick() {
    const result = leaveGroup(group.id);
    if (!result.ok && result.reason === 'LAST_ADMIN') {
      setShowLeaveWarning(true);
      return;
    }
    navigate('/groups');
  }

  function handleDeleteGroup() {
    deleteGroup(group.id);
    navigate('/groups');
  }

  return (
    <section className="page">
      <Link to="/groups" className="page__back-link">‹ Back to Groups</Link>

      <div className="page__header">
        <span className={`page__badge page__badge--${group.colorKey}`}>
          <GroupsIcon />
        </span>
        <h1 className="page__title">{group.name}</h1>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Color</h2>
        <div className="color-picker">
          {ACCENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`color-picker__swatch color-picker__swatch--${key}${group.colorKey === key ? ' color-picker__swatch--active' : ''}`}
              onClick={() => updateGroup(group.id, { colorKey: key })}
              aria-label={key}
              aria-pressed={group.colorKey === key}
            />
          ))}
        </div>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Invite Code</h2>
        <div className="group-settings__invite">
          <code className="group-settings__invite-code">{group.inviteCode}</code>
          <button type="button" className="button button--ghost" onClick={() => regenerateInvite(group.id)}>
            Regenerate
          </button>
        </div>
      </div>

      <div className="page__card">
        <h2 className="group-settings__section-title">Members</h2>
        <div className="member-list">
          {group.members.map((member) => (
            <div key={member.id} className="member-list__row">
              <span className="member-list__avatar">{member.name.charAt(0).toUpperCase()}</span>
              <span className="member-list__name">{member.name}</span>
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
                    onClick={() => setMemberRole(
                      group.id,
                      member.id,
                      member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN',
                    )}
                  >
                    {member.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                  </button>
                  <button
                    type="button"
                    className="member-list__action-button member-list__action-button--danger"
                    onClick={() => removeMember(group.id, member.id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="button button--danger" onClick={handleLeaveClick}>
        Leave Group
      </button>

      {showLeaveWarning && (
        <div className="modal-overlay" onClick={() => setShowLeaveWarning(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">You&apos;re the only admin</h2>
            </div>
            <p className="group-settings__warning-text">
              Promote another member to admin before leaving, or leave anyway to permanently delete this group.
            </p>
            <div className="modal__footer">
              <div className="modal__footer-spacer" />
              <button type="button" className="button button--ghost" onClick={() => setShowLeaveWarning(false)}>
                Cancel
              </button>
              <button type="button" className="button button--danger" onClick={handleDeleteGroup}>
                Leave &amp; Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default GroupSettingsPage;
