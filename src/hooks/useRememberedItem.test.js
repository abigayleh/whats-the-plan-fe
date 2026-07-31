import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useRememberedItem from './useRememberedItem';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig()),
  useNavigate: () => navigate,
}));

const wrapper = ({ children }) => createElement(MemoryRouter, null, children);

function render(props) {
  return renderHook(() => useRememberedItem({
    storageKey: 'remembered',
    pathPrefix: '/pages',
    currentId: null,
    atRoot: false,
    loading: false,
    items: [],
    ...props,
  }), { wrapper });
}

let matchMediaMatches = false;

describe('useRememberedItem', () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
    matchMediaMatches = false;
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: matchMediaMatches, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
  });

  it('persists the current item id', () => {
    render({ currentId: 'p1' });
    expect(JSON.parse(localStorage.getItem('remembered'))).toBe('p1');
  });

  it('reopens the remembered item at the section root', () => {
    localStorage.setItem('remembered', JSON.stringify('p1'));
    render({ atRoot: true, items: [{ id: 'p1' }] });
    expect(navigate).toHaveBeenCalledWith('/pages/p1', { replace: true });
  });

  it('does not navigate when the remembered item no longer exists', () => {
    localStorage.setItem('remembered', JSON.stringify('gone'));
    render({ atRoot: true, items: [{ id: 'p1' }] });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate while still loading', () => {
    localStorage.setItem('remembered', JSON.stringify('p1'));
    render({ atRoot: true, loading: true, items: [{ id: 'p1' }] });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when not at the section root', () => {
    localStorage.setItem('remembered', JSON.stringify('p1'));
    render({ atRoot: false, items: [{ id: 'p1' }] });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when nothing is remembered', () => {
    render({ atRoot: true, items: [{ id: 'p1' }] });
    expect(navigate).not.toHaveBeenCalled();
  });

  // On a phone the root is the list screen. Reopening the last item there fires the moment
  // the user taps back, trapping them in the detail with no route to the list.
  it('does not reopen the remembered item on a phone', () => {
    matchMediaMatches = true;
    localStorage.setItem('remembered', JSON.stringify('p1'));
    render({ atRoot: true, items: [{ id: 'p1' }] });
    expect(navigate).not.toHaveBeenCalled();
  });
});