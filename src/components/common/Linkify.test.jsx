import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import Linkify from './Linkify';

describe('Linkify', () => {
  it('renders nothing for empty text', () => {
    const { container } = render(<Linkify text="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders plain text with no links', () => {
    render(<Linkify text="just some words" />);
    expect(screen.getByText('just some words')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('turns an http(s) URL into a link opening in a new tab', () => {
    render(<Linkify text="see https://example.com now" />);
    const link = screen.getByRole('link', { name: 'https://example.com' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders multiple URLs as separate links', () => {
    render(<Linkify text="a http://one.com b https://two.com c" />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('stops click propagation so an enclosing row is not triggered', async () => {
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <Linkify text="https://example.com" />
      </div>,
    );
    screen.getByRole('link').click();
    expect(onRowClick).not.toHaveBeenCalled();
  });
});