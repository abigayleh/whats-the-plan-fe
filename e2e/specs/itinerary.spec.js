import { test, expect } from '../fixtures/index.js';

const plusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

test.describe('creating', () => {
  test('a dated trip is created and opened', async ({ page, user }) => {
    await page.goto('/itinerary');
    await page.getByRole('button', { name: 'New itinerary' }).click();

    await page.getByLabel('Title').fill('Barcelona');
    await page.getByLabel('Start date').fill(plusDays(7));
    await page.getByLabel('End date').fill(plusDays(10));
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/itinerary\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('button', { name: 'Plan', exact: true })).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('an unscheduled trip records a day count', async ({ page, user }) => {
    await page.goto('/itinerary');
    await page.getByRole('button', { name: 'New itinerary' }).click();

    await page.getByLabel('Title').fill('Someday Trip');
    await page.getByRole('button', { name: 'Not scheduled yet' }).click();
    await page.getByLabel('Expected length (days)').fill('5');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(/Not scheduled · 5 days/)).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  // The End date input carries min={startDate}, so the browser refuses the submit before the
  // component's own "End date must be on or after the start date" check can ever run. This
  // asserts what actually happens: nothing is created and the modal stays put.
  test('an end date before the start date cannot be submitted', async ({ page, user }) => {
    await page.goto('/itinerary');
    await page.getByRole('button', { name: 'New itinerary' }).click();

    await page.getByLabel('Title').fill('Backwards');
    await page.getByLabel('Start date').fill(plusDays(10));
    await page.getByLabel('End date').fill(plusDays(3));
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page).toHaveURL(/\/itinerary$/);
    expect(user.id).toBeTruthy();
  });
});

test.describe('the sidebar', () => {
  test('the empty state invites you to plan one', async ({ page, user }) => {
    await page.goto('/itinerary');
    await expect(page.getByText('Select an itinerary, or plan a new one.')).toBeVisible();
    await expect(page.getByText('No trips yet')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the sidebar collapses and reopens', async ({ page, user }) => {
    await page.goto('/itinerary');
    await page.getByRole('button', { name: 'Hide itineraries' }).click();

    await expect(page.getByRole('button', { name: 'Show itineraries' })).toBeVisible();
    await page.getByRole('button', { name: 'Show itineraries' }).click();
    await expect(page.getByRole('button', { name: 'New itinerary' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a trip can be completed and restored', async ({ page, user }) => {
    await user.createItinerary({ title: 'Round Trip', startDate: plusDays(2), endDate: plusDays(4) });
    await page.goto('/itinerary');

    await page.getByRole('button', { name: 'Mark itinerary completed' }).click();
    await expect(page.getByRole('button', { name: 'Restore itinerary' })).toBeVisible();

    await page.getByRole('button', { name: 'Restore itinerary' }).click();
    await expect(page.getByRole('button', { name: 'Mark itinerary completed' })).toBeVisible();
  });

  test('deleting a trip warns what goes with it', async ({ page, user }) => {
    await user.createItinerary({ title: 'Doomed Trip', startDate: plusDays(2), endDate: plusDays(4) });
    await page.goto('/itinerary');

    await page.getByRole('button', { name: 'Delete itinerary' }).click();
    await expect(page.getByText(
      'Delete "Doomed Trip"? Its to-dos, notes, and polls are removed too.',
    )).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('No trips yet')).toBeVisible();
  });
});

test.describe('the detail view', () => {
  test('an unknown id reports not found', async ({ page, user }) => {
    await page.goto('/itinerary/11111111-1111-1111-1111-111111111111');
    await expect(page.getByText('Itinerary not found.')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the title can be renamed in place', async ({ page, user }) => {
    const trip = await user.createItinerary({
      title: 'Old Trip', startDate: plusDays(2), endDate: plusDays(4),
    });
    await page.goto(`/itinerary/${trip.id}`);

    const title = page.getByPlaceholder('Untitled trip');
    await title.fill('Renamed Trip');
    await title.press('Enter');

    await page.reload();
    await expect(page.getByPlaceholder('Untitled trip')).toHaveValue('Renamed Trip');
  });

  test('the polls tab is hidden for a personal trip', async ({ page, user }) => {
    const trip = await user.createItinerary({
      title: 'Just Me', startDate: plusDays(2), endDate: plusDays(4),
    });
    await page.goto(`/itinerary/${trip.id}`);

    await expect(page.getByRole('button', { name: 'Plan', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notes', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Polls', exact: true })).toHaveCount(0);
  });

  test('the polls tab appears for a group trip', async ({ page, user }) => {
    const group = await user.createGroup('Trip Crew');
    const trip = await user.createItinerary({
      title: 'Group Trip', groupId: group.id, startDate: plusDays(2), endDate: plusDays(4),
    });
    await page.goto(`/itinerary/${trip.id}`);

    await page.getByRole('button', { name: 'Polls', exact: true }).click();
    await expect(page.getByText('No polls yet — start one to decide together.')).toBeVisible();
  });

  test('notes autosave', async ({ page, user }) => {
    const trip = await user.createItinerary({
      title: 'Notable', startDate: plusDays(2), endDate: plusDays(4),
    });
    await page.goto(`/itinerary/${trip.id}`);
    await page.getByRole('button', { name: 'Notes', exact: true }).click();

    await page.locator('.page-doc').click();
    await page.keyboard.type('Remember the sunscreen');

    await expect(page.getByText('Saved')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await expect(page.getByText('Remember the sunscreen')).toBeVisible();
  });

  test('the plan tab offers only week and day views', async ({ page, user }) => {
    const trip = await user.createItinerary({
      title: 'Planner', startDate: plusDays(2), endDate: plusDays(4),
    });
    await page.goto(`/itinerary/${trip.id}`);

    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Trip start' })).toBeVisible();
  });
});
