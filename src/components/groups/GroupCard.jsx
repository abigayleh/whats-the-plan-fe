import { Link } from 'react-router-dom';

function GroupCard({ group }) {
  return (
    <Link to={`/groups/${group.id}/settings`} className={`group-card group-card--${group.colorKey}`}>
      <span className="group-card__icon-badge">{group.name.charAt(0).toUpperCase()}</span>
      <div className="group-card__body">
        <p className="group-card__name">{group.name}</p>
        <p className="group-card__member-count">
          {group.memberCount} member{group.memberCount === 1 ? '' : 's'}
        </p>
      </div>
    </Link>
  );
}

export default GroupCard;
