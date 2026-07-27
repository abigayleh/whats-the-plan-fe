import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LandingPage from '../../pages/LandingPage';

function RequireAuth() {
  const { status } = useAuth();
  const { pathname } = useLocation();
  if (status === 'loading') return <div className="auth-loading">Loading…</div>;
  // Visitors get the marketing page at the root and a login prompt anywhere else. It matches
  // the prerendered dist/index.html, so a crawler and a logged-out browser see the same thing.
  if (status !== 'authed') {
    return pathname === '/' ? <LandingPage /> : <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default RequireAuth;