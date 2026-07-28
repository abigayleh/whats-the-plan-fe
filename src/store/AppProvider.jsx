import {
  useMemo, useState, useEffect, useCallback, useRef,
} from 'react';
import AppContext from './AppContext';
import useAuth from '../hooks/useAuth';
import * as groupsApi from '../api/groups';
import * as listsApi from '../api/lists';
import * as attachmentsApi from '../api/attachments';
import {
  adaptGroup, adaptList, adaptTask, toBeTask,
} from '../api/adapters';
import { socket } from '../socket/socketClient';
import { DEFAULT_PERSONAL_SPACE } from '../mocks/groups';
import { isTaskOnDay } from '../utils/tasks';

// Read-only views over tasks the user can already see, so they're derived here
// rather than fetched — no second source of truth to keep in sync.
const SYSTEM_LISTS = [
  {
    id: 'l-overdue', name: 'Overdue', groupId: null, icon: null, isSystem: true,
  },
  {
    id: 'l-assigned', name: 'Assigned to Me', groupId: null, icon: null, isSystem: true,
  },
  {
    id: 'l-due-today', name: 'Due Today', groupId: null, icon: null, isSystem: true,
  },
];

// An itinerary owns a list, and moving the trip between spaces moves that list with it.
const LIST_EVENTS = [
  'list:created', 'list:updated', 'list:deleted', 'lists:arranged',
  'task:created', 'task:updated', 'task:deleted',
  'itinerary:updated', 'itinerary:deleted',
];

