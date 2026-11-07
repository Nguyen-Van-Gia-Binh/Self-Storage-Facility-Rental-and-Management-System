import { test, expect } from './fixtures/actors.fixture';

test.describe('Smoke Test: Xác thực 3 Context độc lập', () => {
  test('3 vai trò đăng nhập đồng thời không xung đột session', async ({
    customerPage,
    staffPage,
    managerPage,
  }) => {
    await expect(customerPage).toHaveURL(/.*\/customer.*/);
    await expect(staffPage).toHaveURL(/.*\/staff.*/);
    await expect(managerPage).toHaveURL(/.*\/manager.*/);
  });
});
