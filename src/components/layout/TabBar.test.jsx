import { describe, it, expect, vi } from 'vitest';
import { renderWithRouter, screen } from '../../test/utils';
import TabBar from './TabBar';

describe('TabBar', () => {
  it('links to the four primary destinations', () => {
    renderWithRouter(<TabBar onOpenNav={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Lists' })).toHaveAttribute('href', '/lists');
    expect(screen.getByRole('link', { name: 'Pages' })).toHaveAttribute('href', '/pages');
    expect(screen.getByRole('link', { name: 'Trips' })).toHaveAttribute('href', '/itinerary');
  });

  it('marks the tab matching the current route active', () => {
    renderWithRouter(<TabBar onOpenNav={vi.fn()} />, { route: '/lists' });
    expect(screen.getByRole('link', { name: 'Lists' })).toHaveClass('tab-bar__tab--active');
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveClass('tab-bar__tab--active');
  });

  // Calendar is the index route, so without `end` it would stay active everywhere.
  it('does not keep Calendar active on another route', () => {
    renderWithRouter(<TabBar onOpenNav={vi.fn()} />, { route: '/pages' });
    expect(screen.getByRole('link', { name: 'Calendar' })).not.toHaveClass('tab-bar__tab--active');
  });

  it('opens the drawer from More rather than navigating', () => {
    const onOpenNav = vi.fn();
    renderWithRouter(<TabBar onOpenNav={onOpenNav} />);
    const more = screen.getByRole('button', { name: 'More' });
    more.click();
    expect(onOpenNav).toHaveBeenCalledTimes(1);
  });
});