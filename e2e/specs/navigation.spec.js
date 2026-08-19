import { test, expect } from '../fixtures/index.js';

const NAV = [
  ['Calendar', '/', 'Calendar'],
  ['Lists', '/lists', 'Lists'],
  ['Pages', '/pages', null],
  ['Itinerary', '/itinerary', null],
  ['Polls', '/polls', 'Polls'],
  ['Chat', '/chat', 'Chat'],
  ['Groups', '/groups', 'Groups'],
];

test.describe('the side navigation', () => {
  for (const [label, path] of NAV) {
    test(`the ${label} link goes to ${path}`, async ({ page, user }) => {
      await page.goto('/');
      // Not exact: the Chat item's accessible name carries its "Soon" badge.
      await page.getByRole('navigation')
        .getByRole('link', { name: new RegExp(`^${label}`) }).click();

      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
      expect(user.id).toBeTruthy();
    });
  }

  test('the sidebar collapses and the choice survives a reload', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();

    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});

test.describe('the profile menu', () => {
  test('it opens and links to profile settings', async ({ page, user }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open profile menu' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('link', { name: 'Profile settings' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    expect(user.id).toBeTruthy();
  });
});

test('the chat page is a placeholder', async ({ page, user }) => {
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
  await expect(page.getByText('Coming soon')).toBeVisible();
  await expect(page.getByText(
    "Chat is on the way — you'll be able to message anyone you share a group with.",
  )).toBeVisible();
  expect(user.id).toBeTruthy();
});
