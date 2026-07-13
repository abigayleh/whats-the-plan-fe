import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function RequireAuth() {
  const { status } = useAuth();
  if (status === 'loading') return <div className="auth-loading">Loading…</div>;
  if (status !== 'authed') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default RequireAuth;
