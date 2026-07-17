import { useState } from 'react';
import { MenuIcon } from './icons';
import useAppData from '../../hooks/useAppData';
import { getGreeting } from '../../utils/date';
import ProfileMenu from './ProfileMenu';

function Header({ onOpenNav }) {
  const { currentUser } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__nav-toggle"
          onClick={onOpenNav}
          aria-label="Open menu"
        >
          <MenuIcon />
        </button>
        <div>
          <p className="header__eyebrow">{getGreeting()}</p>
          <p className="header__title">{currentUser.name}</p>
        </div>
      </div>
      <div className="header__profile">
        <button
          type="button"
          className="header__avatar"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      </div>
    </header>
  );
}

export default Header;
