export const CURRENT_USER = {
  id: 'u-you', name: 'Abigayle', email: 'abigayle@openscreen.com', password: 'password123',
};

// Seed for the user's personal space — not a real Group record, but user-editable
// (name + color) just like one, so it's kept in AppProvider state rather than static.
export const DEFAULT_PERSONAL_SPACE = { name: 'Personal', colorKey: 'primary' };

export const GROUPS = [
  {
    id: 'g-roommates',
    name: 'Roommates',
    colorKey: 'teal',
    inviteCode: 'ROOM-4F2K',
    members: [
      { id: 'u-you', name: 'Abigayle', role: 'ADMIN' },
      { id: 'u-jordan', name: 'Jordan', role: 'MEMBER' },
      { id: 'u-priya', name: 'Priya', role: 'MEMBER' },
    ],
  },
  {
    id: 'g-bookclub',
    name: 'Book Club',
    colorKey: 'amber',
    inviteCode: 'BOOK-9XZ1',
    members: [
      { id: 'u-you', name: 'Abigayle', role: 'ADMIN' },
      { id: 'u-priya', name: 'Priya', role: 'ADMIN' },
      { id: 'u-sam', name: 'Sam', role: 'MEMBER' },
    ],
  },
  {
    id: 'g-trip',
    name: 'Barcelona Trip',
    colorKey: 'blue',
    inviteCode: 'TRIP-7QWE',
    members: [
      { id: 'u-you', name: 'Abigayle', role: 'ADMIN' },
      { id: 'u-jordan', name: 'Jordan', role: 'MEMBER' },
      { id: 'u-sam', name: 'Sam', role: 'MEMBER' },
    ],
  },
];
