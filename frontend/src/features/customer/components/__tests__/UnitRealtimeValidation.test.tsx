/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-76: Kiểm tra tính sẵn sàng thời gian thực từ database khi xác nhận ô kho
 * Người thực hiện: Nhi
 */
describe('ISS-76: Realtime Database Unit Availability Validation on Confirm', () => {
  const unitPickerPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/UnitPickerPage.tsx'
  );
  const unitGrid = path.resolve(
    process.cwd(),
    'src/features/customer/components/UnitGrid.tsx'
  );

  it('UnitGrid hỗ trợ prop isConfirming và hiển thị loading spinner khi đang kiểm tra database', () => {
    const content = fs.readFileSync(unitGrid, 'utf-8');
    expect(content).toMatch(/isConfirming\?: boolean/);
    expect(content).toMatch(/Đang kiểm tra ô kho\.\.\./);
    expect(content).toMatch(/disabled=\{!activeSelectedUnit\.monthlyPrice.*\|\|\s*isConfirming\}/);
  });

  it('UnitPickerPage gọi fetchStorageUnitsApi trong handleProceedToBooking để kiểm tra database thời gian thực', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).toMatch(/handleProceedToBooking\s*=\s*async/);
    expect(content).toMatch(/fetchStorageUnitsApi\(fId,\s*\{\s*startDate,\s*rentalMonths:\s*durationMonths/);
    expect(content).toMatch(/unitUnavailableModal/);
  });

  it('UnitPickerPage hiển thị modal cảnh báo khi ô kho bị bảo trì hoặc đã có người khác đặt/thuê', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).toMatch(/Ô kho đang tạm ngừng hoạt động \/ Bảo trì/);
    expect(content).toMatch(/Ô kho đã có người giữ chỗ/);
    expect(content).toMatch(/Ô kho đã có người thuê/);
    expect(content).toMatch(/Đã hiểu, chọn ô kho khác/);
  });
});
