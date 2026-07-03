export const LISTS = [
  {
    id: 'l-personal', name: 'Personal To-Dos', groupId: null, icon: null, isSystem: false,
  },
  {
    id: 'l-assigned', name: 'Assigned to Me', groupId: null, icon: null, isSystem: true,
  },
  {
    id: 'l-due-today', name: 'Due Today', groupId: null, icon: null, isSystem: true,
  },
  {
    id: 'l-roommates', name: 'Roommates', groupId: 'g-roommates', icon: 'home', isSystem: false,
  },
  {
    id: 'l-bookclub', name: 'Book Club', groupId: 'g-bookclub', icon: null, isSystem: false,
  },
  {
    id: 'l-trip', name: 'Barcelona Trip', groupId: 'g-trip', icon: 'travel', isSystem: false,
  },
];

function dueIn(dayOffset) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function timedIn(dayOffset, hour, minute, durationMinutes) {
  const scheduledStart = new Date();
  scheduledStart.setDate(scheduledStart.getDate() + dayOffset);
  scheduledStart.setHours(hour, minute, 0, 0);
  const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60000);
  return { scheduledStart, scheduledEnd };
}

// Base fields shared by every task/event so mock entries only need to spell out
// what makes them different (title, timing, scope, assignment). Color and icon
// aren't stored here — both are always derived from the task's list/group.
const base = {
  description: '', status: 'todo', dueDate: null, scheduledStart: null, scheduledEnd: null,
  assignedTo: null, subtasks: [], recurrenceRule: null,
};

export const TASKS = [
  {
    ...base,
    id: 'tk1', listId: 'l-personal', groupId: null, title: 'Renew car registration', dueDate: dueIn(1),
  },
  {
    ...base,
    id: 'tk2', listId: 'l-personal', groupId: null, title: 'Call the dentist', dueDate: dueIn(0),
  },
  {
    ...base,
    id: 'tk3', listId: 'l-personal', groupId: null, title: 'Water the plants', status: 'done', dueDate: dueIn(-1),
  },
  {
    ...base,
    id: 'tk4', listId: 'l-personal', groupId: null, title: 'Gym session', ...timedIn(0, 17, 0, 60),
  },
  {
    ...base,
    id: 'tk5', listId: 'l-roommates', groupId: 'g-roommates', title: 'Take out recycling',
    dueDate: dueIn(0), assignedTo: 'Jordan',
  },
  {
    ...base,
    id: 'tk6', listId: 'l-roommates', groupId: 'g-roommates', title: 'Fix leaky faucet',
    description: 'Call the landlord if it keeps dripping.', assignedTo: 'Abigayle', ...timedIn(1, 14, 0, 45),
  },
  {
    ...base,
    id: 'tk7', listId: 'l-bookclub', groupId: 'g-bookclub', title: 'Finish reading Ch. 5',
    dueDate: dueIn(2), assignedTo: 'Abigayle',
  },
  {
    ...base,
    id: 'tk8', listId: 'l-bookclub', groupId: 'g-bookclub', title: 'Pick next book',
    assignedTo: 'Sam', ...timedIn(3, 18, 0, 30),
  },
  {
    ...base,
    id: 'tk9', listId: 'l-trip', groupId: 'g-trip', title: 'Book airport transfer',
    dueDate: dueIn(4), assignedTo: 'Abigayle',
  },
  {
    ...base,
    id: 'tk10', listId: 'l-trip', groupId: 'g-trip', title: 'Confirm hostel reservation',
    status: 'done', dueDate: dueIn(-2), assignedTo: 'Jordan',
  },
  // Timed, no-list items — the calendar-only "events" from before the Event/Task merge.
  // They're plain tasks with a scheduled time and no listId; group scope still applies.
  {
    ...base, id: 'e1', listId: null, groupId: null, title: 'Morning Run', ...timedIn(-1, 7, 0, 45),
  },
  {
    ...base, id: 'e2', listId: null, groupId: 'g-roommates', title: 'Grocery Run', ...timedIn(-1, 17, 30, 60),
  },
  {
    ...base, id: 'e3', listId: null, groupId: 'g-roommates', title: 'Standup', ...timedIn(0, 9, 0, 15),
  },
  {
    ...base, id: 'e4', listId: null, groupId: 'g-bookclub', title: 'Book Club: Chapter 4', ...timedIn(0, 19, 0, 90),
  },
  {
    ...base, id: 'e5', listId: null, groupId: null, title: 'Doctor Appointment', ...timedIn(1, 10, 30, 30),
  },
  {
    ...base, id: 'e6', listId: null, groupId: 'g-trip', title: 'Flight Booking Deadline', ...timedIn(2, 12, 0, 30),
  },
  {
    ...base, id: 'e7', listId: null, groupId: 'g-roommates', title: 'Roommate Meeting', ...timedIn(2, 18, 0, 45),
  },
  {
    ...base, id: 'e8', listId: null, groupId: null, title: 'Yoga Class', ...timedIn(3, 6, 30, 60),
  },
  {
    ...base, id: 'e9', listId: null, groupId: 'g-trip', title: 'Trip Planning Call', ...timedIn(4, 20, 0, 45),
  },
  {
    ...base, id: 'e10', listId: null, groupId: 'g-bookclub', title: 'Pick Next Read', ...timedIn(5, 19, 0, 60),
  },
  {
    ...base, id: 'e11', listId: null, groupId: 'g-trip', title: 'Museum Booking', ...timedIn(6, 11, 0, 90),
  },
  {
    ...base, id: 'e12', listId: null, groupId: null, title: 'Weekly Review', ...timedIn(0, 21, 0, 30),
  },
  {
    ...base, id: 'e13', listId: null, groupId: 'g-roommates', title: 'Roommate Dinner', ...timedIn(7, 19, 30, 90),
  },
  {
    ...base, id: 'e14', listId: null, groupId: 'g-trip', title: 'Pack for Barcelona', ...timedIn(9, 16, 0, 60),
  },
  {
    ...base, id: 'e15', listId: null, groupId: 'g-bookclub', title: 'Book Club Social', ...timedIn(-3, 18, 30, 90),
  },
  {
    ...base, id: 'e16', listId: null, groupId: 'g-roommates', title: 'Laundry Day', ...timedIn(-2, 9, 0, 30),
  },
];
