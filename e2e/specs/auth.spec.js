import { test, expect } from '../fixtures/index.js';
import { PASSWORD, registerUser, uniqueEmail } from '../fixtures/api.js';

test.describe('registration', () => {
  test('registering shows the check-your-email screen', async ({ anonPage }) => {
    const email = uniqueEmail('reg');
    await anonPage.goto('/register');
    await anonPage.getByLabel('Name').fill('New Person');
    await anonPage.getByLabel('Email').fill(email);
    await anonPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await anonPage.getByLabel('Confirm password').fill(PASSWORD);
    await anonPage.getByRole('button', { name: 'Register' }).click();

    await expect(anonPage.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    await expect(anonPage.getByText(email)).toBeVisible();
  });

  test('mismatched passwords are rejected before any request', async ({ anonPage }) => {
    await anonPage.goto('/register');
    await anonPage.getByLabel('Name').fill('New Person');
    await anonPage.getByLabel('Email').fill(uniqueEmail('mismatch'));
    await anonPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await anonPage.getByLabel('Confirm password').fill('something-else');
    await anonPage.getByRole('button', { name: 'Register' }).click();

    await expect(anonPage.getByText('Passwords do not match')).toBeVisible();
  });

  test('an already-registered email is rejected', async ({ anonPage }) => {
    const { email } = await registerUser({ tag: 'dupe' });
    await anonPage.goto('/register');
    await anonPage.getByLabel('Name').fill('Duplicate');
    await anonPage.getByLabel('Email').fill(email);
    await anonPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await anonPage.getByLabel('Confirm password').fill(PASSWORD);
    await anonPage.getByRole('button', { name: 'Register' }).click();

    await expect(anonPage.getByText('Email already registered')).toBeVisible();
  });

  test('the resend button reports that it sent', async ({ anonPage }) => {
    await anonPage.goto('/register');
    await anonPage.getByLabel('Name').fill('Resender');
    await anonPage.getByLabel('Email').fill(uniqueEmail('resend'));
    await anonPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await anonPage.getByLabel('Confirm password').fill(PASSWORD);
    await anonPage.getByRole('button', { name: 'Register' }).click();

    await anonPage.getByRole('button', { name: 'Resend email' }).click();
    await expect(anonPage.getByRole('button', { name: 'Verification email resent' })).toBeDisabled();
  });
});

test.describe('verification', () => {
  test('a valid link verifies and hands off to login', async ({ anonPage }) => {
    const { verifyToken } = await registerUser({ tag: 'verify' });
    await anonPage.goto(`/verify?token=${verifyToken}`);

    await expect(anonPage.getByRole('heading', { name: 'Email verified' })).toBeVisible();
    await expect(anonPage).toHaveURL(/\/login\?verified=1$/);
    await expect(anonPage.getByText('Email verified — you can log in now.')).toBeVisible();
  });

  test('a missing token shows the expired-link state', async ({ anonPage }) => {
    await anonPage.goto('/verify');
    await expect(anonPage.getByRole('heading', { name: 'Link expired or invalid' })).toBeVisible();
    await expect(anonPage.getByRole('link', { name: 'Go to log in' })).toBeVisible();
  });

  test('a garbage token shows the expired-link state', async ({ anonPage }) => {
    await anonPage.goto('/verify?token=not-a-real-token');
    await expect(anonPage.getByRole('heading', { name: 'Link expired or invalid' })).toBeVisible();
  });
});

test.describe('login', () => {
  test('an unverified account is blocked and offered a resend', async ({ anonPage }) => {
    const { email } = await registerUser({ tag: 'unverified' });
    await anonPage.goto('/login');
    await anonPage.getByLabel('Email').fill(email);
    await anonPage.getByLabel('Password').fill(PASSWORD);
    await anonPage.getByRole('button', { name: 'Log in' }).click();

    await expect(anonPage.getByText('Please verify your email before logging in.')).toBeVisible();
    await anonPage.getByRole('button', { name: 'Resend verification email' }).click();
    await expect(anonPage.getByRole('button', { name: 'Verification email resent' })).toBeDisabled();
  });

  test('verifying then logging in reaches the calendar', async ({ anonPage }) => {
    const { email, verifyToken } = await registerUser({ tag: 'full' });
    await anonPage.goto(`/verify?token=${verifyToken}`);
    await expect(anonPage).toHaveURL(/\/login/);

    await anonPage.getByLabel('Email').fill(email);
    await anonPage.getByLabel('Password').fill(PASSWORD);
    await anonPage.getByRole('button', { name: 'Log in' }).click();

    await expect(anonPage.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  });

  test('wrong credentials are rejected', async ({ anonPage }) => {
    await anonPage.goto('/login');
    await anonPage.getByLabel('Email').fill(uniqueEmail('nobody'));
    await anonPage.getByLabel('Password').fill('wrong-password');
    await anonPage.getByRole('button', { name: 'Log in' }).click();

    await expect(anonPage.getByText('Invalid credentials')).toBeVisible();
  });
});

test.describe('session', () => {
  test('a deep link while logged out redirects to login', async ({ anonPage }) => {
    await anonPage.goto('/polls');
    await expect(anonPage).toHaveURL(/\/login$/);
  });

  test('the root path shows the landing page while logged out', async ({ anonPage }) => {
    await anonPage.goto('/');
    await expect(anonPage.getByRole('link', { name: 'Create an account' })).toBeVisible();
  });

  test('logging out returns to login and forgets the session', async ({ page, user }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open profile menu' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/groups');
    await expect(page).toHaveURL(/\/login$/);
    expect(user.email).toBeTruthy();
  });

  test('an unmatched path lands on the app', async ({ page, user }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});
