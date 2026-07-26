import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import useAppData from './useAppData';
import AppContext from '../store/AppContext';

describe('useAppData', () => {
  it('throws when used outside an AppProvider', () => {
    expect(() => renderHook(() => useAppData())).toThrow(/must be used within an AppProvider/);
  });

  it('returns the context value inside a provider', () => {
    const value = { tasks: [], addTask: () => {} };
    const wrapper = ({ children }) => createElement(AppContext.Provider, { value }, children);
    const { result } = renderHook(() => useAppData(), { wrapper });
    expect(result.current).toBe(value);
  });
});