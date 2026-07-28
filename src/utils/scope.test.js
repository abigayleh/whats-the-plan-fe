import { describe, it, expect } from 'vitest';
import { scopeOptions } from './scope';

describe('scopeOptions', () => {
  it('puts the personal space first with a null value', () => {
    const options = scopeOptions({ name: 'Personal' }, [{ id: 'g1', name: 'Crew' }]);
    expect(options).toEqual([
      { value: null, label: 'Personal' },
      { value: 'g1', label: 'Crew' },
    ]);
  });

  it('handles a user with no groups', () => {
    expect(scopeOptions({ name: 'Me' }, [])).toEqual([{ value: null, label: 'Me' }]);
  });
});
