import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import useAuth from './useAuth';
import { AuthContext } from '../store/AuthProvider';

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within an AuthProvider/);
  });

  it('returns the context value inside a provider', () => {
    const value = { user: { id: 'u1' }, login: () => {} };
    const wrapper = ({ children }) => createElement(AuthContext.Provider, { value }, children);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(value);
  });
});