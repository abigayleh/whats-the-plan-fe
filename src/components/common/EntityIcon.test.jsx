import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import EntityIcon from './EntityIcon';

function Fallback(props) {
  return <svg data-testid="fallback" {...props} />;
}

describe('EntityIcon', () => {
  it('renders the fallback when no icon is set', () => {
    render(<EntityIcon icon={null} fallback={<Fallback />} />);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('renders nothing when there is no icon and no fallback', () => {
    const { container } = render(<EntityIcon icon={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a known icon key as an svg, not as text', () => {
    const { container } = render(<EntityIcon icon="shopping" fallback={<Fallback />} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('renders an unknown value as a literal emoji', () => {
    render(<EntityIcon icon="🎯" fallback={<Fallback />} />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
  });

  it('sizes the emoji when a size is given, and leaves it to CSS when not', () => {
    const { container, rerender } = render(<EntityIcon icon="⭐" size={28} />);
    expect(container.querySelector('.entity-emoji')).toHaveStyle({ fontSize: '28px' });
    rerender(<EntityIcon icon="⭐" />);
    expect(container.querySelector('.entity-emoji').style.fontSize).toBe('');
  });
});