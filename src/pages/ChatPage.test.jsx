import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import ChatPage from './ChatPage';

describe('ChatPage', () => {
  it('renders the coming-soon placeholder', () => {
    render(<ChatPage />);
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText(/message anyone you share a group with/)).toBeInTheDocument();
  });
});