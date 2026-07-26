import { describe, it, expect } from 'vitest';
import {
  toBeStatus,
  adaptGroup,
  adaptList,
  adaptAttachment,
  adaptItem,
  adaptTask,
  adaptCalendarTask,
  adaptEvent,
  adaptPoll,
  adaptItinerary,
  adaptPage,
  toBeItem,
  toBeTask,
} from './adapters';

describe('toBeStatus', () => {
  it('maps FE statuses to BE enums', () => {
    expect(toBeStatus('todo')).toBe('TODO');
    expect(toBeStatus('in-progress')).toBe('IN_PROGRESS');
    expect(toBeStatus('done')).toBe('DONE');
  });

  it('defaults unknown statuses to TODO', () => {
    expect(toBeStatus('whatever')).toBe('TODO');
    expect(toBeStatus(undefined)).toBe('TODO');
  });
});

describe('adaptGroup', () => {
  it('maps fields and defaults color to primary', () => {
    expect(adaptGroup({ id: 'g1', name: 'Trip', memberCount: 3, role: 'ADMIN' })).toEqual({
      id: 'g1', name: 'Trip', colorKey: 'primary', memberCount: 3, role: 'ADMIN',
    });
  });

  it('uses the provided color as colorKey', () => {
    expect(adaptGroup({ id: 'g1', color: 'blue' }).colorKey).toBe('blue');
  });
});

describe('adaptList', () => {
  it('applies defaults for optional fields', () => {
    const out = adaptList({ id: 'l1', name: 'Groceries', groupId: null, ownerId: 'u1', icon: null, isSystem: false, taskCount: 0 });
    expect(out.color).toBeNull();
    expect(out.showUnscheduledOnCalendar).toBe(true);
    expect(out.isDefault).toBe(false);
    expect(out.position).toBeNull();
  });

  it('preserves explicit false for showUnscheduledOnCalendar', () => {
    expect(adaptList({ id: 'l1', showUnscheduledOnCalendar: false }).showUnscheduledOnCalendar).toBe(false);
  });

  it('passes through a set position and color', () => {
    const out = adaptList({ id: 'l1', position: 4, color: 'red' });
    expect(out.position).toBe(4);
    expect(out.color).toBe('red');
  });
});

describe('adaptAttachment', () => {
  it('renames filename to name and flags it existing', () => {
    const out = adaptAttachment({ id: 'a1', filename: 'photo.png', mimeType: 'image/png', sizeBytes: 100 });
    expect(out).toEqual({
      id: 'a1', name: 'photo.png', mimeType: 'image/png', sizeBytes: 100, existing: true, previewUrl: null,
    });
  });
});

describe('adaptItem (task origin)', () => {
  const raw = {
    id: 't1', title: 'Buy milk', status: 'IN_PROGRESS', listId: 'l1', groupId: 'g1',
    dueDate: '2026-07-15T00:00:00.000Z', assignedToId: 'u2', assignee: { name: 'Sam' },
    attachments: [{ id: 'a1', filename: 'f.pdf', mimeType: 'application/pdf', sizeBytes: 1 }],
    location: 'Store',
  };

  it('lowercases status and keeps task-only fields', () => {
    const out = adaptItem(raw, 'task');
    expect(out.origin).toBe('task');
    expect(out.status).toBe('in-progress');
    expect(out.id).toBe('t1');
    expect(out.sourceId).toBe('t1');
    expect(out.listId).toBe('l1');
    expect(out.assignedTo).toBe('Sam');
    expect(out.assignedToId).toBe('u2');
    expect(out.location).toBe('Store');
  });

  it('parses dueDate to a Date', () => {
    expect(adaptItem(raw, 'task').dueDate).toBeInstanceOf(Date);
  });

  it('adapts attachments', () => {
    expect(adaptItem(raw, 'task').attachments[0].existing).toBe(true);
  });

  it('defaults description to empty string and groupId to null', () => {
    const out = adaptItem({ id: 't2', title: 'x' }, 'task');
    expect(out.description).toBe('');
    expect(out.groupId).toBeNull();
    expect(out.status).toBe('todo');
  });
});

describe('adaptItem (event origin)', () => {
  const raw = {
    id: 'e1', title: 'Meeting', status: 'DONE', listId: 'l1', assignedToId: 'u2',
    startAt: '2026-07-15T10:00:00.000Z', endAt: '2026-07-15T11:00:00.000Z',
    location: 'HQ', attachments: [{ id: 'a', filename: 'f', mimeType: 'x', sizeBytes: 1 }],
  };

  it('forces completion/assignment fields empty and ignores list', () => {
    const out = adaptItem(raw, 'event');
    expect(out.status).toBe('todo');
    expect(out.listId).toBeNull();
    expect(out.dueDate).toBeNull();
    expect(out.assignedToId).toBeNull();
    expect(out.assignedTo).toBeNull();
    expect(out.attachments).toEqual([]);
    expect(out.location).toBeNull();
  });

  it('maps startAt/endAt to scheduledStart/scheduledEnd', () => {
    const out = adaptItem(raw, 'event');
    expect(out.scheduledStart.getTime()).toBe(new Date(raw.startAt).getTime());
    expect(out.scheduledEnd.getTime()).toBe(new Date(raw.endAt).getTime());
  });
});

describe('adaptTask', () => {
  it('is adaptItem with the task origin', () => {
    expect(adaptTask({ id: 't', title: 'x' }).origin).toBe('task');
  });
});

