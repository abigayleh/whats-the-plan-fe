import { Outlet } from 'react-router-dom';
import Header from './Header';
import SideNav from './SideNav';

function AppShell() {
  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-shell__main">
        <Header />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