// Groups and lists/tasks are shared app-wide; polls live in usePolls, on the one page that needs them.
function AppProvider({ children }) {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '' });
  const [personalSpace, setPersonalSpace] = useState(DEFAULT_PERSONAL_SPACE);
  const [groups, setGroups] = useState([]);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  // Bumped once whenever a completion empties out today's assigned to-dos, so Confetti
  // (mounted once in AppShell) can react to the change without a dedicated provider.
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (authUser) setCurrentUser({ id: authUser.id, name: authUser.name || authUser.email, email: authUser.email });
  }, [authUser]);

  const refreshGroups = useCallback(async () => {
    try {
      setGroups((await groupsApi.list()).map(adaptGroup));
    } catch {
      // ignore — a failed refresh leaves the last known list in place
    }
  }, []);

  // Load groups on login and keep them fresh on membership/socket changes.
  useEffect(() => {
    if (!authUser) {
      setGroups([]);
      return undefined;
    }
    refreshGroups();
    const onChange = () => refreshGroups();
    socket.on('group:member-joined', onChange);
    socket.on('group:member-left', onChange);
    socket.on('group:deleted', onChange);
    return () => {
      socket.off('group:member-joined', onChange);
      socket.off('group:member-left', onChange);
      socket.off('group:deleted', onChange);
    };
  }, [authUser, refreshGroups]);

  // There's no all-tasks endpoint, so tasks are gathered per visible list. Every mutation
  // refreshes twice (its own await + the socket echo), so results are ticketed to stop a
  // slower earlier refresh from overwriting a newer one.
  const latestRefresh = useRef(0);
  // Safety net so every user always has at least one personal list: if none exists after
  // load, create one client-side. Guarded so a failed create can't retry-loop within the
  // session, and the recursive refresh only ever recurses one level deep (the created
  // list satisfies the check next pass). The backend will also create this on register.
  const defaultListCreated = useRef(false);
  const refreshLists = useCallback(async () => {
    const ticket = latestRefresh.current + 1;
    latestRefresh.current = ticket;
    try {
      const adapted = (await listsApi.list()).map(adaptList);
      if (ticket !== latestRefresh.current) return;
      const hasPersonalList = adapted.some((l) => l.groupId === null && !l.isSystem);
      if (!hasPersonalList && !defaultListCreated.current) {
        defaultListCreated.current = true;
        await listsApi.create({ name: 'My to dos', groupId: null });
        await refreshLists();
        return;
      }
      setLists(adapted);
      const perList = await Promise.all(adapted.map((l) => listsApi.tasks(l.id).catch(() => [])));
      if (ticket !== latestRefresh.current) return;
      setTasks(perList.flat().map(adaptTask));
    } catch {
      // ignore — a failed refresh leaves the last known lists in place
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      setLists([]);
      setTasks([]);
      return undefined;
    }
    refreshLists();
    const onChange = () => refreshLists();
    LIST_EVENTS.forEach((e) => socket.on(e, onChange));
    return () => LIST_EVENTS.forEach((e) => socket.off(e, onChange));
  }, [authUser, refreshLists]);

  // A task's list is the only place its scope lives, so mutations look it up here.
  const listIdOf = useCallback((taskId) => tasks.find((t) => t.id === taskId)?.listId, [tasks]);

  // Confetti fires once when a completion is the LAST of today's assigned incomplete to-dos.
  // Checked against pre-update `tasks` (exactly one task changes per call), so there's no
  // need to diff before/after snapshots once refreshLists() resolves.
  const checkDayComplete = useCallback((task, nextStatus) => {
    if (nextStatus !== 'done' || task.status === 'done') return;
    // "Mine" = assigned to me, or any personal (non-group) to-do — those are always mine.
    const isMine = (t) => t.assignedToId === currentUser.id || t.groupId == null;
    if (!isMine(task) || !isTaskOnDay(task, new Date())) return;
    const others = tasks.some((t) => (
      t.sourceId !== task.sourceId && isMine(t) && t.status !== 'done'
      // A series row's status is the series', not this day's — per-day completion lives on
      // the expanded occurrence, which `tasks` doesn't carry. Counting the row would leave
      // any recurring to-do blocking confetti on every day it recurs, forever.
      && !t.recurrenceRule
      && isTaskOnDay(t, new Date())
    ));
    if (!others) setConfettiKey((k) => k + 1);
  }, [tasks, currentUser]);

  const value = useMemo(() => ({
    currentUser,
    confettiKey,

    personalSpace,
    updatePersonalSpace(patch) {
      setPersonalSpace((prev) => ({ ...prev, ...patch }));
    },

    groups,
    refreshGroups,
    async addGroup({ name, colorKey }) {
      const created = await groupsApi.create(name, colorKey);
      await refreshGroups();
      return adaptGroup(created);
    },
    async joinGroup(code) {
      const joined = await groupsApi.join(code);
      await refreshGroups();
      return joined;
    },
    async updateGroup(groupId, patch) {
      if (patch.name !== undefined) await groupsApi.update(groupId, { name: patch.name });
      if (patch.colorKey !== undefined) await groupsApi.setColor(groupId, patch.colorKey);
      await refreshGroups();
    },
    async setMemberRole(groupId, memberId, role) {
      await groupsApi.setRole(groupId, memberId, role);
      await refreshGroups();
    },
    async removeMember(groupId, memberId) {
      await groupsApi.removeMember(groupId, memberId);
      await refreshGroups();
    },
    async leaveGroup(groupId) {
      try {
        await groupsApi.leave(groupId);
        // Losing access to the group drops its lists (and their tasks) — reload both.
        await Promise.all([refreshGroups(), refreshLists()]);
        return { ok: true };
      } catch (err) {
        if (err.status === 403) return { ok: false, reason: 'LAST_ADMIN' };
        throw err;
      }
    },
    async deleteGroup(groupId) {
      await groupsApi.remove(groupId);
      // Deleting the group cascade-deletes its lists and tasks — reload both.
      await Promise.all([refreshGroups(), refreshLists()]);
    },

    lists: [...lists, ...SYSTEM_LISTS],
    tasks,
    async addList({
      name, groupId, icon, color, showUnscheduledOnCalendar, isDefault,
    }) {
      const created = await listsApi.create({
        name,
        groupId: groupId || null,
        icon: icon || null,
        color: color || null,
        showUnscheduledOnCalendar: showUnscheduledOnCalendar ?? true,
        isDefault: isDefault ?? false,
      });
      await refreshLists();
      return adaptList(created);
    },
    // Scope is immutable, so only name/icon/color/calendar visibility/default are sent.
    async updateList(listId, {
      name, icon, color, showUnscheduledOnCalendar, isDefault,
    }) {
      await listsApi.update(listId, {
        name, icon: icon || null, color: color || null, showUnscheduledOnCalendar, isDefault,
      });
      await refreshLists();
    },
    async deleteList(listId) {
      await listsApi.remove(listId);
      await refreshLists();
    },
    // Reorder is a per-user overlay. Apply the new positions optimistically so the drop
    // feels instant, then persist; the socket echo re-syncs, and any error rolls back.
    async arrangeLists(orderedIds) {
      const snapshot = lists;
      const posById = new Map(orderedIds.map((id, i) => [id, i]));
      setLists((prev) => prev.map((l) => (posById.has(l.id) ? { ...l, position: posById.get(l.id) } : l)));
      try {
        await listsApi.arrange(orderedIds.map((id, i) => ({ listId: id, position: i })));
      } catch {
        setLists(snapshot);
      }
    },
    // A temp-id row renders instantly for a snappy quick-add; refreshLists() below fully
    // replaces `tasks` with server data once the real row exists, so the temp row is dropped
    // automatically (no manual swap/de-dupe). Attachments upload after creation, so a failed
    // upload is reported rather than thrown — throwing here would strand the created task.
    async addTask({ listId, attachments = [], ...fields }) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticTask = adaptTask({
        ...fields, id: tempId, listId, createdById: currentUser.id,
      });
      setTasks((prev) => [...prev, optimisticTask]);
      try {
        const created = await listsApi.createTask(listId, toBeTask(fields));
        let attachmentError = null;
        if (attachments.length) {
          try {
            await attachmentsApi.sync(created.id, attachments, []);
          } catch (err) {
            attachmentError = err.message || 'Attachments failed to upload';
          }
        }
        await refreshLists();
        return { task: adaptTask(created), attachmentError };
      } catch (err) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        throw err;
      }
    },
    async updateTask(taskId, { attachments, ...patch }) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (patch.status) checkDayComplete(task, patch.status);
      try {
        if (Object.keys(patch).length) await listsApi.updateTask(task.listId, taskId, toBeTask(patch));
        if (attachments) await attachmentsApi.sync(taskId, attachments, task.attachments);
      } finally {
        await refreshLists(); // a partial write must not leave stale attachments behind for a retry
      }
    },
    async deleteTask(taskId) {
      const listId = listIdOf(taskId);
      if (!listId) return;
      await listsApi.removeTask(listId, taskId);
      await refreshLists();
    },
    async toggleTaskStatus(taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const nextStatus = task.status === 'done' ? 'todo' : 'done';
      checkDayComplete(task, nextStatus);
      await listsApi.updateTask(task.listId, taskId, { status: nextStatus === 'done' ? 'DONE' : 'TODO' });
      await refreshLists();
    },
    // Marks one day of a recurring series done/undone without touching the series itself.
    // Takes the occurrence, not an id: only it knows this day's status, which the series row
    // doesn't carry — and confetti has to know whether this toggle completes or reopens.
    async toggleTaskOccurrence(occurrence, date) {
      const task = tasks.find((t) => t.id === occurrence.sourceId);
      if (!task || !date) return;
      checkDayComplete(occurrence, occurrence.status === 'done' ? 'todo' : 'done');
      await listsApi.updateTask(task.listId, task.id, { occurrenceDate: new Date(date).toISOString() });
      await refreshLists();
    },

  }), [
    currentUser, personalSpace, groups, lists, tasks, confettiKey,
    refreshGroups, refreshLists, listIdOf, checkDayComplete,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