describe('adaptCalendarTask / adaptEvent (occurrences)', () => {
  it('adaptEvent keys id off instanceId while sourceId stays the row id', () => {
    const out = adaptEvent({
      id: 'e1', instanceId: 'e1@2026-07-01', title: 'Standup', isRecurring: true,
      startAt: '2026-07-01T09:00:00.000Z', endAt: '2026-07-01T09:15:00.000Z',
      recurrenceRule: { frequency: 'daily' },
    });
    expect(out.id).toBe('event-e1@2026-07-01');
    expect(out.sourceId).toBe('e1');
    expect(out.isRecurring).toBe(true);
  });

  it('nulls recurrenceRule and stashes the series in rule', () => {
    const rule = { frequency: 'weekly' };
    const out = adaptEvent({ id: 'e1', instanceId: 'i', recurrenceRule: rule });
    expect(out.recurrenceRule).toBeNull();
    expect(out.rule).toBe(rule);
  });

  it('adaptCalendarTask prefixes with task- and lowercases status', () => {
    const out = adaptCalendarTask({
      id: 't1', instanceId: 'inst', status: 'DONE',
      scheduledStart: '2026-07-01T09:00:00.000Z', scheduledEnd: '2026-07-01T10:00:00.000Z',
    });
    expect(out.id).toBe('task-inst');
    expect(out.sourceId).toBe('t1');
    expect(out.status).toBe('done');
  });
});

describe('adaptPoll', () => {
  it('maps fields and parses timestamps in full', () => {
    const out = adaptPoll({
      id: 'p1', groupId: 'g1', question: 'Lunch?', options: [{ id: 'o', text: 'Pizza', voteCount: 2 }],
      totalVotes: 2, myVote: 'o', createdById: 'u1',
      expiresAt: '2026-07-30T18:30:00.000Z', createdAt: '2026-07-25T12:00:00.000Z',
    });
    expect(out.options).toHaveLength(1);
    expect(out.myVote).toBe('o');
    expect(out.expiresAt.getTime()).toBe(new Date('2026-07-30T18:30:00.000Z').getTime());
    expect(out.createdAt.getTime()).toBe(new Date('2026-07-25T12:00:00.000Z').getTime());
  });

  it('maps a null expiry to null', () => {
    expect(adaptPoll({ id: 'p', expiresAt: null }).expiresAt).toBeNull();
  });
});

// Smoke test for the framework + a regression guard for the itinerary date-only bug:
// date-only fields are stored at UTC midnight and must render on the same calendar day.
describe('adaptItinerary', () => {
  it('parses date-only start/end as the same local calendar day (no UTC drift)', () => {
    const out = adaptItinerary({
      id: 'i1', startDate: '2026-07-25T00:00:00.000Z', endDate: '2026-07-30T00:00:00.000Z',
    });
    expect([out.startDate.getFullYear(), out.startDate.getMonth(), out.startDate.getDate()])
      .toEqual([2026, 6, 25]);
    expect(out.endDate.getDate()).toBe(30);
  });

  it('maps null dates to null', () => {
    const out = adaptItinerary({ id: 'i2', startDate: null, endDate: null });
    expect(out.startDate).toBeNull();
    expect(out.endDate).toBeNull();
  });

  it('parses completedAt/createdAt as full timestamps and defaults optionals to null', () => {
    const out = adaptItinerary({
      id: 'i3', createdById: 'u1', completedAt: '2026-07-20T08:00:00.000Z', createdAt: '2026-07-01T00:00:00.000Z',
    });
    expect(out.destination).toBeNull();
    expect(out.description).toBeNull();
    expect(out.completedAt.getTime()).toBe(new Date('2026-07-20T08:00:00.000Z').getTime());
    expect(out.completedAt).toBeInstanceOf(Date);
  });

  it('treats a null completedAt as active', () => {
    expect(adaptItinerary({ id: 'i4', completedAt: null }).completedAt).toBeNull();
  });
});

describe('adaptPage', () => {
  it('applies tree defaults', () => {
    const out = adaptPage({ id: 'pg1', title: 'Notes', ownerId: 'u1', createdById: 'u1' });
    expect(out.parentId).toBeNull();
    expect(out.position).toBe(0);
    expect(out.hasContent).toBe(false);
    expect(out.icon).toBeNull();
  });

  it('parses createdAt/updatedAt to Dates', () => {
    const out = adaptPage({ id: 'pg1', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-02T00:00:00.000Z' });
    expect(out.createdAt).toBeInstanceOf(Date);
    expect(out.updatedAt).toBeInstanceOf(Date);
  });
});

describe('toBeItem (event origin)', () => {
  it('maps only present keys and converts schedule to ISO startAt/endAt', () => {
    const start = new Date(2026, 6, 1, 10, 0);
    const body = toBeItem({ title: 'Sync', scheduledStart: start }, 'event');
    expect(body.title).toBe('Sync');
    expect(new Date(body.startAt).getTime()).toBe(start.getTime());
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('endAt');
  });

  it('maps a null schedule to null', () => {
    expect(toBeItem({ scheduledEnd: null }, 'event').endAt).toBeNull();
  });
});

describe('toBeItem (task origin)', () => {
  it('maps status through toBeStatus and dates to ISO', () => {
    const due = new Date(2026, 6, 15, 9, 0);
    const body = toBeItem({ status: 'done', dueDate: due, title: 'x' }, 'task');
    expect(body.status).toBe('DONE');
    expect(new Date(body.dueDate).getTime()).toBe(due.getTime());
    expect(body.title).toBe('x');
  });

  it('stays partial — omits keys not present in the patch', () => {
    const body = toBeItem({ title: 'only' }, 'task');
    expect(body).toEqual({ title: 'only' });
  });

  it('maps a cleared dueDate to null', () => {
    expect(toBeItem({ dueDate: null }, 'task').dueDate).toBeNull();
  });
});

describe('toBeTask', () => {
  it('is toBeItem with the task origin', () => {
    expect(toBeTask({ status: 'todo' }).status).toBe('TODO');
  });
});