import { test, expect } from '../fixtures/index.js';
import { PASSWORD, call } from '../fixtures/api.js';

test.describe('display name', () => {
  test('the name can be changed', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByLabel('Name', { exact: true }).fill('Renamed Person');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Saved')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Renamed Person');
    expect(user.id).toBeTruthy();
  });

  test('an empty name is rejected', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByLabel('Name', { exact: true }).fill('   ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Name cannot be empty')).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});

test.describe('password', () => {
  test('all fields are required', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Update password' }).click();

    await expect(page.getByText('All fields are required')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the new password must be confirmed correctly', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByLabel('Current password').fill(PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill('new-Password-1');
    await page.getByLabel('Confirm new password').fill('different-Password-1');
    await page.getByRole('button', { name: 'Update password' }).click();

    await expect(page.getByText('New passwords do not match')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a wrong current password is reported', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByLabel('Current password').fill('not-my-password');
    await page.getByLabel('New password', { exact: true }).fill('new-Password-1');
    await page.getByLabel('Confirm new password').fill('new-Password-1');
    await page.getByRole('button', { name: 'Update password' }).click();

    await expect(page.getByText('Current password is incorrect')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a changed password works on the next login', async ({ page, user }) => {
    const next = 'brand-New-Password-9';
    await page.goto('/profile');
    await page.getByLabel('Current password').fill(PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill(next);
    await page.getByLabel('Confirm new password').fill(next);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Password updated')).toBeVisible();

    // Prove it against the API rather than trusting the banner.
    const logged = await call('/api/auth/login', {
      method: 'POST',
      body: { email: user.email, password: next },
    });
    expect(logged.accessToken).toBeTruthy();
  });
});

test.describe('deleting the account', () => {
  test('the confirm button unlocks only on an exact email match', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Delete Account' }).click();

    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Delete Account' });
    await expect(confirm).toBeDisabled();

    await page.getByRole('dialog').getByLabel('Email').fill('wrong@example.test');
    await expect(confirm).toBeDisabled();

    await page.getByRole('dialog').getByLabel('Email').fill(user.email);
    await expect(confirm).toBeEnabled();
  });

  test('cancelling keeps the account', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Delete account' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('confirming deletes the account and signs out', async ({ page, user }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByRole('dialog').getByLabel('Email').fill(user.email);
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Account' }).click();

    await expect(page).toHaveURL(/\/login$/);
    // The credentials no longer work.
    await expect(call('/api/auth/login', {
      method: 'POST',
      body: { email: user.email, password: PASSWORD },
    })).rejects.toThrow();
  });
});
