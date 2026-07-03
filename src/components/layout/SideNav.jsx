import { NavLink } from 'react-router-dom';
import {
  CalendarIcon, ListsIcon, PollsIcon, ChatIcon, GroupsIcon, ChevronIcon,
} from './icons';
import useLocalStorageState from '../../hooks/useLocalStorageState';

const NAV_ITEMS = [
  { to: '/', label: 'Calendar', end: true, Icon: CalendarIcon, accent: 'coral' },
  { to: '/lists', label: 'Lists', Icon: ListsIcon, accent: 'teal' },
  { to: '/polls', label: 'Polls', Icon: PollsIcon, accent: 'amber' },
  {
    to: '/chat', label: 'Chat', Icon: ChatIcon, accent: 'blue', soon: true,
  },
  { to: '/groups', label: 'Groups', Icon: GroupsIcon, accent: 'coral' },
];

function SideNav() {
  const [collapsed, setCollapsed] = useLocalStorageState('sidenav-collapsed', false);

  return (
    <nav className={`side-nav${collapsed ? ' side-nav--collapsed' : ''}`}>
      <div className="side-nav__header">
        {!collapsed && <p className="side-nav__brand">What&apos;s the Plan?</p>}
        <button
          type="button"
          className="side-nav__collapse-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon className={`side-nav__collapse-icon${collapsed ? ' side-nav__collapse-icon--collapsed' : ''}`} />
        </button>
      </div>
      <div className="side-nav__items">
        {NAV_ITEMS.map(({
          to, label, end, Icon, accent, soon,
        }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `side-nav__item${isActive ? ` side-nav__item--active side-nav__item--${accent}` : ''}`}
            title={collapsed ? label : undefined}
          >
            <span className="side-nav__icon">
              <Icon />
            </span>
            {!collapsed && <span className="side-nav__label">{label}</span>}
            {!collapsed && soon && <span className="side-nav__soon-badge">Soon</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default SideNav;
