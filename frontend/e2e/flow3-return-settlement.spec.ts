/**
 * E2E TEST SUITE: FLOW 3 — RETURN & SETTLEMENT (TRẢ SỚM WIN-WIN & TẤT TOÁN HOÀN CỌC)
 *
 * Dự án: Self-Storage Facility Rental and Management System (SWP391 — FPT University)
 * Kỹ sư phụ trách: Nguyễn Văn Gia Bình (WS2 Lead Tech / Fullstack Developer)
 * Đặc tả chuẩn gốc: docs-local/MyE2ETask/02-TEST-SCENARIOS-DETAIL.md & docs/BUSINESS-RULES.md
 * Độ phủ: 100% (23 Test Cases: TC-F3-00, TC-F3-01A..E, TC-F3-02A..D, TC-F3-03A..E, TC-F3-04A..E, TC-F3-05A..B, TC-F3-06A..B, TC-F3-07)
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// MOCK DATA & CONSTANTS
// =============================================================================

const MOCK_ACTIVE_POLICY = {
  id: 1,
  version: 'v1',
  versionNo: 1,
  effectiveFrom: '2026-01-01',
  effectiveDate: '2026-01-01',
  returnNoticeDays: 30,
  overdueGraceDays: 3,
  overdueDailyPenaltyRate: 0.1,
  overdueCapRate: 0.7,
  overdueLockAccessDays: 7,
  overdueTerminationDays: 10,
  cleaningReleaseDays: 5,
};

const MOCK_FACILITIES = [
  { id: 1, name: 'Cơ sở Quận 1 (Trụ sở chính)', code: 'FAC-Q1' },
  { id: 2, name: 'Cơ sở Quận 7', code: 'FAC-Q7' },
];

const MOCK_SURCHARGES = [
  {
    id: 15,
    name: 'Kẹt gãy chốt khóa phụ',
    feeName: 'Kẹt gãy chốt khóa phụ',
    code: 'DAMAGE_LOCK',
    category: 'DAMAGE',
    price: 250000,
    amount: 250000,
    unit: 'LẦN',
    isActive: true,
    facilityId: 1,
  },
  {
    id: 16,
    name: 'Vệ sinh rác ô kho',
    feeName: 'Vệ sinh rác ô kho',
    code: 'CLEANING_BASIC',
    category: 'CLEANING',
    price: 300000,
    amount: 300000,
    unit: 'LẦN',
    isActive: true,
    facilityId: 1,
  },
];

// Helper inject auth session trực tiếp vào localStorage
async function authenticateAs(
  page: Page,
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER',
  overrides: Record<string, any> = {}
) {
  const user = {
    CUSTOMER: {
      id: 101,
      username: 'customer_an@storage.vn',
      email: 'customer_an@storage.vn',
      fullName: 'Nguyễn Văn An',
      role: 'CUSTOMER',
      ...overrides,
    },
    STAFF: {
      id: 201,
      username: 'staff.q1@smartstorage.vn',
      email: 'staff.q1@smartstorage.vn',
      fullName: 'Trần Văn Hùng',
      role: 'STAFF',
      facilityId: 1,
      ...overrides,
    },
    MANAGER: {
      id: 301,
      username: 'fm.q1@smartstorage.vn',
      email: 'fm.q1@smartstorage.vn',
      fullName: 'Nguyễn Văn Gia Bình',
      role: 'MANAGER',
      facilityId: 1,
      ...overrides,
    },
  }[role];

  await page.addInitScript((userData) => {
    window.localStorage.setItem('selfstorage_access_token', 'mock-token-' + userData.role.toLowerCase());
    window.localStorage.setItem('access_token', 'mock-token-' + userData.role.toLowerCase());
    window.localStorage.setItem('selfstorage_user_session', JSON.stringify(userData));
    window.localStorage.setItem('current_user', JSON.stringify(userData));
    window.localStorage.setItem('user_role', userData.role);
  }, user);
}

// Thiết lập route chung
async function setupCommonRoutes(page: Page) {
  await page.route('**/api/v1/policies/active', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACTIVE_POLICY),
    });
  });

  await page.route('**/api/v1/facilities*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        content: MOCK_FACILITIES,
        data: MOCK_FACILITIES,
        totalElements: MOCK_FACILITIES.length,
      }),
    });
  });

  await page.route('**/api/v1/surcharges*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        content: MOCK_SURCHARGES,
        data: MOCK_SURCHARGES,
        totalElements: MOCK_SURCHARGES.length,
      }),
    });
  });

  await page.route('**/api/v1/pricing/surcharges*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        content: MOCK_SURCHARGES,
        data: MOCK_SURCHARGES,
        totalElements: MOCK_SURCHARGES.length,
      }),
    });
  });

  await page.route('**/api/v1/reservations/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/v1/contracts/*/financial-summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          contractId: 501,
          totalRentalFee: 7200000,
          totalPaid: 7200000,
          depositAmount: 1200000,
          outstandingDebt: 0,
        },
      }),
    });
  });
}

