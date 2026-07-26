import { describe, it, expect } from 'vitest';
import { renderWithRouter, screen } from '../../test/utils';
import GroupCard from './GroupCard';

describe('GroupCard', () => {
  it('renders the name, initial badge, and links to settings', () => {
    renderWithRouter(<GroupCard group={{
      id: 'g1', name: 'Barcelona', colorKey: 'teal', memberCount: 3,
    }}
    />);
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/groups/g1/settings');
  });

  it('uses singular "member" for a group of one', () => {
    renderWithRouter(<GroupCard group={{
      id: 'g2', name: 'Solo', colorKey: 'primary', memberCount: 1,
    }}
    />);
    expect(screen.getByText('1 member')).toBeInTheDocument();
  });
});