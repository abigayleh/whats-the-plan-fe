import { test, expect } from '../fixtures/index.js';

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

test.describe('empty and gated states', () => {
  test('with no groups, polling is unavailable', async ({ page, user }) => {
    await page.goto('/polls');

    await expect(page.getByText('Join a group to start polling.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Poll' })).toBeDisabled();
    expect(user.id).toBeTruthy();
  });

  test('with a group but no polls, the empty state shows', async ({ page, user }) => {
    await user.createGroup('Pollers');
    await page.goto('/polls');

    await expect(page.getByText('No polls yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Poll' })).toBeEnabled();
  });
});

test.describe('creating', () => {
  test('a poll is created and listed', async ({ page, user }) => {
    await user.createGroup('Dinner Crew');
    await page.goto('/polls');

    await page.getByRole('button', { name: 'New Poll' }).click();
    await page.getByLabel('Question').fill('Where shall we eat?');
    await page.getByPlaceholder('Option 1').fill('Pizza');
    await page.getByPlaceholder('Option 2').fill('Sushi');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Where shall we eat?')).toBeVisible();
    await expect(page.getByRole('button', { name: /Pizza/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sushi/ })).toBeVisible();
  });

  test('extra options can be added and removed', async ({ page, user }) => {
    await user.createGroup('Optioneers');
    await page.goto('/polls');
    await page.getByRole('button', { name: 'New Poll' }).click();

    await page.getByRole('button', { name: 'Add option' }).click();
    await expect(page.getByPlaceholder('Option 3')).toBeVisible();

    await page.getByRole('button', { name: 'Remove option' }).first().click();
    await expect(page.getByPlaceholder('Option 3')).toBeHidden();
  });

  test('fewer than two options is rejected', async ({ page, user }) => {
    await user.createGroup('Sparse');
    await page.goto('/polls');
    await page.getByRole('button', { name: 'New Poll' }).click();

    await page.getByLabel('Question').fill('Only one choice?');
    await page.getByPlaceholder('Option 1').fill('Just this');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Give the poll at least 2 options')).toBeVisible();
  });

  test('an expiry in the past is rejected', async ({ page, user }) => {
    await user.createGroup('Timely');
    await page.goto('/polls');
    await page.getByRole('button', { name: 'New Poll' }).click();

    await page.getByLabel('Question').fill('Too late?');
    await page.getByPlaceholder('Option 1').fill('A');
    await page.getByPlaceholder('Option 2').fill('B');
    await page.getByLabel('Expires (optional)').fill('2020-01-01');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Expiry must be in the future')).toBeVisible();
  });

  test('a future expiry is accepted and shown', async ({ page, user }) => {
    await user.createGroup('Deadline');
    await page.goto('/polls');
    await page.getByRole('button', { name: 'New Poll' }).click();

    await page.getByLabel('Question').fill('Closing soon?');
    await page.getByPlaceholder('Option 1').fill('Yes');
    await page.getByPlaceholder('Option 2').fill('No');
    await page.getByLabel('Expires (optional)').fill(tomorrow());
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Closing soon?')).toBeVisible();
    await expect(page.getByText(/^Closes /)).toBeVisible();
  });
});

test.describe('voting', () => {
  test('voting records a share and locks that option', async ({ page, user }) => {
    const group = await user.createGroup('Voters');
    await user.createPoll(group.id, { question: 'Tea or coffee?', options: ['Tea', 'Coffee'] });
    await page.goto('/polls');

    await page.getByRole('button', { name: /Tea/ }).click();

    await expect(page.getByText('1 vote')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tea/ })).toBeDisabled();
  });

  test("a second member's vote appears live", async ({ page, user, secondUser }) => {
    const group = await user.createGroup('Live Votes');
    const { code } = await user.inviteCode(group.id);
    await secondUser.joinGroup(code);
    await user.createPoll(group.id, { question: 'Beach or mountains?', options: ['Beach', 'Mountains'] });

    await page.goto('/polls');
    await page.getByRole('button', { name: /Beach/ }).click();
    await expect(page.getByText('1 vote')).toBeVisible();

    // The other member votes in their own browser; the first page must update itself.
    await secondUser.page.goto('/polls');
    await secondUser.page.getByRole('button', { name: /Mountains/ }).click();

    await expect(page.getByText('2 votes')).toBeVisible();
  });
});

test.describe('deleting', () => {
  test('the creator deletes their poll', async ({ page, user }) => {
    const group = await user.createGroup('Cleanup');
    await user.createPoll(group.id, { question: 'Delete me?', options: ['Yes', 'No'] });
    await page.goto('/polls');

    await page.getByRole('button', { name: 'Delete poll' }).click();
    await expect(page.getByText('Delete "Delete me?"? This can\'t be undone.')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

    // exact: true — the confirmation sentence also contains the question text.
    await expect(page.getByText('Delete me?', { exact: true })).toBeHidden();
    await expect(page.getByText('No polls yet.')).toBeVisible();
  });

  test('a plain member cannot delete someone else\'s poll', async ({ user, secondUser }) => {
    const group = await user.createGroup('Not Yours');
    const { code } = await user.inviteCode(group.id);
    await secondUser.joinGroup(code);
    await user.createPoll(group.id, { question: 'Whose poll?', options: ['Mine', 'Yours'] });

    await secondUser.page.goto('/polls');
    await expect(secondUser.page.getByText('Whose poll?')).toBeVisible();
    await expect(secondUser.page.getByRole('button', { name: 'Delete poll' })).toHaveCount(0);
  });
});

test('group chips filter the poll list', async ({ page, user }) => {
  const alpha = await user.createGroup('Alpha');
  const beta = await user.createGroup('Beta');
  await user.createPoll(alpha.id, { question: 'Alpha question?', options: ['A', 'B'] });
  await user.createPoll(beta.id, { question: 'Beta question?', options: ['C', 'D'] });
  await page.goto('/polls');

  await expect(page.getByText('Alpha question?')).toBeVisible();
  await expect(page.getByText('Beta question?')).toBeVisible();

  await page.getByRole('button', { name: 'Beta', exact: true }).click();
  await expect(page.getByText('Beta question?')).toBeHidden();
  await expect(page.getByText('Alpha question?')).toBeVisible();
});