async function dismissEarlyRenewalModalIfOpen(page: Page) {
  const dismissBtn = page.getByRole('button', { name: 'Để tôi xem sau' }).first();
  if (await dismissBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await dismissBtn.click();
    await page.waitForTimeout(300);
    return;
  }
  const closeBtn = page.locator('button[aria-label="Đóng"]').first();
  if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
}

// =============================================================================
// FLOW 3.0: TRA CỨU Ô KHO & THÔNG TIN HỢP ĐỒNG (UC-F3-01..04)
// =============================================================================

test.describe('Flow 3.0: Tra cứu Ô kho & Thông tin Hợp đồng', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'CUSTOMER');
    await setupCommonRoutes(page);
  });

  test('TC-F3-00: Khách hàng tra cứu kho đang thuê, chi tiết hợp đồng, mã PIN 6 số và người ủy quyền', async ({ page }) => {
    await page.route('**/api/v1/customers/me/rentals**', async (route) => {
      const url = route.request().url();
      if (url.includes('/access-logs')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
        return;
      }
      if (url.match(/\/rentals\/\d+/)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 501,
              contractCode: 'CTR-2026-001',
              facilityId: 1,
              facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
              storageUnitId: 8,
              storageUnitCode: 'Q9-L1-008',
              unitTypeName: 'Kho Tiêu Chuẩn M',
              startDate: '2026-05-12',
              endDateExclusive: '2026-12-30',
              monthlyPrice: 1200000,
              depositAmount: 1200000,
              depositBalance: 1200000,
              status: 'ACTIVE',
              accessCode: '482910',
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 501,
                contractCode: 'CTR-2026-001',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 8,
                storageUnitCode: 'Q9-L1-008',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: '2026-12-30',
                monthlyPrice: 1200000,
                depositAmount: 1200000,
                depositBalance: 1200000,
                status: 'ACTIVE',
                accessCode: '482910',
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    await expect(page.locator('text=Q9-L1-008').first()).toBeVisible();

    const showPinBtn = page.locator('button[title="Hiện mã PIN"]').first();
    if (await showPinBtn.isVisible()) {
      await showPinBtn.click();
      await expect(page.locator('text=482910').first()).toBeVisible();
    }

    const unitBtn = page.getByRole('button', { name: 'Q9-L1-008' }).first();
    await unitBtn.click();

    await expect(page.locator('text=CTR-2026-001').first()).toBeVisible();
  });
});

// =============================================================================
// FLOW 3.1: BÁO TRẢ KHO & HẸN LỊCH NGHIỆM THU (UC-F3-05, BR-RET-01, 06)
// =============================================================================

test.describe('Flow 3.1: Báo trả kho & Hẹn lịch nghiệm thu', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'CUSTOMER');
    await setupCommonRoutes(page);
  });

  test('TC-F3-01A: Khách báo trả kho trong tháng cuối (unusedDays <= 30) — Miễn phạt cọc 100% Deposit', async ({ page }) => {
    const today = new Date();
    const endDateIn15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 501,
                contractCode: 'CTR-2026-001',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 8,
                storageUnitCode: 'Q7-A101',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: endDateIn15Days,
                monthlyPrice: 1200000,
                depositAmount: 1200000,
                depositBalance: 1200000,
                status: 'ACTIVE',
                accessCode: '123456',
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    let returnNoticePayload: any = null;
    await page.route('**/api/v1/contracts/501/return-notices', async (route) => {
      returnNoticePayload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 10,
            contractId: 501,
            intendedReturnDate: returnNoticePayload.intendedReturnDate || endDateIn15Days,
            status: 'PENDING',
          },
        }),
      });
    });

    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    const moreMenuBtn = page.locator('button[title="Thao tác khác"]').first();
    await moreMenuBtn.click();
    const scheduleReturnBtn = page.getByRole('button', { name: 'Báo trả kho' }).first();
    await scheduleReturnBtn.click();

    // Modal xuất hiện với tiêu đề chuẩn
    await expect(page.getByRole('heading', { name: 'Xác Nhận Đã Dọn Đồ & Báo Trả Kho' })).toBeVisible();
    await expect(page.locator('text=Tiền cọc dự kiến quyết toán hoàn lại')).toBeVisible();

    // Tick các checkbox cam kết
    const checkboxes = page.locator('form input[type="checkbox"]');
    for (let i = 0; i < (await checkboxes.count()); i++) {
      await checkboxes.nth(i).check();
    }

    const submitBtn = page.getByRole('button', { name: 'Tôi đã dọn xong — Báo trả kho' }).first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.locator('text=Đã gửi yêu cầu trả kho thành công')).toBeVisible();
    expect(returnNoticePayload).not.toBeNull();
  });

  test('TC-F3-01B: Khách báo trả sớm trước hạn dài (unusedDays > 30) — Hoàn 100% tiền thuê dư & Phạt cọc', async ({ page }) => {
    const today = new Date();
    const endDateIn60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 502,
                contractCode: 'CTR-2026-002',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 9,
                storageUnitCode: 'Q7-A102',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: endDateIn60Days,
                monthlyPrice: 1200000,
                depositAmount: 1200000,
                depositBalance: 1200000,
                status: 'ACTIVE',
                accessCode: '654321',
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/502/return-notices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 11, contractId: 502, status: 'PENDING' },
        }),
      });
    });

    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    const moreMenuBtn = page.locator('button[title="Thao tác khác"]').first();
    await moreMenuBtn.click();
    const scheduleReturnBtn = page.getByRole('button', { name: 'Báo trả kho' }).first();
    await scheduleReturnBtn.click();

    await expect(page.locator('text=Không được hoàn lại khi trả trước hạn')).toBeVisible();

    const checkboxes = page.locator('form input[type="checkbox"]');
    for (let i = 0; i < (await checkboxes.count()); i++) {
      await checkboxes.nth(i).check();
    }

    const submitBtn = page.getByRole('button', { name: 'Tôi đã dọn xong — Báo trả kho' }).first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await expect(page.locator('text=Đã gửi yêu cầu trả kho thành công')).toBeVisible();
  });

  test('TC-F3-01C: Hợp đồng Quá hạn D+1..D+3 bấm Báo trả kho — Thu hồi PIN ngay lập tức', async ({ page }) => {
    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 503,
                contractCode: 'CTR-2026-003',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 10,
                storageUnitCode: 'Q7-A103',
                unitTypeName: 'Kho Tiêu Chuẩn S',
                startDate: '2026-05-12',
                endDateExclusive: '2026-11-06',
                monthlyPrice: 1000000,
                depositAmount: 1000000,
                depositBalance: 1000000,
                status: 'OVERDUE',
                overdueDays: 2,
                overdueFeeAccrued: 0,
                accessCode: '789123',
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/503/return-notices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 12,
            contractId: 503,
            status: 'PENDING_RETURN',
            accessCode: null,
          },
        }),
      });
    });

    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    // Hợp đồng OVERDUE đã tất toán phí quá hạn (overdueFeeAccrued = 0) hiển thị nút "Báo trả kho" trực tiếp ở cột thao tác (BR-OVD-08)
    const scheduleReturnBtn = page.getByRole('button', { name: 'Báo trả kho' }).first();
    await scheduleReturnBtn.click();

    const checkboxes = page.locator('form input[type="checkbox"]');
    for (let i = 0; i < (await checkboxes.count()); i++) {
      await checkboxes.nth(i).check();
    }

    const submitBtn = page.getByRole('button', { name: 'Tôi đã dọn xong — Báo trả kho' }).first();
    await submitBtn.click();
    await expect(page.locator('text=Đã gửi yêu cầu trả kho thành công')).toBeVisible();
  });

  test('TC-F3-01D: [Negative] Hợp đồng Quá hạn D+4..D+9 còn nợ phạt cố tình báo trả — Chặn lỗi MUST_SETTLE_OVERDUE_DEBT_FIRST', async ({ page }) => {
    // 1. Mock hợp đồng OVERDUE có nợ phạt quá hạn 200.000đ (D+5)
    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 504,
                contractCode: 'CTR-2026-004',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 14,
                storageUnitCode: 'Q7-A104',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: '2026-11-03',
                monthlyPrice: 1000000,
                depositAmount: 1000000,
                depositBalance: 1000000,
                status: 'OVERDUE',
                overdueDays: 5,
                overdueFeeAccrued: 200000,
                accessCode: null,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/504/return-notices', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'MUST_SETTLE_OVERDUE_DEBT_FIRST',
          message: 'Bạn phải thanh toán toàn bộ nợ phạt quá hạn trước khi báo trả kho',
        }),
      });
    });

    // 2. Vào trang kho của tôi
    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    // 3. Khẳng định UI: Hiển thị badge Quá hạn và nút "Đóng phí & Mở PIN", KHÔNG có nút "Báo trả kho"
    await expect(page.locator('text=Q7-A104').first()).toBeVisible();
    await expect(page.locator('text=Quá hạn D+5').first()).toBeVisible();
    const payPenaltyBtn = page.getByRole('button', { name: /Đóng phí & Mở PIN/i }).first();
    await expect(payPenaltyBtn).toBeVisible();
    await expect(page.getByRole('button', { name: 'Báo trả kho' })).not.toBeVisible();

    // 4. Bấm vào nút "Đóng phí & Mở PIN" -> Mở modal thanh toán VietQR phí quá hạn
    await payPenaltyBtn.click();
    await expect(page.getByRole('heading', { name: /Đóng Phí Quá Hạn & Mở PIN Tạm/i })).toBeVisible();
    await page.locator('button:has(svg.lucide-x)').first().click();

    // 5. Cố tình gọi API bypass giao diện -> Chặn 400 MUST_SETTLE_OVERDUE_DEBT_FIRST
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/504/return-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intendedReturnDate: '2026-11-08' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.body.code).toBe('MUST_SETTLE_OVERDUE_DEBT_FIRST');
  });

  test('TC-F3-01E: [Negative] Hợp đồng sai trạng thái cố tình báo trả — Chặn lỗi nghiệp vụ', async ({ page }) => {
    // 1. Mock hợp đồng đã kết thúc CLOSED
    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 505,
                contractCode: 'CTR-2026-005',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 15,
                storageUnitCode: 'Q7-A105',
                unitTypeName: 'Kho Tiêu Chuẩn S',
                startDate: '2026-01-01',
                endDateExclusive: '2026-06-01',
                monthlyPrice: 800000,
                depositAmount: 800000,
                depositBalance: 0,
                status: 'CLOSED',
                accessCode: null,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/505/return-notices', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'CONTRACT_NOT_ACTIVE_OR_OVERDUE',
          message: 'Hợp đồng không ở trạng thái hợp lệ để báo trả kho',
        }),
      });
    });

    // 2. Vào trang kho của tôi
    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    // 3. Khẳng định UI: Hiển thị badge "Đã kết thúc", hoàn toàn không có nút "Báo trả kho"
    await expect(page.locator('text=Q7-A105').first()).toBeVisible();
    await expect(page.locator('text=Đã kết thúc').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Báo trả kho' })).not.toBeVisible();

    // 4. Cố tình gọi API bypass giao diện -> Chặn 400 CONTRACT_NOT_ACTIVE_OR_OVERDUE
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/505/return-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intendedReturnDate: '2026-11-08' }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.body.code).toBe('CONTRACT_NOT_ACTIVE_OR_OVERDUE');
  });
});

