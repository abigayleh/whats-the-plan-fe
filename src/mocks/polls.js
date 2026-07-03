function inDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export const POLLS = [
  {
    id: 'p1',
    groupId: 'g-roommates',
    question: 'What should we do about the living room rug?',
    expiresAt: inDays(3),
    options: [
      { id: 'p1o1', text: 'Replace it', votes: ['u-jordan', 'u-you'] },
      { id: 'p1o2', text: 'Deep clean it', votes: ['u-priya'] },
      { id: 'p1o3', text: 'Leave it, it\'s fine', votes: [] },
    ],
  },
  {
    id: 'p2',
    groupId: 'g-roommates',
    question: 'Movie night this Friday?',
    expiresAt: null,
    options: [
      { id: 'p2o1', text: 'Yes', votes: ['u-jordan', 'u-priya'] },
      { id: 'p2o2', text: 'No', votes: [] },
    ],
  },
  {
    id: 'p3',
    groupId: 'g-bookclub',
    question: 'Which book should we read next?',
    expiresAt: inDays(5),
    options: [
      { id: 'p3o1', text: 'Circe', votes: ['u-priya', 'u-sam', 'u-you'] },
      { id: 'p3o2', text: 'Project Hail Mary', votes: [] },
      { id: 'p3o3', text: 'The Night Circus', votes: ['u-priya'] },
    ],
  },
  {
    id: 'p4',
    groupId: 'g-bookclub',
    question: 'Best day for our next meetup?',
    expiresAt: inDays(-1),
    options: [
      { id: 'p4o1', text: 'Tuesday', votes: ['u-sam'] },
      { id: 'p4o2', text: 'Thursday', votes: ['u-priya', 'u-you'] },
    ],
  },
  {
    id: 'p5',
    groupId: 'g-trip',
    question: 'Where should we stay in Barcelona?',
    expiresAt: inDays(7),
    options: [
      { id: 'p5o1', text: 'Hostel near the beach', votes: ['u-jordan'] },
      { id: 'p5o2', text: 'Apartment in Gothic Quarter', votes: ['u-sam'] },
    ],
  },
];
