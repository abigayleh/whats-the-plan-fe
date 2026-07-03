import { useState } from 'react';
import useAppData from '../../hooks/useAppData';
import { getGreeting } from '../../utils/date';
import ProfileMenu from './ProfileMenu';

function Header() {
  const { currentUser } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div>
        <p className="header__eyebrow">{getGreeting()}</p>
        <p className="header__title">{currentUser.name}</p>
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