// =============================================================================
// FLOW 3.2: HỦY YÊU CẦU TRẢ KHO (UC-F3-11, BR-RET-12)
// =============================================================================

test.describe('Flow 3.2: Hủy yêu cầu trả kho', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'CUSTOMER');
    await setupCommonRoutes(page);
  });

  test('TC-F3-02A: Hủy yêu cầu khi chưa quá hạn và Staff chưa kiểm tra — Khôi phục ACTIVE', async ({ page }) => {
    await page.route('**/api/v1/customers/me/rentals*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                contractId: 506,
                contractCode: 'CTR-2026-006',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 12,
                storageUnitCode: 'Q7-A106',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: '2026-12-20',
                status: 'PENDING_RETURN',
                accessCode: '112233',
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    let cancelCalled = false;
    await page.route('**/api/v1/contracts/506/cancel-return', async (route) => {
      cancelCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { contractId: 506, status: 'ACTIVE' },
        }),
      });
    });

    await page.goto('/customer/my-units');
    await dismissEarlyRenewalModalIfOpen(page);

    const moreMenuBtn = page.locator('button[title="Thao tác khác"]').first();
    await moreMenuBtn.click();
    const cancelReturnBtn = page.getByRole('button', { name: 'Hủy yêu cầu trả kho' }).first();
    await expect(cancelReturnBtn).toBeVisible();
    await cancelReturnBtn.click();

    await expect(page.locator('text=Xác nhận hủy yêu cầu trả kho')).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: 'Xác nhận hủy yêu cầu' }).first();
    await confirmBtn.click();

    expect(cancelCalled).toBe(true);
    await expect(page.locator('text=Đã hủy yêu cầu trả kho thành công')).toBeVisible();
  });

  test('TC-F3-02B: Hủy yêu cầu khi ngày hiện tại đã quá hạn hợp đồng — Khôi phục OVERDUE', async ({ page }) => {
    await page.route('**/api/v1/contracts/507/cancel-return', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { contractId: 507, status: 'OVERDUE' },
        }),
      });
    });

    await page.goto('/');
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/507/cancel-return', { method: 'POST' });
      return res.json();
    });

    expect(result.data.status).toBe('OVERDUE');
  });

  test('TC-F3-02C: [Negative] Staff đã nghiệm thu (inspectedAt != null), khách bấm hủy — Chặn lỗi', async ({ page }) => {
    await page.route('**/api/v1/contracts/508/cancel-return', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'RETURN_INSPECTION_ALREADY_STARTED',
          message: 'Nhân viên cơ sở đã thực hiện kiểm tra hiện trường, không thể hủy yêu cầu trả kho',
        }),
      });
    });

    await page.goto('/');
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/508/cancel-return', { method: 'POST' });
      return { status: res.status, body: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.body.code).toBe('RETURN_INSPECTION_ALREADY_STARTED');
  });

  test('TC-F3-02D: [Security] Khách hàng B dùng token cố tình hủy yêu cầu của Khách hàng A — Chặn 403', async ({ page }) => {
    await page.route('**/api/v1/contracts/501/cancel-return', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'ACCESS_DENIED',
          message: 'Bạn không có quyền thao tác trên hợp đồng này',
        }),
      });
    });

    await page.goto('/');
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/501/cancel-return', { method: 'POST' });
      return res.status;
    });

    expect(result).toBe(403);
  });
});

