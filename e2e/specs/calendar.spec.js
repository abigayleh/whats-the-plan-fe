import { test, expect } from '../fixtures/index.js';

const today = () => new Date().toISOString().slice(0, 10);

test.describe('views and navigation', () => {
  test('the three views can be switched between', async ({ page, user }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Week', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Both', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Day', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Both', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Month', exact: true }).click();
    await expect(page.getByRole('button', { name: '+ Add to-do' })).toHaveCount(0);
    expect(user.id).toBeTruthy();
  });

  test('previous and next move the period, and Today returns', async ({ page, user }) => {
    await page.goto('/');
    const label = page.locator('.calendar-view__period, .calendar-toolbar__label').first();
    const start = await label.innerText();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(label).not.toHaveText(start);

    await page.getByRole('button', { name: 'Today' }).click();
    await expect(label).toHaveText(start);
    expect(user.id).toBeTruthy();
  });

  test('the day view reports an empty day', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Day', exact: true }).click();

    await expect(page.getByText('Nothing scheduled today.')).toBeVisible();
    await expect(page.getByText('Nothing due today.')).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});

// Month view draws items as unlabelled coloured dots, so anything asserting on an item's
// title has to be in day or week view first.
const dayView = async (page) => {
  await page.getByRole('button', { name: 'Day', exact: true }).click();
};

test.describe('creating', () => {
  test('the floating button creates a calendar event', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add event' }).click();

    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    await page.getByLabel('Title').fill('Dentist');
    await page.getByRole('button', { name: 'Done' }).click();

    await dayView(page);
    await expect(page.getByText('Dentist')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the floating button creates a to-do', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add to-do', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'New Task' })).toBeVisible();
    await page.getByLabel('Title').fill('Water the plants');
    await page.getByRole('button', { name: 'Done' }).click();

    await dayView(page);
    await expect(page.getByText('Water the plants')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('an existing to-do opens for editing', async ({ page, user }) => {
    const list = await user.createList('Calendar Source');
    await user.createTask(list.id, { title: 'Existing todo', dueDate: today() });
    await page.goto('/');
    await dayView(page);

    await page.getByText('Existing todo').first().click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Existing todo');
  });
});

test.describe('filters', () => {
  test('group chips hide and show a group\'s items', async ({ page, user }) => {
    const group = await user.createGroup('Work');
    const list = await user.createList('Work List', group.id);
    await user.createTask(list.id, { title: 'Standup', dueDate: today() });
    await page.goto('/');
    await dayView(page);

    await expect(page.getByText('Standup')).toBeVisible();
    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await expect(page.getByText('Standup')).toBeHidden();

    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await expect(page.getByText('Standup')).toBeVisible();
  });

  test('completed items can be hidden', async ({ page, user }) => {
    const list = await user.createList('Done Things');
    await user.createTask(list.id, { title: 'Already done', dueDate: today(), status: 'DONE' });
    await page.goto('/');
    await dayView(page);

    await expect(page.getByText('Already done')).toBeVisible();
    await page.getByRole('button', { name: 'Hide completed' }).click();
    await expect(page.getByText('Already done')).toBeHidden();
  });

  // The toggle is disabled only when the view isn't Day *and* the content filter isn't "Both".
  test('the unscheduled toggle is disabled only when it cannot apply', async ({ page, user }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Show unscheduled to-dos' });
    await expect(toggle).toBeEnabled();

    await page.getByRole('button', { name: 'Week', exact: true }).click();
    await page.getByRole('button', { name: 'Calendar', exact: true }).click();
    await expect(toggle).toBeDisabled();

    await page.getByRole('button', { name: 'Day', exact: true }).click();
    await expect(toggle).toBeEnabled();
    expect(user.id).toBeTruthy();
  });

  test('week view can show only todos', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Week', exact: true }).click();
    await page.getByRole('button', { name: 'Todos', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Show unscheduled to-dos' })).toBeDisabled();
    expect(user.id).toBeTruthy();
  });
});

test.describe('task chips', () => {
  test('a to-do can be completed from the calendar', async ({ page, user }) => {
    const list = await user.createList('Chippy');
    await user.createTask(list.id, { title: 'Tick me', dueDate: today() });
    await page.goto('/');
    await dayView(page);

    // An undated-time to-do lands in the day panel as a TaskRow, whose control is a checkbox.
    const box = page.getByRole('checkbox').first();
    await box.click();
    await expect(box).toHaveAttribute('aria-checked', 'true');
  });

  test('push to tomorrow clears the day', async ({ page, user }) => {
    const list = await user.createList('Pushy');
    await user.createTask(list.id, { title: 'Move me', dueDate: today() });
    await page.goto('/');
    await page.getByRole('button', { name: 'Day', exact: true }).click();
    await expect(page.getByText('Move me')).toBeVisible();

    await page.getByRole('button', { name: 'Push to tomorrow', exact: true }).first().click();
    await expect(page.getByText('Move me')).toBeHidden();
  });
});
