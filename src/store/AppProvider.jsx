import {
  useMemo, useState, useEffect, useCallback,
} from 'react';
import AppContext from './AppContext';
import useAuth from '../hooks/useAuth';
import * as groupsApi from '../api/groups';
import { socket } from '../socket/socketClient';
import { DEFAULT_PERSONAL_SPACE } from '../mocks/groups';
import { LISTS, TASKS } from '../mocks/tasks';
import { POLLS } from '../mocks/polls';

let nextId = 1000;
function generateId(prefix) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

// Maps a BE group (list shape) to what the UI expects.
const adaptGroup = (g) => ({
  id: g.id,
  name: g.name,
  colorKey: g.color || 'primary',
  memberCount: g.memberCount,
  role: g.role,
});

// Groups are real (API + sockets); lists/tasks/polls are still mock until their phases.
function AppProvider({ children }) {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '' });
  const [personalSpace, setPersonalSpace] = useState(DEFAULT_PERSONAL_SPACE);
  const [groups, setGroups] = useState([]);
  const [lists, setLists] = useState(LISTS);
  const [tasks, setTasks] = useState(TASKS);
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

    lists,
    tasks,
    addList(list) {
      const newList = { icon: null, ...list, id: generateId('l'), isSystem: false };
      setLists((prev) => [...prev, newList]);
      return newList;
    },
    deleteList(listId) {
      setLists((prev) => prev.filter((list) => list.id !== listId));
      setTasks((prev) => prev.filter((task) => task.listId !== listId));
    },
    addTask(task) {
      const newTask = {
        listId: null,
        groupId: null,
        description: '',
        status: 'todo',
        dueDate: null,
        scheduledStart: null,
        scheduledEnd: null,
        assignedTo: null,
        subtasks: [],
        attachments: [],
        recurrenceRule: null,
        ...task,
        id: generateId('tk'),
      };
      setTasks((prev) => [...prev, newTask]);
      return newTask;
    },
    updateTask(taskId, patch) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
    },
    deleteTask(taskId) {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    },
    toggleTaskStatus(taskId) {
      setTasks((prev) => prev.map((task) => (
        task.id === taskId ? { ...task, status: task.status === 'done' ? 'todo' : 'done' } : task
      )));
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
  }), [currentUser, personalSpace, groups, lists, tasks, polls, refreshGroups]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
