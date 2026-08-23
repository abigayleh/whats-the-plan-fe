import { test, expect } from '../fixtures/index.js';
import { newPage, tree } from '../helpers/pages.js';

const doc = (page) => page.locator('.page-doc');
const editorTitle = (page) => page.getByRole('main').getByPlaceholder('Untitled');

/** Types into the editor and waits for the save to actually land. */
async function typeAndSave(page, text) {
  const saved = page.waitForResponse(
    (r) => /\/api\/pages\//.test(r.url()) && r.request().method() === 'PATCH' && r.ok(),
  );
  await doc(page).click();
  await page.keyboard.type(text);
  await saved;
}

test.describe('the tree', () => {
  test('the empty state invites you to create one', async ({ page, user }) => {
    await page.goto('/pages');
    await expect(page.getByText('Select a page, or create a new one.')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a page is created and opened', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Trip Notes');

    await expect(page).toHaveURL(/\/pages\/[0-9a-f-]{36}$/);
    await expect(editorTitle(page)).toHaveValue('Trip Notes');
    expect(user.id).toBeTruthy();
  });

  // "Add subpage" creates an Untitled child immediately and opens it — there is no modal.
  test('a subpage nests under its parent', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Parent Page');

    await tree(page).getByRole('button', { name: 'Add subpage' }).first().click();
    await expect(tree(page).getByRole('button', { name: 'Hide subpages' })).toBeVisible();

    await editorTitle(page).fill('Child Page');
    await expect(tree(page).getByText('Child Page')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('search filters the tree and can be cleared', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Alpha Page');
    await newPage(page, 'Beta Page');

    // It's an <input type="search">, so the role is searchbox, not textbox.
    const search = page.getByRole('searchbox', { name: 'Search pages' });
    await search.fill('Alpha');
    await expect(tree(page).getByText('Beta Page')).toHaveCount(0);
    await expect(tree(page).getByText('Alpha Page')).toBeVisible();

    // The empty-state message uses curly quotes.
    await search.fill('zzz-no-such-page');
    await expect(page.getByText('No pages match “zzz-no-such-page”.')).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(tree(page).getByText('Beta Page')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the sidebar collapses and reopens', async ({ page, user }) => {
    await page.goto('/pages');
    await page.getByRole('button', { name: 'Hide pages' }).click();
    await expect(page.getByRole('button', { name: 'Show pages' })).toBeVisible();

    await page.getByRole('button', { name: 'Show pages' }).click();
    await expect(page.getByRole('button', { name: 'New page' })).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});

test.describe('the editor', () => {
  test('typed content autosaves and survives a reload', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Autosaved');

    await typeAndSave(page, 'The quick brown fox');
    await page.reload();

    await expect(doc(page)).toContainText('The quick brown fox');
    expect(user.id).toBeTruthy();
  });

  test('markdown shortcuts produce real nodes', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Formatted');

    await doc(page).click();
    await page.keyboard.type('# A heading\n');
    await page.keyboard.type('- first bullet\n');

    await expect(doc(page).getByRole('heading', { name: 'A heading' })).toBeVisible();
    await expect(doc(page).locator('ul li').first()).toContainText('first bullet');
    expect(user.id).toBeTruthy();
  });

  test('the slash menu inserts a block', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Slashed');

    await doc(page).click();
    await page.keyboard.type('/');
    await expect(page.getByText('To-do list')).toBeVisible();

    await page.getByText('To-do list').click();
    await expect(doc(page).locator('ul[data-type="taskList"]')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('the slash menu reports when nothing matches', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Empty Menu');

    await doc(page).click();
    await page.keyboard.type('/zzzznotathing');
    await expect(page.getByText('No blocks')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('a table can be inserted and given a column', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Tabular');

    await doc(page).click();
    await page.keyboard.type('/table');
    await page.getByText('Table', { exact: true }).click();
    await expect(doc(page).locator('table')).toBeVisible();

    const cells = doc(page).locator('table tr').first().locator('th, td');
    const before = await cells.count();
    await page.getByRole('button', { name: 'Column +' }).click();
    await expect(cells).toHaveCount(before + 1);
    expect(user.id).toBeTruthy();
  });

  test('the title can be renamed', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Before Rename');

    await editorTitle(page).fill('After Rename');
    await expect(tree(page).getByText('After Rename')).toBeVisible();
    expect(user.id).toBeTruthy();
  });

  test('deleting a page explains what happens to subpages', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Deletable');

    await page.getByRole('button', { name: 'Delete page' }).click();
    await expect(page.getByText('Delete this page? Its subpages move up a level.')).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(tree(page).getByText('Deletable')).toHaveCount(0);
    expect(user.id).toBeTruthy();
  });

  test('a subpage can be moved back to the top level', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Root Page');
    await tree(page).getByRole('button', { name: 'Add subpage' }).first().click();
    await expect(tree(page).getByRole('button', { name: 'Hide subpages' })).toBeVisible();
    await editorTitle(page).fill('Nested Page');
    await expect(tree(page).getByText('Nested Page')).toBeVisible();

    await page.getByRole('button', { name: 'Move to…' }).click();
    await page.getByRole('button', { name: 'Top level' }).click();

    await expect(page.getByRole('button', { name: 'Top level' })).toHaveCount(0);
    await expect(tree(page).getByText('Nested Page')).toBeVisible();
    expect(user.id).toBeTruthy();
  });
});
