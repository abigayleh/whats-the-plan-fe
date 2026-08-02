import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  render, screen, waitFor, userEvent, within,
} from '../test/utils';
import AppProvider from '../store/AppProvider';
import CalendarPage from './CalendarPage';
import * as listsApi from '../api/lists';
import * as tasksApi from '../api/tasks';

// Only the network is faked. The real AppProvider, usePlanItems, useCalendarItems, the
// adapters and PlanItemModal all run — which is the layer where editing a to-do broke while
// every page test stayed green.
const AUTH = { user: { id: 'u1', name: 'Ada', email: 'ada@example.com' } };

vi.mock('../api/lists', () => ({
  list: vi.fn(),
  tasks: vi.fn(),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
  arrange: vi.fn().mockResolvedValue({}),
  createTask: vi.fn().mockResolvedValue({}),
  updateTask: vi.fn(),
  removeTask: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/tasks', () => ({ calendar: vi.fn() }));
vi.mock('../api/events', () => ({
  list: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
}));
vi.mock('../api/groups', () => ({ list: vi.fn().mockResolvedValue([]) }));
vi.mock('../api/attachments', () => ({ sync: vi.fn().mockResolvedValue() }));
vi.mock('../hooks/useAuth', () => ({ default: () => AUTH }));
vi.mock('../hooks/useSocketEvents', () => ({ default: () => {} }));
vi.mock('../socket/socketClient', () => ({ socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn() } }));
vi.mock('../components/items/LocationSearch', () => ({ default: () => null }));

const list = {
  id: 'l1', name: 'My to dos', groupId: null, isSystem: false,
};

// Due today so it lands on the day view without any navigation.
const today = new Date();
const todo = {
  id: 't1',
  listId: 'l1',
  title: 'Water plants',
  status: 'TODO',
  dueDate: today.toISOString(),
};

function renderCalendar() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <CalendarPage />
      </AppProvider>
    </MemoryRouter>,
  );
}

// Opens the to-do's editor from the day view, the way a tap on the row does.
async function openTodoEditor(user) {
  renderCalendar();
  await user.click(await screen.findByRole('button', { name: 'Day' }));
  await user.click(await screen.findByText('Water plants'));
  return screen.findByRole('heading', { name: 'Edit Task' });
}

describe('editing a to-do from the calendar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(listsApi.list).mockResolvedValue([list]);
    vi.mocked(listsApi.tasks).mockResolvedValue([todo]);
    vi.mocked(listsApi.updateTask).mockResolvedValue({});
    vi.mocked(tasksApi.calendar).mockResolvedValue([{ ...todo, instanceId: 't1' }]);
  });

  it('shows the to-do on the day view', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(await screen.findByRole('button', { name: 'Day' }));
    expect(await screen.findByText('Water plants')).toBeInTheDocument();
  });

  it('persists a renamed to-do', async () => {
    const user = userEvent.setup();
    await openTodoEditor(user);

    const title = screen.getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'Water the plants');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(listsApi.updateTask).toHaveBeenCalled());
    const [listId, taskId, body] = vi.mocked(listsApi.updateTask).mock.calls.at(-1);
    expect([listId, taskId]).toEqual(['l1', 't1']);
    expect(body.title).toBe('Water the plants');
  });

  // The bug that shipped: every to-do payload carries a status, so the write threw before
  // reaching the API and the repeat was silently dropped.
  it('persists a repeat rule', async () => {
    const user = userEvent.setup();
    await openTodoEditor(user);

    await user.selectOptions(screen.getByLabelText('Repeat'), 'weekly');

    await waitFor(() => expect(listsApi.updateTask).toHaveBeenCalled());
    const body = vi.mocked(listsApi.updateTask).mock.calls.at(-1)[2];
    expect(body.recurrenceRule).toMatchObject({ frequency: 'weekly', interval: 1 });
  });

  it('persists a completion', async () => {
    const user = userEvent.setup();
    await openTodoEditor(user);

    await user.click(screen.getByRole('checkbox', { name: 'Mark as complete' }));

    await waitFor(() => expect(listsApi.updateTask).toHaveBeenCalled());
    const body = vi.mocked(listsApi.updateTask).mock.calls.at(-1)[2];
    expect(body.status).toBe('DONE');
  });

  it('persists a to-do that has no date', async () => {
    const user = userEvent.setup();
    await openTodoEditor(user);

    const date = screen.getByLabelText('Complete by');
    await user.clear(date);
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(listsApi.updateTask).toHaveBeenCalled());
    const body = vi.mocked(listsApi.updateTask).mock.calls.at(-1)[2];
    expect(body.dueDate).toBeNull();
  });
});

describe('the day view to-do list', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(listsApi.list).mockResolvedValue([list]);
    vi.mocked(listsApi.tasks).mockResolvedValue([todo]);
    vi.mocked(listsApi.updateTask).mockResolvedValue({});
    vi.mocked(tasksApi.calendar).mockResolvedValue([{ ...todo, instanceId: 't1' }]);
  });

  it('ticks a to-do off directly from its row', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(await screen.findByRole('button', { name: 'Day' }));

    const row = (await screen.findByText('Water plants')).closest('.task-row');
    await user.click(within(row).getByRole('checkbox'));

    await waitFor(() => expect(listsApi.updateTask).toHaveBeenCalled());
    expect(vi.mocked(listsApi.updateTask).mock.calls.at(-1)[2]).toEqual({ status: 'DONE' });
  });
});