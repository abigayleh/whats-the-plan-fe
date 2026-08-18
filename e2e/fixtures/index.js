import { test as base, expect } from '@playwright/test';
import { APP_URL } from '../config.js';
import { createUser } from './api.js';

// Map tiles and OSRM routing are third-party; no test should depend on their uptime.
const EXTERNAL = ['**/*.tile.openstreetmap.org/**', '**/routing.openstreetmap.de/**'];

const blockExternal = (target) =>
  Promise.all(EXTERNAL.map((url) => target.route(url, (route) => route.abort())));

export const test = base.extend({
  page: async ({ page }, use) => {
    await blockExternal(page);
    await use(page);
  },

  // Seeds the one localStorage key AuthProvider needs to restore a session. Registered on the
  // page (not the context) so it applies no matter which fixture is built first.
  user: async ({ page }, use) => {
    const created = await createUser();
    await page.addInitScript((token) => {
      window.localStorage.setItem('wtp_refresh', token);
    }, created.refreshToken);
    await use(created);
  },

  // A second user in their own browser context — for invite, live-poll and socket tests.
  secondUser: async ({ browser }, use) => {
    const created = await createUser({ name: 'Second User', tag: 's' });
    const context = await browser.newContext({ baseURL: APP_URL });
    await context.addInitScript((token) => {
      window.localStorage.setItem('wtp_refresh', token);
    }, created.refreshToken);
    const secondPage = await context.newPage();
    await blockExternal(secondPage);
    await use({ ...created, page: secondPage });
    await context.close();
  },

  // An un-authenticated page, for the auth specs.
  anonPage: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: APP_URL });
    const anon = await context.newPage();
    await blockExternal(anon);
    await use(anon);
    await context.close();
  },
});

export { expect };
