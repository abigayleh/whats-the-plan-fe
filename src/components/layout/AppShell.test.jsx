import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { Routes, Route } from 'react-router-dom';
import { renderWithRouter, screen, userEvent } from '../../test/utils';
import AppShell from './AppShell';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));
vi.mock('../../hooks/useAuth', () => ({ default: () => ({ signOut: vi.fn() }) }));

describe('AppShell', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    });
    vi.mocked(useAppData).mockReturnValue({
      currentUser: { name: 'Ada' },
      personalSpace: { name: 'Personal', colorKey: 'primary' },
      groups: [],
      confettiKey: 0,
    });
  });

  it('renders the shell chrome and the routed page content', () => {
    renderWithRouter(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Page body</p>} />
        </Route>
      </Routes>,
      { route: '/' },
    );
    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
    // Brand from the side nav proves the shell mounted around the outlet.
    expect(screen.getByText("What's the Plan?")).toBeInTheDocument();
  });

  it('opens the nav drawer from the More tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Page body</p>} />
        </Route>
      </Routes>,
      { route: '/' },
    );
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More' }));
    // The backdrop only renders while the drawer is open.
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });
});