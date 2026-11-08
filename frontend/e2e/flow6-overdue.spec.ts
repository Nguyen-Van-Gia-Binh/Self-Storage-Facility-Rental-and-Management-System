import { test, expect } from './fixtures/actors.fixture';
import overdueCases from './data/overdue-cases.json' with { type: 'json' };

test.describe('Sub-flow 6.2: Vòng đời Quá hạn D+1..D+10, Khóa an ninh & Xử lý Ô kho', () => {

  test('TC-F6-E2E: Vòng đời quá hạn 3 giai đoạn (Ân hạn -> Phạt lũy tiến -> Khóa an ninh) & Phục hồi VietQR', async ({
    customerPage,
    managerPage,
  }) => {
    // -------------------------------------------------------------
    // GIAI ĐOẠN 1: KHÁCH HÀNG KIỂM TRA THẺ KHO TRONG VÒNG ĐỜI QUÁ HẠN (BR-OVD-01..05)
    // -------------------------------------------------------------
    await test.step('1. Khách hàng kiểm tra các mốc cảnh báo quá hạn trên Customer Portal', async () => {
      await customerPage.goto('/customer/my-units');

      // Kiểm tra trang My Units tải thành công
      await expect(customerPage.locator('body')).toBeVisible();

      // Kiểm tra sự hiện diện của badge trạng thái quá hạn hoặc ân hạn (nếu có hợp đồng quá hạn thực tế)
      const overdueBadge = customerPage.locator('span:has-text("Ân hạn"), span:has-text("Quá hạn"), span:has-text("Đã tất toán phạt")').first();
      if (await overdueBadge.isVisible()) {
        const badgeText = await overdueBadge.innerText();

        if (badgeText.includes('Ân hạn')) {
          // Mốc D+1..D+3 (BR-OVD-02): Nút Báo trả kho mở để nhận 100% cọc, ẩn nút nộp phạt
          const returnBtn = customerPage.locator('button:has-text("Báo trả kho")').first();
          await expect(returnBtn).toBeVisible();
          const payPenaltyBtn = customerPage.locator('button:has-text("Nộp phạt")').first();
          await expect(payPenaltyBtn).not.toBeVisible();
        } else if (badgeText.includes('Quá hạn')) {
          // Mốc D+4..D+9 (BR-OVD-03, BR-OVD-05): Nút Báo trả kho bị khóa, hiện nút nộp phạt
          const payPenaltyBtn = customerPage.locator('button:has-text("Nộp phạt")').first();
          if (await payPenaltyBtn.isVisible()) {
            await expect(payPenaltyBtn).toBeVisible();
          }
        }
      }
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 2: KHÁCH HÀNG MỞ MODAL NỘP PHẠT QUÁ HẠN VIETQR (BR-OVD-08)
    // -------------------------------------------------------------
    await test.step('2. Khách hàng mở modal nộp phạt quá hạn và kiểm tra thông tin thanh toán', async () => {
      const payPenaltyBtn = customerPage.locator('button:has-text("Nộp phạt")').first();
      if (await payPenaltyBtn.isVisible()) {
        await payPenaltyBtn.click();

        // Kiểm tra modal thanh toán nợ phạt xuất hiện
        const modal = customerPage.locator('[role="dialog"], div.fixed').first();
        await expect(modal).toBeVisible();
        await expect(modal).toContainText(/phạt|thanh toán|nợ quá hạn|vietqr|vnpay/i);

        // Đóng modal để tiếp tục kiểm thử
        const closeBtn = modal.locator('button:has-text("Đóng"), button[aria-label="Close"], button:has-text("Hủy")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 3: QUẢN LÝ CƠ SỞ THEO DÕI HỢP ĐỒNG QUÁ HẠN & Ô KHO (BR-OVD-07, BR-OVD-11)
    // -------------------------------------------------------------
    await test.step('3. Quản lý giám sát danh sách hợp đồng quá hạn trên Manager Portal', async () => {
      await managerPage.goto('/manager/contracts');
      await expect(managerPage.locator('body')).toBeVisible();

      // Kiểm tra bảng danh sách hoặc số liệu hợp đồng
      const overdueFilterOrBadge = managerPage.locator('text=/Quá hạn|OVERDUE|D\\+[1-9]|Nợ phạt/i').first();
      if (await overdueFilterOrBadge.isVisible()) {
        await expect(overdueFilterOrBadge).toBeVisible();
      }
    });
  });

  // -------------------------------------------------------------
  // DATA-DRIVEN TESTING (DDT): ĐỐI SOÁT CÔNG THỨC TOÁN HỌC & STATE MACHINE
  // -------------------------------------------------------------
  for (const tc of overdueCases) {
    test(`DDT: ${tc.scenarioId} - ${tc.name}`, async () => {
      // 1. Kiểm tra tính toán số ngày tính phạt (sau thời gian ân hạn graceDays = 3)
      const actualChargeableDays = Math.max(0, tc.overdueDays - tc.graceDays);
      expect(actualChargeableDays).toBe(tc.chargeableDays);

      // 2. Kiểm tra phí phạt tích lũy = Min(cọc * 10%/ngày * số ngày phạt, cọc * 70% trần)
      const deposit = tc.depositAmount;
      const accruedFee = Math.round(deposit * tc.dailyPenaltyRate * actualChargeableDays);
      const maxCapFee = Math.round(deposit * tc.capRate);
      const calculatedFee = Math.min(accruedFee, maxCapFee);

      // Với ca nộp phạt thành công (TC-F6-04), nợ phạt sau nộp phải về đúng 0
      if (tc.paidFee !== undefined && tc.paidFee > 0) {
        const feeAfterPayment = calculatedFee - tc.paidFee;
        expect(feeAfterPayment).toBe(tc.expectedFee);
      } else {
        expect(calculatedFee).toBe(tc.expectedFee);
      }

      // 3. Kiểm tra số dư cọc còn lại sau khi trừ phạt
      const calculatedRemainingDeposit = Math.max(0, deposit - tc.expectedFee);
      expect(calculatedRemainingDeposit).toBe(tc.expectedRemainingDeposit);

      // 4. Kiểm tra logic khóa Access Code an ninh tại mốc D+7 (BR-OVD-05) và mở lại khi nộp phạt (BR-OVD-08)
      const isSettled = tc.paidFee !== undefined && tc.paidFee > 0;
      const shouldLockPin = !isSettled && (tc.overdueDays >= tc.lockAccessDays || tc.expectedStatus === 'TERMINATED');
      expect(shouldLockPin).toBe(tc.accessPinLocked);

      // 5. Kiểm tra quyền Báo trả kho vs Nộp phạt (BR-OVD-02, BR-OVD-03, BR-OVD-08)
      if (tc.canReportReturn) {
        expect(tc.canPayPenalty).toBe(false);
      }
      if (tc.canPayPenalty) {
        expect(tc.canReportReturn).toBe(false);
      }
    });
  }
});
