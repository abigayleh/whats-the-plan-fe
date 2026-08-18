import { test, expect } from '../fixtures/index.js';

test('an anonymous visitor lands on the marketing page', async ({ anonPage }) => {
  await anonPage.goto('/');
  await expect(anonPage.getByRole('link', { name: 'Log in' }).first()).toBeVisible();
});

test('a deep link while logged out redirects to login', async ({ anonPage }) => {
  await anonPage.goto('/groups');
  await expect(anonPage).toHaveURL(/\/login$/);
});

test('a seeded session lands straight on the calendar', async ({ page, user }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open profile menu' })).toBeVisible();
  expect(user.email).toContain('@example.test');
});

test('the API factory can seed a group', async ({ page, user }) => {
  const group = await user.createGroup('Seeded Group');
  await page.goto('/groups');
  await expect(page.getByRole('link', { name: /Seeded Group/ })).toBeVisible();
  expect(group.id).toBeTruthy();
});