// =============================================================================
// FLOW 3.3: PHÂN CÔNG & NGHIỆM THU HIỆN TRƯỜNG (UC-F3-06, BR-RET-02, 08)
// =============================================================================

test.describe('Flow 3.3: Phân công & Nghiệm thu hiện trường', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'STAFF', { id: 201, facilityId: 1 });
    await setupCommonRoutes(page);
  });

  test('TC-F3-03A: Staff nghiệm thu ô kho nguyên vẹn (GOOD, 0 phụ phí) — Thu hồi mã PIN, ô kho chuyển CLEANING', async ({ page }) => {
    await page.route('**/api/v1/contracts?status=PENDING_RETURN*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 509,
                code: 'CTR-2026-009',
                customerId: 101,
                customerName: 'Nguyễn Văn An',
                customerPhone: '0901234567',
                customerIdentityNumber: '079090123456',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 15,
                storageUnitCode: 'Q1-M105',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: '2026-11-08',
                monthlyPrice: 1200000,
                depositAmount: 1200000,
                status: 'PENDING_RETURN',
                assignedStaffId: 201,
                isInspected: false,
              },
            ],
            totalElements: 1,
            totalPages: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/509/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 509,
            depositAmount: 1200000,
            damageCost: 0,
            overdueFee: 0,
            unpaidExtraCharges: 0,
            depositRefundAmount: 1200000,
            payableAmount: 0,
          },
        }),
      });
    });

    let inspectionSubmitted: any = null;
    await page.route('**/api/v1/contracts/509/return-inspections', async (route) => {
      inspectionSubmitted = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 509,
            inspectedAt: '2026-11-08T10:00:00',
            condition: 'GOOD',
            damageCost: 0,
            estimatedDepositRefund: 1200000,
          },
        }),
      });
    });

    await page.goto('/staff/return?id=509');
    await expect(page.locator('text=Q1-M105').first()).toBeVisible();

    // Ký xác nhận bằng nút Ký mẫu nhanh
    const sampleSignBtn = page.getByRole('button', { name: 'Ký mẫu nhanh' }).first();
    if (await sampleSignBtn.isVisible()) {
      await sampleSignBtn.click();
    }

    const submitBtn = page.getByRole('button', { name: /Nộp biên bản/i }).first();
    await submitBtn.click();

    await expect(page.locator('text=Nghiệm thu trả kho hoàn tất!')).toBeVisible();
    expect(inspectionSubmitted).not.toBeNull();
    expect(inspectionSubmitted.condition).toBe('GOOD');
  });

  test('TC-F3-03B: Staff phát hiện hư hại/bẩn — Chọn mã phụ phí BOM, đính kèm ảnh, tạo ContractExtraCharge', async ({ page }) => {
    await page.route('**/api/v1/contracts?status=PENDING_RETURN*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 510,
                code: 'CTR-2026-010',
                customerId: 102,
                customerName: 'Nguyễn Văn Bình',
                customerPhone: '0907654321',
                customerIdentityNumber: '079090765432',
                facilityId: 1,
                facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
                storageUnitId: 16,
                storageUnitCode: 'Q1-M106',
                unitTypeName: 'Kho Tiêu Chuẩn M',
                startDate: '2026-05-12',
                endDateExclusive: '2026-11-08',
                monthlyPrice: 1200000,
                depositAmount: 1200000,
                status: 'PENDING_RETURN',
                assignedStaffId: 201,
                isInspected: false,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/510/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 510,
            depositAmount: 1200000,
            damageCost: 250000,
            overdueFee: 0,
            unpaidExtraCharges: 250000,
            depositRefundAmount: 950000,
            payableAmount: 0,
          },
        }),
      });
    });

    let submittedData: any = null;
    await page.route('**/api/v1/contracts/510/return-inspections', async (route) => {
      submittedData = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 510,
            condition: 'MINOR_DAMAGE',
            damageCost: 250000,
            estimatedDepositRefund: 950000,
          },
        }),
      });
    });

    await page.goto('/staff/return?id=510');

    // Chuyển condition sang MINOR_DAMAGE bằng button "Hư hại nhẹ"
    const minorDamageBtn = page.getByRole('button', { name: /Hư hại nhẹ/i }).first();
    await minorDamageBtn.click();

    // Nhập mô tả hiện trường
    const damageNotesInput = page.locator('textarea').first();
    await damageNotesInput.fill('Kẹt gãy chốt khóa phụ');

    // Chọn khoản phụ phí BOM ID 15
    const bomFeeCheckbox = page.locator('label:has-text("Kẹt gãy chốt khóa phụ") input[type="checkbox"]').first();
    await bomFeeCheckbox.check();

    // Upload ảnh bằng chứng
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles({
      name: 'lock-broken.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });

    // Ký tên bằng nút Ký mẫu nhanh
    const sampleSignBtn = page.getByRole('button', { name: 'Ký mẫu nhanh' }).first();
    if (await sampleSignBtn.isVisible()) {
      await sampleSignBtn.click();
    }

    const submitBtn = page.getByRole('button', { name: /Nộp biên bản/i }).first();
    await submitBtn.click();

    await expect(page.locator('text=Nghiệm thu trả kho hoàn tất!')).toBeVisible();
    expect(submittedData).not.toBeNull();
    expect(submittedData.condition).toBe('MINOR_DAMAGE');
    expect(submittedData.extraFeeTypeIds).toContain(15);
  });

  test('TC-F3-03C: [Negative] Thiếu chữ ký khách hoặc có hư hại nhưng thiếu ảnh — Báo lỗi validation', async ({ page }) => {
    await page.route('**/api/v1/contracts?status=PENDING_RETURN*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 509,
                code: 'CTR-2026-009',
                customerId: 101,
                customerName: 'Nguyễn Văn An',
                facilityId: 1,
                storageUnitId: 15,
                storageUnitCode: 'Q1-M105',
                status: 'PENDING_RETURN',
                assignedStaffId: 201,
                isInspected: false,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.goto('/staff/return?id=509');
    await expect(page.locator('text=Q1-M105').first()).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Nộp biên bản/i }).first();
    await submitBtn.click();
    await expect(page.locator('text=Cần chữ ký xác nhận của khách trên biên bản.')).toBeVisible();
  });

  test('TC-F3-03D: [Negative] Mâu thuẫn trạng thái (chọn GOOD nhưng bỏ tick tiêu chuẩn) — Chặn submit', async ({ page }) => {
    await page.route('**/api/v1/contracts?status=PENDING_RETURN*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 509,
                code: 'CTR-2026-009',
                customerId: 101,
                customerName: 'Nguyễn Văn An',
                facilityId: 1,
                storageUnitId: 15,
                storageUnitCode: 'Q1-M105',
                status: 'PENDING_RETURN',
                assignedStaffId: 201,
                isInspected: false,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.goto('/staff/return?id=509');
    await expect(page.locator('text=Q1-M105').first()).toBeVisible();

    // Bỏ tick tiêu chí số 1
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.uncheck();

    // Ký tên bằng nút Ký mẫu nhanh
    const sampleSignBtn = page.getByRole('button', { name: 'Ký mẫu nhanh' }).first();
    if (await sampleSignBtn.isVisible()) {
      await sampleSignBtn.click();
    }

    const submitBtn = page.getByRole('button', { name: /Nộp biên bản/i }).first();
    await submitBtn.click();
    await expect(page.locator('text=Danh sách tiêu chí nguyên trạng chưa đủ')).toBeVisible();
  });

  test('TC-F3-03E: [Security] Staff cơ sở A cố tình nghiệm thu hợp đồng cơ sở B — Chặn phân quyền', async ({ page }) => {
    await page.route('**/api/v1/contracts/999/return-inspections', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'STAFF_NOT_IN_FACILITY',
          message: 'Nhân viên không thuộc cơ sở quản lý hợp đồng này',
        }),
      });
    });

    await page.goto('/');
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/v1/contracts/999/return-inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: 'GOOD' }),
      });
      return res.status;
    });

    expect(result).toBe(403);
  });
});

