import { useMemo, useState } from 'react';
import AppContext from './AppContext';
import { GROUPS, CURRENT_USER, DEFAULT_PERSONAL_SPACE } from '../mocks/groups';
import { LISTS, TASKS } from '../mocks/tasks';
import { POLLS } from '../mocks/polls';

let nextId = 1000;
function generateId(prefix) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Single mock data store for the whole app (groups, lists/tasks, polls) — this is a
// pre-backend prototype, so one store keeps related mutations (e.g. deleting a group
// also drops its lists) in one place instead of coordinating several contexts.
function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);
  const [personalSpace, setPersonalSpace] = useState(DEFAULT_PERSONAL_SPACE);
  const [groups, setGroups] = useState(GROUPS);
  const [lists, setLists] = useState(LISTS);
  const [tasks, setTasks] = useState(TASKS);
  const [polls, setPolls] = useState(POLLS);

  const value = useMemo(() => ({
    currentUser,
    updateCurrentUser(patch) {
      setCurrentUser((prev) => {
        const renamed = patch.name && patch.name !== prev.name;
        if (renamed) {
          setGroups((gs) => gs.map((g) => ({
            ...g,
            members: g.members.map((m) => (m.id === prev.id ? { ...m, name: patch.name } : m)),
          })));
          setTasks((ts) => ts.map((t) => (t.assignedTo === prev.name ? { ...t, assignedTo: patch.name } : t)));
        }
        return { ...prev, ...patch };
      });
    },

    personalSpace,
    updatePersonalSpace(patch) {
      setPersonalSpace((prev) => ({ ...prev, ...patch }));
    },

    groups,
    updateGroup(groupId, patch) {
      setGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, ...patch } : group)));
    },
    addGroup({ name, colorKey }) {
      const newGroup = {
        id: generateId('g'),
        name,
        colorKey,
        inviteCode: generateInviteCode(),
        members: [{ ...currentUser, role: 'ADMIN' }],
      };
      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    },
    regenerateInvite(groupId) {
      setGroups((prev) => prev.map((group) => (
        group.id === groupId ? { ...group, inviteCode: generateInviteCode() } : group
      )));
    },
    setMemberRole(groupId, memberId, role) {
      setGroups((prev) => prev.map((group) => (group.id !== groupId ? group : {
        ...group,
        members: group.members.map((member) => (member.id === memberId ? { ...member, role } : member)),
      })));
    },
    removeMember(groupId, memberId) {
      setGroups((prev) => prev.map((group) => (group.id !== groupId ? group : {
        ...group,
        members: group.members.filter((member) => member.id !== memberId),
      })));
    },
    leaveGroup(groupId) {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return { ok: false, reason: 'NOT_FOUND' };

      const admins = group.members.filter((member) => member.role === 'ADMIN');
      const isSoleAdmin = admins.length === 1 && admins[0].id === currentUser.id;
      if (isSoleAdmin) return { ok: false, reason: 'LAST_ADMIN' };

      setGroups((prev) => prev.map((g) => (g.id !== groupId ? g : {
        ...g,
        members: g.members.filter((member) => member.id !== currentUser.id),
      })));
      return { ok: true };
    },
    deleteGroup(groupId) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      setLists((prev) => prev.filter((list) => list.groupId !== groupId));
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
  }), [currentUser, personalSpace, groups, lists, tasks, polls]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export default AppProvider;
