import { test as base, Page } from '@playwright/test';

type ActorPages = {
  customerPage: Page;
  staffPage: Page;
  managerPage: Page;
};

export const test = base.extend<ActorPages>({
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'customer@storage.vn');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.pathname === '/');
    await use(page);
    await context.close();
  },

  staffPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'staff.q1@smartstorage.vn');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/staff.*/);
    await use(page);
    await context.close();
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'fm.q1@smartstorage.vn');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/manager.*/);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
