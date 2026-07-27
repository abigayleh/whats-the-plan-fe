import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import LandingPage from './LandingPage';
import { SITE_NAME, SITE_DESCRIPTION, FEATURES } from '../constants/site';

describe('LandingPage', () => {
  // Rendering without a router is the point: scripts/prerender.js has no router context,
  // so a <Link> creeping in here would break the build rather than just this test.
  it('renders the marketing copy without a router', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { level: 1, name: SITE_NAME })).toBeInTheDocument();
    expect(screen.getByText(SITE_DESCRIPTION)).toBeInTheDocument();
    FEATURES.forEach(({ name }) => {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    });
  });

  it('links to the demo, registration and login as crawlable anchors', () => {
    render(<LandingPage />);
    expect(screen.getByRole('link', { name: 'Try the live demo' })).toHaveAttribute('href', '/demo');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });
});