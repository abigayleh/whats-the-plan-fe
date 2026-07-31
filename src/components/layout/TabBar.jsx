import { NavLink } from 'react-router-dom';
import {
  CalendarIcon, ListsIcon, PagesIcon, MapIcon, MenuIcon,
} from './icons';

const TABS = [
  { to: '/', label: 'Calendar', end: true, Icon: CalendarIcon },
  { to: '/lists', label: 'Lists', Icon: ListsIcon },
  { to: '/pages', label: 'Pages', Icon: PagesIcon },
  { to: '/itinerary', label: 'Trips', Icon: MapIcon },
];

// Mobile-only primary nav. The four busiest destinations get a tab; everything else
// (Polls, Chat, Groups, spaces, account) stays in the drawer behind More.
function TabBar({ onOpenNav }) {
  return (
    <nav className="tab-bar" aria-label="Primary">
      {TABS.map(({
        to, label, end, Icon,
      }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `tab-bar__tab${isActive ? ' tab-bar__tab--active' : ''}`}
        >
          <Icon />
          <span className="tab-bar__label">{label}</span>
        </NavLink>
      ))}
      <button type="button" className="tab-bar__tab" onClick={onOpenNav}>
        <MenuIcon />
        <span className="tab-bar__label">More</span>
      </button>
    </nav>
  );
}

export default TabBar;