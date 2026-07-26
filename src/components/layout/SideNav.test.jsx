import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { renderWithRouter, screen, within } from '../../test/utils';
import SideNav from './SideNav';
import useAppData from '../../hooks/useAppData';

vi.mock('../../hooks/useAppData', () => ({ default: vi.fn() }));

describe('SideNav', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    });
    vi.mocked(useAppData).mockReturnValue({
      currentUser: { name: 'Ada' },
      personalSpace: { name: 'Personal', colorKey: 'primary' },
      groups: [{ id: 'g1', name: 'Trip', colorKey: 'teal' }],
    });
  });

  it('renders all primary nav items', () => {
    renderWithRouter(<SideNav />);
    ['Calendar', 'Lists', 'Pages', 'Itinerary', 'Polls', 'Chat', 'Groups'].forEach((label) => {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    });
  });

  it('marks Chat as coming soon', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByText('Soon')).toBeInTheDocument();
  });

  it('lists the personal space and group under Spaces', () => {
    renderWithRouter(<SideNav />);
    const spaces = screen.getByText('Spaces').closest('.side-nav__spaces');
    expect(within(spaces).getByText('Personal')).toBeInTheDocument();
    expect(within(spaces).getByText('Trip')).toBeInTheDocument();
  });

  it('shows the account name', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Free plan')).toBeInTheDocument();
  });
});