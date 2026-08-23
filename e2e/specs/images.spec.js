import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '../fixtures/index.js';
import { editable, newPage } from '../helpers/pages.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(here, '../fixtures/sample.png');

const pageImage = (page) => page.locator('.page-image img');

/** Records every /api/files/:id result so a failure names the status instead of "unavailable". */
function watchFileRequests(page) {
  const seen = [];
  page.on('response', (r) => {
    if (/\/api\/files\//.test(r.url())) seen.push(`${r.status()} ${r.url()}`);
  });
  return seen;
}

/** Drops the fixture onto the editor the way a real drag would, and waits for the upload. */
async function dropImage(page) {
  const data = fs.readFileSync(FIXTURE).toString('base64');
  const handle = await page.evaluateHandle((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'sample.png', { type: 'image/png' }));
    return dt;
  }, data);

  const uploaded = page.waitForResponse(
    (r) => r.url().includes('/api/attachments') && r.request().method() === 'POST',
  );
  await editable(page).click();
  // ProseMirror resolves the drop position from the event's coordinates and bails before
  // handleDrop if they land outside the editor — a synthetic event defaults them to 0,0.
  const box = await editable(page).boundingBox();
  await editable(page).dispatchEvent('drop', {
    dataTransfer: handle,
    clientX: Math.round(box.x + box.width / 2),
    clientY: Math.round(box.y + 8),
  });
  return (await uploaded).status();
}

/**
 * The assertion the rest of the suite is missing: a broken image and a working one have
 * identical DOM, so presence proves nothing. naturalWidth is non-zero only once the bytes
 * have actually decoded.
 */
async function expectDecoded(page, files) {
  const img = pageImage(page).first();
  await expect(img, `/api/files responses: ${files.join(', ') || 'none'}`).toBeVisible();
  await expect
    .poll(() => img.evaluate((el) => el.naturalWidth),
      { message: `image never decoded. /api/files responses: ${files.join(', ') || 'none'}` })
    .toBeGreaterThan(0);
  await expect(page.locator('.page-image__failed')).toHaveCount(0);
  await expect(img).toHaveAttribute('src', /^blob:/);
}

test.describe('page images', () => {
  test('a dropped image uploads and renders', async ({ page, user }) => {
    const files = watchFileRequests(page);
    await page.goto('/pages');
    await newPage(page, 'With Image');

    expect(await dropImage(page)).toBe(201);
    await expectDecoded(page, files);
    expect(user.id).toBeTruthy();
  });

  test('an image still renders after a reload', async ({ page, user }) => {
    const files = watchFileRequests(page);
    await page.goto('/pages');
    await newPage(page, 'Reloaded Image');

    const saved = page.waitForResponse(
      (r) => /\/api\/pages\//.test(r.url()) && r.request().method() === 'PATCH' && r.ok(),
    );
    expect(await dropImage(page)).toBe(201);
    await saved;

    await page.reload();
    await expectDecoded(page, files);
    expect(user.id).toBeTruthy();
  });

  // The uploader seeing their own image proves little: the attachment is already in hand.
  // A second member resolves it cold, through the group access check on /api/files/:id.
  test('a group member sees an image someone else added', async ({ page, user, secondUser }) => {
    const group = await user.createGroup('Image Crew');
    const { code } = await user.inviteCode(group.id);
    await secondUser.joinGroup(code);
    const shared = await user.call('/api/pages', {
      method: 'POST',
      body: { title: 'Shared Image', groupId: group.id },
    });

    await page.goto(`/pages/${shared.id}`);
    const saved = page.waitForResponse(
      (r) => /\/api\/pages\//.test(r.url()) && r.request().method() === 'PATCH' && r.ok(),
    );
    expect(await dropImage(page)).toBe(201);
    await saved;

    const files = watchFileRequests(secondUser.page);
    await secondUser.page.goto(`/pages/${shared.id}`);
    await expectDecoded(secondUser.page, files);
  });

  test('the stored attachment reference never reaches the DOM', async ({ page, user }) => {
    await page.goto('/pages');
    await newPage(page, 'Resolved Src');

    expect(await dropImage(page)).toBe(201);
    await expect(pageImage(page).first()).toBeVisible();
    await expect(page.locator('img[src^="attachment:"]')).toHaveCount(0);
    expect(user.id).toBeTruthy();
  });
});
