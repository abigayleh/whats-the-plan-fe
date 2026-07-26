import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import HighlightText from './HighlightText';

const marks = (container) => [...container.querySelectorAll('mark')].map((m) => m.textContent);

describe('HighlightText', () => {
  it('renders plain text when there is no query', () => {
    const { container } = render(<HighlightText text="Budget" query="" />);
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(marks(container)).toEqual([]);
  });

  it('marks the matching run, preserving the original casing', () => {
    const { container } = render(<HighlightText text="Barcelona Trip" query="celo" />);
    expect(marks(container)).toEqual(['celo']);
  });

  it('marks every occurrence', () => {
    const { container } = render(<HighlightText text="aXaXa" query="a" />);
    expect(marks(container)).toEqual(['a', 'a', 'a']);
  });

  // A query like "c++" or "a.b" must be treated as literal text, not as a pattern.
  it('treats regex metacharacters literally', () => {
    const { container } = render(<HighlightText text="Notes on c++ and c-plus" query="c++" />);
    expect(marks(container)).toEqual(['c++']);
  });

  it('handles a match at the very start and end', () => {
    const { container } = render(<HighlightText text="abc" query="abc" />);
    expect(marks(container)).toEqual(['abc']);
  });

  it('renders nothing troublesome for empty text', () => {
    const { container } = render(<HighlightText text="" query="x" />);
    expect(marks(container)).toEqual([]);
  });
});