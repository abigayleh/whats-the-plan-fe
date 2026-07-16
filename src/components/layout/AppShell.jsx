import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import SideNav from './SideNav';

function AppShell() {
  // The calendar (index route) benefits from the full content width — everything else
  // stays capped at the usual reading width.
  const isFullWidth = useLocation().pathname === '/';

  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-shell__main">
        <Header />
        <main className={`app-shell__content${isFullWidth ? ' app-shell__content--full' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
