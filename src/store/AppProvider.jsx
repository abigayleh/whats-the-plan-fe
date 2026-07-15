import {
  useMemo, useState, useEffect, useCallback,
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
import { POLLS } from '../mocks/polls';

let nextId = 1000;
function generateId(prefix) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

// Read-only views over tasks the user can already see, so they're derived here
// rather than fetched — no second source of truth to keep in sync.
const SYSTEM_LISTS = [
  {
    id: 'l-assigned', name: 'Assigned to Me', groupId: null, icon: null, isSystem: true,
  },
  {
    id: 'l-due-today', name: 'Due Today', groupId: null, icon: null, isSystem: true,
  },
];

const LIST_EVENTS = ['list:created', 'list:updated', 'list:deleted', 'task:created', 'task:updated', 'task:deleted'];

// Groups and lists/tasks are real (API + sockets); polls are still mock until Phase 5.
function AppProvider({ children }) {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '' });
  const [personalSpace, setPersonalSpace] = useState(DEFAULT_PERSONAL_SPACE);
  const [groups, setGroups] = useState([]);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [polls, setPolls] = useState(POLLS);

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

  // There's no all-tasks endpoint, so tasks are gathered per visible list.
  const refreshLists = useCallback(async () => {
    try {
      const adapted = (await listsApi.list()).map(adaptList);
      setLists(adapted);
      const perList = await Promise.all(adapted.map((l) => listsApi.tasks(l.id).catch(() => [])));
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

  const value = useMemo(() => ({
    currentUser,
    updateCurrentUser(patch) {
      setCurrentUser((prev) => ({ ...prev, ...patch }));
    },

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
        await refreshGroups();
        return { ok: true };
      } catch (err) {
        if (err.status === 403) return { ok: false, reason: 'LAST_ADMIN' };
        throw err;
      }
    },
    async deleteGroup(groupId) {
      await groupsApi.remove(groupId);
      await refreshGroups();
    },

    lists: [...lists, ...SYSTEM_LISTS],
    tasks,
    async addList({ name, groupId, icon }) {
      const created = await listsApi.create({ name, groupId: groupId || null, icon: icon || null });
      await refreshLists();
      return adaptList(created);
    },
    // Scope is immutable, so only name and icon are sent.
    async updateList(listId, { name, icon }) {
      await listsApi.update(listId, { name, icon: icon || null });
      await refreshLists();
    },
    async deleteList(listId) {
      await listsApi.remove(listId);
      await refreshLists();
    },
    // Attachments hang off a task, so the task must exist before they can upload. Once it
    // does, a failed upload is reported rather than thrown — throwing would leave the modal
    // open over an already-created task, and saving again would duplicate it.
    async addTask({ listId, attachments = [], ...fields }) {
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
    },
    async updateTask(taskId, { attachments, ...patch }) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
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
      await listsApi.updateTask(task.listId, taskId, { status: task.status === 'done' ? 'TODO' : 'DONE' });
      await refreshLists();
    },

    polls,
    addPoll({
      question, groupId, expiresAt, optionTexts,
    }) {
      const newPoll = {
        id: generateId('p'),
        question,
        groupId,
        expiresAt: expiresAt ?? null,
        options: optionTexts.map((text) => ({ id: generateId('po'), text, votes: [] })),
      };
      setPolls((prev) => [...prev, newPoll]);
      return newPoll;
    },
    vote(pollId, optionId) {
      setPolls((prev) => prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const votedThisOption = poll.options
          .find((option) => option.id === optionId)?.votes.includes(currentUser.id);
        return {
          ...poll,
          options: poll.options.map((option) => {
            const votes = option.votes.filter((userId) => userId !== currentUser.id);
            if (option.id === optionId && !votedThisOption) votes.push(currentUser.id);
            return { ...option, votes };
          }),
        };
      }));
    },
    deletePoll(pollId) {
      setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
    },
  }), [currentUser, personalSpace, groups, lists, tasks, polls, refreshGroups, refreshLists, listIdOf]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
