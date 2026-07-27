import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { renderWithRouter, screen } from '../../test/utils';
import RequireAuth from './RequireAuth';
import useAuth from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth', () => ({ default: vi.fn() }));

function renderAt(route = '/private') {
  return renderWithRouter(
    <Routes>
      <Route path="/login" element={<p>Login screen</p>} />
      <Route element={<RequireAuth />}>
        <Route path="/private" element={<p>Secret content</p>} />
        <Route index element={<p>Secret content</p>} />
      </Route>
    </Routes>,
    { route },
  );
}

describe('RequireAuth', () => {
  beforeEach(() => vi.mocked(useAuth).mockReset());

  it('shows a loading state while auth resolves', () => {
    vi.mocked(useAuth).mockReturnValue({ status: 'loading' });
    renderAt();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ status: 'anon' });
    renderAt();
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('renders the protected outlet when authed', () => {
    vi.mocked(useAuth).mockReturnValue({ status: 'authed' });
    renderAt();
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  // The root is the one public entry point, and its markup is what the build prerenders.
  it('shows the landing page instead of the login redirect at the root', () => {
    vi.mocked(useAuth).mockReturnValue({ status: 'anon' });
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: "What's the Plan?" })).toBeInTheDocument();
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument();
  });

  it('still renders the app at the root when authed', () => {
    vi.mocked(useAuth).mockReturnValue({ status: 'authed' });
    renderAt('/');
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});