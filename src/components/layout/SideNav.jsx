import { NavLink, Link } from 'react-router-dom';
import {
  CalendarIcon, ListsIcon, PagesIcon, PollsIcon, ChatIcon, GroupsIcon, ChevronIcon,
} from './icons';
import useAppData from '../../hooks/useAppData';
import useLocalStorageState from '../../hooks/useLocalStorageState';
import useMediaQuery from '../../hooks/useMediaQuery';

const NAV_ITEMS = [
  { to: '/', label: 'Calendar', end: true, Icon: CalendarIcon },
  { to: '/lists', label: 'Lists', Icon: ListsIcon },
  { to: '/pages', label: 'Pages', Icon: PagesIcon },
  { to: '/polls', label: 'Polls', Icon: PollsIcon },
  { to: '/chat', label: 'Chat', Icon: ChatIcon, soon: true },
  { to: '/groups', label: 'Groups', Icon: GroupsIcon },
];

function SideNav({ open = false }) {
  const { currentUser, personalSpace, groups } = useAppData();
  const [collapsedPref, setCollapsed] = useLocalStorageState('sidenav-collapsed', false);
  const isMobile = useMediaQuery('(max-width: 767.98px)');
  // The mobile drawer always shows the full nav; collapse is a desktop-only convenience.
  const collapsed = collapsedPref && !isMobile;
  const spaces = [personalSpace, ...groups];

  return (
    <nav className={`side-nav${collapsed ? ' side-nav--collapsed' : ''}${open ? ' side-nav--mobile-open' : ''}`}>
      <div className="side-nav__header">
        {!collapsed && <p className="side-nav__brand">What&apos;s the Plan?</p>}
        {!isMobile && (
          <button
            type="button"
            className="side-nav__collapse-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-tooltip={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronIcon className={`side-nav__collapse-icon${collapsed ? ' side-nav__collapse-icon--collapsed' : ''}`} />
          </button>
        )}
      </div>
      <div className="side-nav__items">
        {NAV_ITEMS.map(({
          to, label, end, Icon, soon,
        }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `side-nav__item${isActive ? ' side-nav__item--active' : ''}`}
            aria-label={collapsed ? label : undefined}
            data-tooltip={collapsed ? label : undefined}
          >
            <span className="side-nav__icon">
              <Icon />
            </span>
            {!collapsed && <span className="side-nav__label">{label}</span>}
            {!collapsed && soon && <span className="side-nav__soon-badge">Soon</span>}
          </NavLink>
        ))}
      </div>

      {!collapsed && (
        <div className="side-nav__spaces">
          <p className="side-nav__spaces-title">Spaces</p>
          {spaces.map((space) => (
            <Link key={space.id ?? 'personal'} to="/groups" className="side-nav__space">
              <span className={`side-nav__space-dot side-nav__space-dot--${space.colorKey}`} />
              {space.name}
            </Link>
          ))}
        </div>
      )}

      <div className="side-nav__account">
        <span className="side-nav__account-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
        {!collapsed && (
          <div className="side-nav__account-info">
            <p className="side-nav__account-name">{currentUser.name}</p>
            <p className="side-nav__account-plan">Free plan</p>
          </div>
        )}
      </div>
    </nav>
  );
}

export default SideNav;