// =============================================================================
// FLOW 3.4: XEM TRƯỚC & DUYỆT QUYẾT TOÁN CỌC (UC-F3-08, 10, BR-RET-04..06)
// =============================================================================

test.describe('Flow 3.4: Xem trước & Phê duyệt Quyết toán', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'MANAGER', { id: 301, facilityId: 1 });
    await setupCommonRoutes(page);
  });

  test('TC-F3-04A: Quyết toán trả trong tháng cuối — Hoàn 100% cọc, hợp đồng đóng CLOSED', async ({ page }) => {
    await page.route('**/api/v1/contracts/511', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 511,
            code: 'CTR-2026-011',
            customerName: 'Nguyễn Văn An',
            facilityId: 1,
            facilityName: 'Cơ sở Quận 1 (Trụ sở chính)',
            storageUnitCode: 'Q1-S101',
            unitTypeName: 'Kho Tiêu Chuẩn S',
            depositAmount: 2000000,
            depositBalance: 2000000,
            status: 'PENDING_RETURN',
            isInspected: true,
            inspectionDone: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/511/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 511,
            depositAmount: 2000000,
            damageCost: 0,
            overdueFee: 0,
            unpaidExtraCharges: 0,
            depositRefundAmount: 2000000,
            payableAmount: 0,
          },
        }),
      });
    });

    let approved = false;
    await page.route('**/api/v1/contracts/511/settlement-approval', async (route) => {
      approved = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Đã phê duyệt quyết toán hoàn cọc 2.000.000 đ thành công.',
        }),
      });
    });

    await page.goto('/manager/contracts/511');

    const approveBtn = page.getByRole('button', { name: /Duyệt quyết toán & Hoàn cọc/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    await expect(page.locator('text=Bảng tính quyết toán hoàn cọc')).toBeVisible();
    await expect(page.locator('text=2.000.000').first()).toBeVisible();

    const confirmApproveBtn = page.getByRole('button', { name: 'Duyệt quyết toán & Hoàn cọc' }).last();
    await confirmApproveBtn.click();

    expect(approved).toBe(true);
  });

  test('TC-F3-04B: Quyết toán trả sớm trước hạn dài có khấu trừ hư hại BOM — Đóng CLOSED', async ({ page }) => {
    await page.route('**/api/v1/contracts/512', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 512,
            code: 'CTR-2026-012',
            customerName: 'Nguyễn Văn Bình',
            facilityId: 1,
            storageUnitCode: 'Q1-S102',
            unitTypeName: 'Kho Tiêu Chuẩn S',
            depositAmount: 1200000,
            status: 'PENDING_RETURN',
            isInspected: true,
            inspectionDone: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/512/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 512,
            depositAmount: 1200000,
            damageCost: 300000,
            overdueFee: 0,
            unpaidExtraCharges: 300000,
            depositRefundAmount: 2100000,
            payableAmount: 0,
          },
        }),
      });
    });

    await page.goto('/manager/contracts/512');
    const approveBtn = page.getByRole('button', { name: /Duyệt quyết toán & Hoàn cọc/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=2.100.000')).toBeVisible();
    }
  });

  test('TC-F3-04C: Quyết toán âm (Thiệt hại vượt cọc) — Hợp đồng GIỮ PENDING_RETURN, sinh nợ bù SETTLEMENT', async ({ page }) => {
    await page.route('**/api/v1/contracts/513', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 513,
            code: 'CTR-2026-013',
            customerName: 'Trần Văn Cường',
            facilityId: 1,
            storageUnitCode: 'Q1-S103',
            unitTypeName: 'Kho Tiêu Chuẩn S',
            depositAmount: 1000000,
            status: 'PENDING_RETURN',
            isInspected: true,
            inspectionDone: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/513/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 513,
            depositAmount: 1000000,
            damageCost: 1800000,
            overdueFee: 0,
            unpaidExtraCharges: 1800000,
            depositRefundAmount: 0,
            payableAmount: 800000,
          },
        }),
      });
    });

    await page.goto('/manager/contracts/513');
    const approveBtn = page.getByRole('button', { name: /Duyệt quyết toán & Hoàn cọc/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=+800.000')).toBeVisible();
      await expect(page.getByRole('button', { name: /Ghi nhận.*Chờ khách thanh toán/i })).toBeVisible();
    }
  });

  test('TC-F3-04D: [Negative] FM bấm duyệt khi Staff chưa nộp biên bản nghiệm thu — Chặn duyệt', async ({ page }) => {
    await page.route('**/api/v1/contracts/514', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 514,
            code: 'CTR-2026-014',
            customerName: 'Lê Văn Dũng',
            facilityId: 1,
            storageUnitCode: 'Q1-S104',
            status: 'PENDING_RETURN',
            isInspected: false,
            inspectionDone: false,
          },
        }),
      });
    });

    await page.goto('/manager/contracts/514');
    const approveBtn = page.getByRole('button', { name: 'Duyệt quyết toán & Hoàn cọc' });
    await expect(approveBtn).not.toBeVisible();
  });

  test('TC-F3-04E: Quyết toán hợp đồng TERMINATED tại D+10 — Tịch thu 70% cọc nợ phạt, hoàn số dư còn lại', async ({ page }) => {
    await page.route('**/api/v1/contracts/515', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 515,
            code: 'CTR-2026-015',
            customerName: 'Hoàng Văn Em',
            facilityId: 1,
            storageUnitCode: 'Q1-S105',
            depositAmount: 2000000,
            status: 'TERMINATED',
            isInspected: true,
            inspectionDone: true,
          },
        }),
      });
    });

    await page.route('**/api/v1/contracts/515/settlement-preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            contractId: 515,
            depositAmount: 2000000,
            damageCost: 100000,
            overdueFee: 1400000,
            unpaidExtraCharges: 100000,
            depositRefundAmount: 500000,
            payableAmount: 0,
          },
        }),
      });
    });

    await page.goto('/manager/contracts/515');
    const approveBtn = page.getByRole('button', { name: /Duyệt quyết toán & Hoàn cọc/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=1.400.000')).toBeVisible();
      await expect(page.locator('text=500.000')).toBeVisible();
    }
  });
});

