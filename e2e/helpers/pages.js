import { expect } from '@playwright/test';

// Both the create modal and the open editor use placeholder "Untitled", so always scope.
export const modalTitle = (page) => page.getByRole('dialog').getByLabel('Title');
export const tree = (page) => page.locator('.page-tree');
// ProseMirror binds its DOM handlers to the contenteditable itself, not the EditorContent
// wrapper — an event dispatched on the wrapper never reaches the editor's handlers.
export const editable = (page) => page.locator('.page-doc [contenteditable="true"]');

export async function newPage(page, title) {
  await page.getByRole('button', { name: 'New page' }).click();
  await modalTitle(page).fill(title);
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tree(page).getByText(title)).toBeVisible();
}
