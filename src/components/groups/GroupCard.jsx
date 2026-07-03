import { Link } from 'react-router-dom';

function GroupCard({ group }) {
  const visibleMembers = group.members.slice(0, 4);
  const extraCount = group.members.length - visibleMembers.length;

  return (
    <Link to={`/groups/${group.id}/settings`} className={`group-card group-card--${group.colorKey}`}>
      <span className="group-card__icon-badge">{group.name.charAt(0).toUpperCase()}</span>
      <div className="group-card__body">
        <p className="group-card__name">{group.name}</p>
        <div className="group-card__member-avatars">
          {visibleMembers.map((member) => (
            <span key={member.id} className="group-card__member-avatar">
              {member.name.charAt(0).toUpperCase()}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="group-card__member-avatar group-card__member-avatar--extra">
              +{extraCount}
            </span>
          )}
        </div>
        <p className="group-card__member-count">
          {group.members.length} member{group.members.length === 1 ? '' : 's'}
        </p>
      </div>
    </Link>
  );
}

export default GroupCard;
