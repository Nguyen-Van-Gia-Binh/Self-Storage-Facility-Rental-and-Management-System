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
    await page.fill('input[type="email"]', 'customer.an@gmail.com');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/customer.*/);
    await use(page);
    await context.close();
  },

  staffPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'staff.sg@smartstorage.vn');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/staff.*/);
    await use(page);
    await context.close();
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'manager.sg@smartstorage.vn');
    await page.fill('input[type="password"]', 'Password@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/manager.*/);
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
