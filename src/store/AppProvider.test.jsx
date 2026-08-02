import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useContext } from 'react';
import { render, waitFor, act } from '../test/utils';
import AppProvider from './AppProvider';
import AppContext from './AppContext';
import * as listsApi from '../api/lists';

// Must be a stable reference: the provider keys effects off the auth user, so a fresh
// object each render re-runs them forever.
const AUTH = { user: { id: 'u1', name: 'Ada', email: 'ada@example.com' } };

vi.mock('../api/lists', () => ({
  list: vi.fn(),
  tasks: vi.fn(),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
  arrange: vi.fn().mockResolvedValue({}),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  removeTask: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/groups', () => ({ list: vi.fn().mockResolvedValue([]) }));
vi.mock('../api/attachments', () => ({ sync: vi.fn().mockResolvedValue() }));
vi.mock('../hooks/useAuth', () => ({ default: () => AUTH }));
vi.mock('../hooks/useSocketEvents', () => ({ default: () => {} }));

const list = {
  id: 'l1', name: 'My to dos', groupId: null, isSystem: false,
};
const dated = (d) => new Date(2026, 7, d).toISOString();

async function mountStore(tasks) {
  vi.mocked(listsApi.tasks).mockResolvedValue(tasks);
  const seen = {};
  function Probe() {
    seen.ctx = useContext(AppContext);
    return null;
  }
  render(<AppProvider><Probe /></AppProvider>);
  await waitFor(() => expect(seen.ctx.tasks).toHaveLength(tasks.length));
  return seen;
}

const todo = {
  id: 't1', listId: 'l1', title: 'Book flights', status: 'TODO', dueDate: dated(14),
};

describe('AppProvider task writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listsApi.list).mockResolvedValue([list]);
    vi.mocked(listsApi.updateTask).mockResolvedValue({});
    vi.mocked(listsApi.createTask).mockResolvedValue({ ...todo, id: 't9' });
  });

  // Both of these went unnoticed because the write threw before reaching the API: the
  // day-complete check was handed the status string instead of the day.
  it('saves a title edit', async () => {
    const store = await mountStore([todo]);
    await act(async () => { await store.ctx.updateTask('t1', { title: 'Book flights early' }); });
    expect(listsApi.updateTask).toHaveBeenCalledWith('l1', 't1', { title: 'Book flights early' });
  });

  it('saves a completion', async () => {
    const store = await mountStore([todo]);
    await act(async () => { await store.ctx.updateTask('t1', { status: 'done' }); });
    expect(listsApi.updateTask).toHaveBeenCalledWith('l1', 't1', { status: 'DONE' });
  });

  it('saves a repeat rule', async () => {
    const store = await mountStore([todo]);
    const recurrenceRule = { frequency: 'weekly', interval: 1, daysOfWeek: [5] };
    await act(async () => {
      await store.ctx.updateTask('t1', { status: 'todo', recurrenceRule });
    });
    expect(listsApi.updateTask).toHaveBeenCalledWith('l1', 't1', { status: 'TODO', recurrenceRule });
  });

  it('saves a to-do that has no date', async () => {
    const store = await mountStore([{ ...todo, dueDate: null }]);
    await act(async () => {
      await store.ctx.updateTask('t1', { status: 'todo', dueDate: null, scheduledStart: null });
    });
    expect(listsApi.updateTask).toHaveBeenCalledWith(
      'l1', 't1', { status: 'TODO', dueDate: null, scheduledStart: null },
    );
  });

  it('creates a to-do', async () => {
    const store = await mountStore([todo]);
    await act(async () => { await store.ctx.addTask({ listId: 'l1', title: 'New one', status: 'todo' }); });
    expect(listsApi.createTask).toHaveBeenCalled();
  });

  it('ticks one day of a repeating to-do without completing the series', async () => {
    const series = {
      ...todo, id: 't2', recurrenceRule: { frequency: 'daily', interval: 1 }, completedDates: [],
    };
    const store = await mountStore([series]);
    await act(async () => { await store.ctx.toggleTask('t2', new Date(2026, 7, 14)); });
    const [, , body] = vi.mocked(listsApi.updateTask).mock.calls[0];
    // A series is ticked per day, never flipped as a whole.
    expect(body).toHaveProperty('occurrenceDate');
    expect(body).not.toHaveProperty('status');
  });
});