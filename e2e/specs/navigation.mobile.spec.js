import { test, expect } from '../fixtures/index.js';

// The mobile project runs these at a phone viewport, where the TabBar and its drawer are the
// only way to reach Polls, Chat and Groups.
test('the tab bar exposes the four primary destinations', async ({ page, user }) => {
  await page.goto('/');
  const tabs = page.locator('.tab-bar');

  for (const label of ['Calendar', 'Lists', 'Pages', 'Trips']) {
    await expect(tabs.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  expect(user.id).toBeTruthy();
});

test('the More drawer reaches the secondary destinations', async ({ page, user }) => {
  await page.goto('/');
  await page.locator('.tab-bar').getByRole('button', { name: 'More' }).click();

  await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Groups', exact: true }).click();

  await expect(page).toHaveURL(/\/groups$/);
  expect(user.id).toBeTruthy();
});

test('the drawer backdrop closes it', async ({ page, user }) => {
  await page.goto('/');
  await page.locator('.tab-bar').getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Close menu' }).click();

  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveCount(0);
  expect(user.id).toBeTruthy();
});

test('the collapse toggle is desktop-only', async ({ page, user }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toHaveCount(0);
  expect(user.id).toBeTruthy();
});
