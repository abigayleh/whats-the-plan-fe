import { test, expect } from '../fixtures/index.js';

const grid = (page) => page.getByRole('main');

test.describe('creating and joining', () => {
  test('creating a group adds it to the grid', async ({ page, user }) => {
    await page.goto('/groups');
    await page.getByRole('button', { name: 'New Group' }).click();
    await page.getByLabel('Name').fill('Barcelona Trip');
    await page.getByRole('button', { name: 'teal' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(grid(page).getByRole('link', { name: /Barcelona Trip/ })).toBeVisible();
    await expect(grid(page).getByText('1 member')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a blank name does not create anything', async ({ page, user }) => {
    await page.goto('/groups');
    await page.getByRole('button', { name: 'New Group' }).click();
    await page.getByLabel('Name').fill('   ');
    await page.getByRole('button', { name: 'Create' }).click();

    // The modal stays open and nothing is created.
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a group card opens its settings page', async ({ page, user }) => {
    await user.createGroup('Settings Target');
    await page.goto('/groups');
    await grid(page).getByRole('link', { name: /Settings Target/ }).click();

    await expect(page.getByRole('heading', { name: 'Settings Target' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  });

  test('an invalid invite code is rejected', async ({ page, user }) => {
    await page.goto('/groups');
    await page.getByRole('button', { name: 'Join Group' }).click();
    await page.getByLabel('Invite code').fill('definitely-not-a-code');
    await page.getByRole('button', { name: 'Join', exact: true }).click();

    await expect(page.locator('.auth-card__error')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a second user joins by code and appears live to the admin', async ({
    page, user, secondUser,
  }) => {
    const group = await user.createGroup('Live Join');
    await page.goto(`/groups/${group.id}/settings`);

    // The admin generates a code and leaves the page open.
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.locator('code')).not.toHaveText('No active code');
    const code = await page.locator('code').innerText();

    // The other user joins through their own UI.
    await secondUser.page.goto('/groups');
    await secondUser.page.getByRole('button', { name: 'Join Group' }).click();
    await secondUser.page.getByLabel('Invite code').fill(code);
    await secondUser.page.getByRole('button', { name: 'Join', exact: true }).click();
    await expect(
      secondUser.page.getByRole('main').getByRole('link', { name: /Live Join/ }),
    ).toBeVisible();

    // ...and the admin's still-open page updates over the socket, without a reload.
    await expect(page.getByText(secondUser.name)).toBeVisible();
  });
});

test.describe('member management', () => {
  /** Creates a group, has secondUser join it, and returns the group. */
  async function groupWithTwo(user, secondUser, name) {
    const group = await user.createGroup(name);
    const { code } = await user.inviteCode(group.id);
    await secondUser.joinGroup(code);
    return group;
  }

  test('an admin promotes and then demotes a member', async ({ page, user, secondUser }) => {
    const group = await groupWithTwo(user, secondUser, 'Roles');
    await page.goto(`/groups/${group.id}/settings`);

    await page.getByRole('button', { name: 'Make Admin' }).click();
    await expect(page.getByRole('button', { name: 'Demote' })).toBeVisible();

    await page.getByRole('button', { name: 'Demote' }).click();
    await expect(page.getByRole('button', { name: 'Make Admin' })).toBeVisible();
  });

  test('an admin removes a member', async ({ page, user, secondUser }) => {
    const group = await groupWithTwo(user, secondUser, 'Removal');
    await page.goto(`/groups/${group.id}/settings`);
    await expect(page.getByText(secondUser.name)).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText(secondUser.name)).toBeHidden();
  });

  test('a non-admin sees no invite card and no member controls', async ({ user, secondUser }) => {
    const group = await groupWithTwo(user, secondUser, 'Member View');
    await secondUser.page.goto(`/groups/${group.id}/settings`);

    await expect(secondUser.page.getByRole('heading', { name: 'Members' })).toBeVisible();
    await expect(secondUser.page.getByRole('heading', { name: 'Invite Code' })).toBeHidden();
    await expect(secondUser.page.getByRole('button', { name: 'Remove' })).toBeHidden();
    await expect(secondUser.page.getByRole('button', { name: 'Make Admin' })).toBeHidden();
  });

  test('regenerating replaces the invite code', async ({ page, user }) => {
    const group = await user.createGroup('Rotate Code');
    await page.goto(`/groups/${group.id}/settings`);

    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.locator('code')).not.toHaveText('No active code');
    const first = await page.locator('code').innerText();

    await page.getByRole('button', { name: 'Regenerate' }).click();
    await expect(page.locator('code')).not.toHaveText(first);
  });
});

test.describe('leaving', () => {
  test('a member leaves without any warning', async ({ user, secondUser }) => {
    const group = await user.createGroup('Easy Leave');
    const { code } = await user.inviteCode(group.id);
    await secondUser.joinGroup(code);

    await secondUser.page.goto(`/groups/${group.id}/settings`);
    await secondUser.page.getByRole('button', { name: 'Leave Group' }).click();

    await expect(secondUser.page).toHaveURL(/\/groups$/);
    await expect(
      secondUser.page.getByRole('main').getByRole('link', { name: /Easy Leave/ }),
    ).toBeHidden();
  });

  test('the sole admin is warned and can leave-and-delete', async ({ page, user }) => {
    const group = await user.createGroup('Sole Admin');
    await page.goto(`/groups/${group.id}/settings`);
    await page.getByRole('button', { name: 'Leave Group' }).click();

    await expect(page.getByRole('heading', { name: "You're the only admin" })).toBeVisible();
    await expect(page.getByText(
      'Promote another member to admin before leaving, or leave anyway to permanently delete this group.',
    )).toBeVisible();

    await page.getByRole('button', { name: 'Leave & Delete Group' }).click();
    await expect(page).toHaveURL(/\/groups$/);
    await expect(page.getByRole('main').getByRole('link', { name: /Sole Admin/ })).toBeHidden();
  });

  test('the sole-admin warning can be dismissed', async ({ page, user }) => {
    const group = await user.createGroup('Keep It');
    await page.goto(`/groups/${group.id}/settings`);
    await page.getByRole('button', { name: 'Leave Group' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: "You're the only admin" })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Keep It' })).toBeVisible();
  });
});

test.describe('personal space', () => {
  test('the personal space can be renamed', async ({ page, user }) => {
    await page.goto('/groups');
    await page.getByRole('button', { name: /Just you — tap to customize/ }).click();

    await page.getByLabel('Name').fill('My Own Corner');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(grid(page).getByText('My Own Corner')).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});
