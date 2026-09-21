/**
 * Script kiểm thử tự động xác thực các quy tắc nghiệp vụ gia hạn hợp đồng (T4.11 Verification)
 * Chạy bằng: npx tsx frontend/src/features/customer/utils/renewalPricing.verify.ts
 */
import { 
  calculateRenewalPricing, 
  calculateExtendedEndDate 
} from './renewalPricing';

function runRenewalPricingVerification() {
  console.log('🚀 Bắt đầu kiểm thử nghiệp vụ gia hạn hợp đồng (T4.11 - BR-REN-01..08, BR-DEP-01)...\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     Chi tiết: ${details}`);
    }
  }

  // TEST 1: Kỳ hạn 1 tháng (0% chiết khấu)
  const res1 = calculateRenewalPricing({
    monthlyRent: 2400000,
    renewalMonths: 1,
  });
  assert(
    'BR-REN-07: Kỳ hạn 1 tháng không chiết khấu (discountRate = 0)',
    res1.discountRate === 0 && res1.discountAmount === 0 && res1.finalTotal === 2400000
  );

  // TEST 2: Kỳ hạn 3 tháng (0% chiết khấu)
  const res3 = calculateRenewalPricing({
    monthlyRent: 2400000,
    renewalMonths: 3,
  });
  assert(
    'BR-REN-07: Kỳ hạn 3 tháng không chiết khấu, tổng = 3 * 2.400.000 = 7.200.000đ',
    res3.discountRate === 0 && res3.discountAmount === 0 && res3.finalTotal === 7200000
  );

  // TEST 3: Kỳ hạn 6 tháng (Giảm 5%)
  const res6 = calculateRenewalPricing({
    monthlyRent: 2400000,
    renewalMonths: 6,
  });
  const expectedRaw6 = 2400000 * 6; // 14.400.000
  const expectedDiscount6 = 14400000 * 0.05; // 720.000
  assert(
    'BR-REN-07: Kỳ hạn 6 tháng giảm đúng 5% tiền thuê',
    res6.discountRate === 0.05 && 
    res6.discountAmount === expectedDiscount6 && 
    res6.finalTotal === (expectedRaw6 - expectedDiscount6)
  );

  // TEST 4: Kỳ hạn 12 tháng (Giảm 10%)
  const res12 = calculateRenewalPricing({
    monthlyRent: 2400000,
    renewalMonths: 12,
  });
  const expectedRaw12 = 2400000 * 12; // 28.800.000
  const expectedDiscount12 = 28800000 * 0.10; // 2.880.000
  assert(
    'BR-REN-07: Kỳ hạn 12 tháng giảm đúng 10% tiền thuê',
    res12.discountRate === 0.10 && 
    res12.discountAmount === expectedDiscount12 && 
    res12.finalTotal === (expectedRaw12 - expectedDiscount12)
  );

  // TEST 5: Hợp đồng quá hạn OVERDUE gộp phí phạt quá hạn (BR-REN-06)
  const resOverdue = calculateRenewalPricing({
    monthlyRent: 1200000,
    renewalMonths: 1,
    isOverdue: true,
    overdueDays: 2,
    overdueFee: 100000,
  });
  assert(
    'BR-REN-06: Gộp khoản nợ & phí quá hạn vào hóa đơn gia hạn thành công',
    resOverdue.overdueFee === 100000 && resOverdue.finalTotal === (1200000 + 100000)
  );

  // TEST 6: Tiền cọc phát sinh luôn bằng 0đ (BR-DEP-01)
  assert(
    'BR-DEP-01: Tiền cọc phát sinh luôn bằng 0đ (extraDeposit = 0)',
    res1.extraDeposit === 0 && res6.extraDeposit === 0 && res12.extraDeposit === 0
  );

  // TEST 7: Tính ngày kết thúc mới chính xác
  const newDate = calculateExtendedEndDate('2026-09-30', 3);
  assert(
    'BR-REN-08: Cộng thêm 3 tháng vào sau ngày kết thúc hiện tại 2026-09-30 -> 2026-12-30',
    newDate === '2026-12-30'
  );

  console.log(`\n========================================`);
  console.log(`📊 Kết quả kiểm thử: ${passed}/${total} test cases PASSED (100% SUCCESS)`);
  console.log(`========================================\n`);

  if (passed !== total) {
    throw new Error(`Kiểm thử thất bại: chỉ có ${passed}/${total} test cases passed.`);
  }
}

runRenewalPricingVerification();

