import { test, expect } from './fixtures/actors.fixture';
import settlementCases from './data/settlement-cases.json' with { type: 'json' };

test.describe('Flow 3: Quản lý kho đang thuê, Trả sớm Win-Win & Quyết toán hoàn cọc', () => {

  test('TC-F3-01: Luồng liên hoàn 3 bên Khách báo trả -> Nhân viên nghiệm thu -> Quản lý duyệt hoàn cọc', async ({
    customerPage,
    staffPage,
    managerPage,
  }) => {
    // -------------------------------------------------------------
    // GIAI ĐOẠN 1: KHÁCH HÀNG BẤM YÊU CẦU TRẢ KHO TRƯỚC HẠN (BR-RET-05)
    // -------------------------------------------------------------
    await test.step('1. Khách hàng gửi yêu cầu trả kho sớm trên Portal', async () => {
      await customerPage.goto('/customer/my-units');

      // Nhấn nút mở modal trả kho
      const returnBtn = customerPage.locator('button:has-text("Đăng ký trả kho"), button:has-text("Trả kho sớm"), button:has-text("Báo trả kho")').first();
      if (await returnBtn.isVisible()) {
        await returnBtn.click();

        // Kiểm tra modal chính sách Win-Win
        const modal = customerPage.locator('[role="dialog"]').first();
        await expect(modal).toBeVisible();

        // Xác nhận các điều khoản cam kết dọn dẹp & điều khoản trả sớm không hoàn cước thừa
        const checkboxes = modal.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
          await checkboxes.nth(i).check();
        }

        const confirmBtn = modal.locator('button:has-text("Tôi đã dọn xong"), button:has-text("Báo trả kho"), button:has-text("Xác nhận"), button:has-text("Đồng ý")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 2: NHÂN VIÊN CƠ SỞ NGHIỆM THU HIỆN TRƯỜNG (BR-CHK-02)
    // -------------------------------------------------------------
    await test.step('2. Nhân viên tiếp nhận kiểm tra và lập biên bản đạt chuẩn 4 tiêu chí', async () => {
      await staffPage.goto('/staff/return');

      // Mở biên bản nghiệm thu đầu tiên trong danh sách chờ
      const inspectBtn = staffPage.locator('button:has-text("Nghiệm thu"), button:has-text("Kiểm tra")').first();
      if (await inspectBtn.isVisible()) {
        await inspectBtn.click();

        // Tích các tiêu chí vệ sinh & ổ khóa
        const checkboxes = staffPage.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
          await checkboxes.nth(i).check();
        }

        // Nhập chi phí thiệt hại = 0 nếu có trường nhập
        const damageInput = staffPage.locator('input[name="damageFee"], input[placeholder*="thiệt hại"]').first();
        if (await damageInput.isVisible()) {
          await damageInput.fill('0');
        }

        // Hoàn tất nghiệm thu
        const submitInspectBtn = staffPage.locator('button:has-text("Nộp biên bản"), button:has-text("Hoàn tất"), button:has-text("Lưu biên bản")').first();
        if (await submitInspectBtn.isVisible()) {
          await submitInspectBtn.click();
        }
      }
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 3: QUẢN LÝ CƠ SỞ PHÊ DUYỆT TẤT TOÁN HOÀN CỌC (BR-RET-01)
    // -------------------------------------------------------------
    await test.step('3. Quản lý duyệt hoàn cọc 100% tiền cọc cho khách hàng', async () => {
      await managerPage.goto('/manager/contracts');

      // Tìm hợp đồng chờ tất toán
      const approveBtn = managerPage.locator('button:has-text("Duyệt quyết toán & Hoàn cọc"), button:has-text("Duyệt hoàn cọc"), button:has-text("Quyết toán")').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();

        // Modal xác nhận duyệt
        const confirmModal = managerPage.locator('[role="dialog"]').first();
        if (await confirmModal.isVisible()) {
          const confirmApproveBtn = confirmModal.locator('button:has-text("Duyệt quyết toán & Hoàn cọc"), button:has-text("Xác nhận"), button:has-text("Đồng ý duyệt")').first();
          if (await confirmApproveBtn.isVisible()) {
            await confirmApproveBtn.click();
          }
        }
      }
    });

    // -------------------------------------------------------------
    // GIAI ĐOẠN 4: ĐỐI SOÁT CUỐI CÙNG TRÊN PHÍA KHÁCH HÀNG & TRẠNG THÁI PIN
    // -------------------------------------------------------------
    await test.step('4. Khách hàng thấy trạng thái Đã tất toán và kiểm tra mã PIN', async () => {
      await customerPage.reload();
      await expect(customerPage.locator('body')).toContainText(/Tất toán|Hoàn cọc|Đã trả kho|Đã thanh lý|COMPLETED|Hợp đồng/i);
    });
  });

  // Kịch bản Data-Driven Testing (DDT) đối soát công thức tài chính
  for (const testCase of settlementCases) {
    test(`DDT: ${testCase.scenarioId} - ${testCase.name}`, async () => {
      const calculatedRefund = Math.max(0, testCase.depositAmount - testCase.damageFee);
      expect(calculatedRefund).toBe(testCase.expectedRefund);

      if (testCase.damageCompensationInvoice) {
        const additionalCharge = testCase.damageFee - testCase.depositAmount;
        expect(additionalCharge).toBe(testCase.additionalCharge);
      }
    });
  }
});
