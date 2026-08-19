import { test, expect } from '../fixtures/index.js';

// Every account is created with a "My to dos" list, and each list renders its name into four
// buttons (header, Edit, Delete, Reorder). So always scope to one section, and anchor the
// header name so "Packing" doesn't also match "Edit Packing".
const header = (scope, name) => scope.getByRole('button', { name: new RegExp(`^${name}`) });
const section = (page, name) =>
  page.locator('.list-section').filter({ has: header(page, name) });

test.describe('lists', () => {
  test('creating a list adds a section', async ({ page, user }) => {
    await page.goto('/lists');
    await page.getByRole('button', { name: 'New List' }).click();
    await page.getByLabel('Name').fill('Packing');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(section(page, 'Packing')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a new list starts empty', async ({ page, user }) => {
    await user.createList('Empty List');
    await page.goto('/lists');

    await expect(section(page, 'Empty List').getByText('No tasks yet.')).toBeVisible();
  });

  test('scope is fixed once a list exists', async ({ page, user }) => {
    await user.createList('Locked Scope');
    await page.goto('/lists');
    await page.getByRole('button', { name: 'Edit Locked Scope' }).click();

    await expect(page.getByText('A list stays in the space it was created in.')).toBeVisible();
  });

  test('renaming a list updates its heading', async ({ page, user }) => {
    await user.createList('Old Name');
    await page.goto('/lists');
    await page.getByRole('button', { name: 'Edit Old Name' }).click();
    // exact: true — otherwise this also matches the "Edit Old Name"/"Reorder Old Name" aria-labels.
    await page.getByLabel('Name', { exact: true }).fill('New Name');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(section(page, 'New Name')).toBeVisible();
    await expect(section(page, 'Old Name')).toHaveCount(0);
  });

  test('deleting a list warns about its tasks', async ({ page, user }) => {
    const list = await user.createList('Doomed');
    await user.createTask(list.id, { title: 'Task one' });
    await user.createTask(list.id, { title: 'Task two' });
    await page.goto('/lists');

    await page.getByRole('button', { name: 'Delete Doomed' }).click();
    await expect(
      page.getByText('Delete "Doomed" and its 2 tasks? This can\'t be undone.'),
    ).toBeVisible();

    // Scoped to the dialog: every task row also has a "Delete" button.
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(section(page, 'Doomed')).toHaveCount(0);
  });

  test('deleting an empty list omits the task count', async ({ page, user }) => {
    await user.createList('Bare');
    await page.goto('/lists');
    await page.getByRole('button', { name: 'Delete Bare' }).click();

    await expect(page.getByText('Delete "Bare"? This can\'t be undone.')).toBeVisible();
  });

  test('a list can be collapsed and expanded', async ({ page, user }) => {
    const list = await user.createList('Collapsible');
    await user.createTask(list.id, { title: 'Inside' });
    await page.goto('/lists');

    const toggle = header(section(page, 'Collapsible'), 'Collapsible');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Inside')).toBeHidden();

    await toggle.click();
    await expect(page.getByText('Inside')).toBeVisible();
  });

  test('a system list exposes no management controls', async ({ page, user }) => {
    await user.createList('Ordinary');
    await page.goto('/lists');

    const system = section(page, 'Assigned to Me');
    await expect(system).toBeVisible();
    await expect(system.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    await expect(system.getByRole('button', { name: /^Delete / })).toHaveCount(0);
    await expect(system.getByPlaceholder('Add a to-do…')).toHaveCount(0);
  });
});

test.describe('tasks', () => {
  test('the quick-add field creates a to-do', async ({ page, user }) => {
    await user.createList('Quick');
    await page.goto('/lists');

    const quickAdd = section(page, 'Quick').getByPlaceholder('Add a to-do…');
    await quickAdd.fill('Buy milk');
    await quickAdd.press('Enter');

    await expect(section(page, 'Quick').getByText('Buy milk')).toBeVisible();
    await expect(quickAdd).toHaveValue('');
  });

  test('a task can be completed and then hidden', async ({ page, user }) => {
    const list = await user.createList('Completable');
    await user.createTask(list.id, { title: 'Finish me' });
    await page.goto('/lists');

    const scope = section(page, 'Completable');
    await scope.getByRole('checkbox').first().click();
    await expect(scope.getByRole('checkbox').first()).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: 'Hide completed' }).click();
    await expect(scope.getByText('Finish me')).toBeHidden();
  });

  test('a task can be deleted from its row', async ({ page, user }) => {
    const list = await user.createList('Deletable');
    await user.createTask(list.id, { title: 'Remove me' });
    await page.goto('/lists');

    const scope = section(page, 'Deletable');
    await scope.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(scope.getByText('Remove me')).toBeHidden();
  });

  test('push to tomorrow keeps the task', async ({ page, user }) => {
    const list = await user.createList('Pushable');
    const today = new Date().toISOString().slice(0, 10);
    await user.createTask(list.id, { title: 'Push me', dueDate: today });
    await page.goto('/lists');

    const scope = section(page, 'Pushable');
    await scope.getByRole('button', { name: 'Push to tomorrow', exact: true }).click();
    await expect(scope.getByText('Push me')).toBeVisible();
  });

  test('a task moves to another list', async ({ page, user }) => {
    const from = await user.createList('Source');
    await user.createList('Destination');
    await user.createTask(from.id, { title: 'Travelling task' });
    await page.goto('/lists');

    await section(page, 'Source')
      .getByRole('button', { name: 'Move to another list', exact: true }).click();
    await page.locator('select').last().selectOption({ label: 'Destination' });

    await expect(section(page, 'Destination').getByText('Travelling task')).toBeVisible();
    await expect(section(page, 'Source').getByText('Travelling task')).toHaveCount(0);
  });

  test('opening a task row shows the edit modal', async ({ page, user }) => {
    const list = await user.createList('Openable');
    await user.createTask(list.id, { title: 'Inspect me' });
    await page.goto('/lists');

    await section(page, 'Openable').getByRole('button', { name: /^Inspect me/ }).click();
    await expect(page.getByRole('heading', { name: 'Edit Task' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Inspect me');
  });
});