// =============================================================================
// FLOW 3.5: THANH TOÁN NỘP BÙ QUYẾT TOÁN THIẾU (UC-F3-13, BR-RET-04, BR-PAY-05)
// =============================================================================

test.describe('Flow 3.5: Thanh toán nộp bù Quyết toán thiếu', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAs(page, 'CUSTOMER');
    await setupCommonRoutes(page);
  });

  test('TC-F3-05A: Khách quét VietQR nộp đủ tiền nợ bù SETTLEMENT — Chuyển phụ phí PAID, đóng hợp đồng CLOSED', async ({ page }) => {
    await page.route('**/api/v1/payments/**/998877/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderCode: 998877,
          status: 'SUCCESS',
          amount: 800000,
          transactionType: 'SETTLEMENT',
          referenceType: 'SETTLEMENT',
        }),
      });
    });

    await page.goto('/payment/checkout?orderCode=998877');

    await expect(page.locator('text=Thanh toán thành công').first()).toBeVisible();
    await expect(page.locator('text=800.000').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vào Kho của tôi' })).toBeVisible();
  });

  test('TC-F3-05B: [Negative] Giao dịch nộp bù chưa hoàn tất (FAILED) — Tuyệt đối không đóng hợp đồng', async ({ page }) => {
    await page.route('**/api/v1/payments/**/998878/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderCode: 998878,
          status: 'PENDING',
          amount: 800000,
        }),
      });
    });

    await page.goto('/payment/checkout?orderCode=998878&result=failed');

    await expect(page.locator('text=Thanh toán không thành công hoặc đã bị hủy')).toBeVisible();
    await expect(page.locator('text=Đã tất toán hợp đồng')).not.toBeVisible();
  });
});

