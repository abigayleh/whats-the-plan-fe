import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render } from '../../test/utils';
import Confetti from './Confetti';

function mockReducedMotion(matches) {
  window.matchMedia = vi.fn().mockReturnValue({ matches });
}

describe('Confetti', () => {
  beforeEach(() => mockReducedMotion(false));

  it('renders nothing at the initial (0) trigger', () => {
    const { container } = render(<Confetti trigger={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders confetti pieces when triggered', () => {
    const { container } = render(<Confetti trigger={1} />);
    expect(container.querySelector('.confetti')).toBeInTheDocument();
    expect(container.querySelectorAll('.confetti__piece').length).toBeGreaterThan(0);
  });

  it('renders nothing when reduced motion is preferred', () => {
    mockReducedMotion(true);
    const { container } = render(<Confetti trigger={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});