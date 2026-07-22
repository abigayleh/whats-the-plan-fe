import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SideNav from './SideNav';
import Confetti from '../common/Confetti';
import useAppData from '../../hooks/useAppData';

function AppShell() {
  const { pathname } = useLocation();
  const { confettiKey } = useAppData();
  // The calendar (index route) and Pages (tree + editor) benefit from the full content
  // width — everything else stays capped at the usual reading width.
  const isFullWidth = pathname === '/' || pathname.startsWith('/pages') || pathname.startsWith('/itinerary');
  // Mobile-only: the side nav becomes a slide-in drawer toggled from the header.
  const [navOpen, setNavOpen] = useState(false);

  // Close the drawer whenever the route changes (i.e. a nav item was tapped).
  useEffect(() => { setNavOpen(false); }, [pathname]);

  return (
    <div className="app-shell">
      <Confetti trigger={confettiKey} />
      <SideNav open={navOpen} />
      {navOpen && (
        <button
          type="button"
          className="app-shell__nav-backdrop"
          onClick={() => setNavOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="app-shell__main">
        <Header onOpenNav={() => setNavOpen(true)} />
        <main className={`app-shell__content${isFullWidth ? ' app-shell__content--full' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
