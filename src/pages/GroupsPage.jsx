import { useState } from 'react';
import { GroupsIcon, PlusIcon } from '../components/layout/icons';
import GroupCard from '../components/groups/GroupCard';
import GroupCreateModal from '../components/groups/GroupCreateModal';
import PersonalSpaceModal from '../components/groups/PersonalSpaceModal';
import useAppData from '../hooks/useAppData';

function GroupsPage() {
  const {
    groups, personalSpace, addGroup, updatePersonalSpace,
  } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);

  return (
    <section className="page">
      <div className="page__header">
        <span className="page__badge page__badge--coral">
          <GroupsIcon />
        </span>
        <h1 className="page__title">Groups</h1>
        <button
          type="button"
          className="button button--primary page__header-action"
          onClick={() => setShowModal(true)}
        >
          <PlusIcon width={16} height={16} />
          New Group
        </button>
      </div>

      <div className="group-grid">
        <button
          type="button"
          className={`group-card group-card--${personalSpace.colorKey}`}
          onClick={() => setShowPersonalModal(true)}
        >
          <span className="group-card__icon-badge">{personalSpace.name.charAt(0).toUpperCase()}</span>
          <div className="group-card__body">
            <p className="group-card__name">{personalSpace.name}</p>
            <p className="group-card__member-count">Just you — tap to customize</p>
          </div>
        </button>
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>

      {showModal && (
        <GroupCreateModal
          onClose={() => setShowModal(false)}
          onSave={(payload) => {
            addGroup(payload);
            setShowModal(false);
          }}
        />
      )}

      {showPersonalModal && (
        <PersonalSpaceModal
          personalSpace={personalSpace}
          onClose={() => setShowPersonalModal(false)}
          onSave={updatePersonalSpace}
        />
      )}
    </section>
  );
}

export default GroupsPage;