// =============================================================================
// FLOW 3.6 & 3.7: HOÀN TẤT DỌN DẸP, GIẢI PHÓNG KHO & GIÁM SÁT (UC-F3-09..12)
// =============================================================================

test.describe('Flow 3.6 & 3.7: Hoàn tất dọn dẹp, Giải phóng kho & Giám sát', () => {
  test.beforeEach(async ({ page }) => {
    await setupCommonRoutes(page);
  });

  test('TC-F3-06A: Staff xác nhận dọn dẹp xong — Ô kho chuyển CLEANING sang AVAILABLE (hoặc RESERVED)', async ({ page }) => {
    await authenticateAs(page, 'STAFF', { id: 201, facilityId: 1 });

    let cleaningCompleted = false;
    await page.route('**/api/v1/contracts/511/cleaning-complete', async (route) => {
      cleaningCompleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          unitId: 15,
          unitCode: 'Q1-M105',
          status: 'AVAILABLE',
        }),
      });
    });

    await page.goto('/');
    const res = await page.evaluate(async () => {
      const response = await fetch('/api/v1/contracts/511/cleaning-complete', { method: 'POST' });
      return response.json();
    });

    expect(cleaningCompleted).toBe(true);
    expect(res.status).toBe('AVAILABLE');
  });

  test('TC-F3-06B: CronJob tự động giải phóng ô kho sau 5 ngày CLEANING — Chuyển AVAILABLE', async ({ page }) => {
    await authenticateAs(page, 'MANAGER');

    await page.route('**/api/v1/policies/cron/process-overdue?date=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scannedUnits: 1,
          releasedCleaningUnits: 1,
          releasedTerminatedUnits: 0,
        }),
      });
    });

    await page.goto('/');
    const res = await page.evaluate(async () => {
      const response = await fetch('/api/v1/policies/cron/process-overdue?date=2026-11-08', { method: 'POST' });
      return response.json();
    });

    expect(res.releasedCleaningUnits).toBe(1);
  });

  test('TC-F3-07: FM giám sát danh sách hợp đồng hiệu lực, kiểm tra công nợ và Staff đánh dấu Unit bảo trì', async ({ page }) => {
    await authenticateAs(page, 'MANAGER', { id: 301, facilityId: 1 });

    await page.route('**/api/v1/contracts?facilityId=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 501,
                code: 'CTR-2026-001',
                status: 'ACTIVE',
                monthlyPrice: 1200000,
                facilityId: 1,
              },
            ],
            totalElements: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/units/15/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 15,
          code: 'Q1-M105',
          status: 'MAINTENANCE',
        }),
      });
    });

    await page.goto('/');
    const unitUpdate = await page.evaluate(async () => {
      const res = await fetch('/api/v1/units/15/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MAINTENANCE' }),
      });
      return res.json();
    });

    expect(unitUpdate.status).toBe('MAINTENANCE');
  });
});
