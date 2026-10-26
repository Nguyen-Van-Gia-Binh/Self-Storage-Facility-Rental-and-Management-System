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
  const modalsPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/UnitPickerModals.tsx'
  );
  const getUnitPickerContent = () => {
    return fs.existsSync(modalsPath)
      ? fs.readFileSync(unitPickerPage, 'utf-8') + '\n' + fs.readFileSync(modalsPath, 'utf-8')
      : fs.readFileSync(unitPickerPage, 'utf-8');
  };

  it('UnitPickerPage gọi fetchStorageUnitsApi trong handleProceedToBooking để kiểm tra database thời gian thực', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/handleProceedToBooking\s*=\s*async/);
    expect(content).toMatch(/fetchStorageUnitsApi\(fId,\s*\{\s*startDate,\s*rentalMonths:\s*durationMonths/);
    expect(content).toMatch(/unitUnavailableModal/);
  });

  it('UnitPickerPage hiển thị modal cảnh báo khi ô kho bị bảo trì hoặc đã có người khác đặt/thuê', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/Ô kho đang tạm ngừng hoạt động \/ Bảo trì/);
    expect(content).toMatch(/Ô kho đã có người giữ chỗ/);
    expect(content).toMatch(/Ô kho đã có người thuê/);
    expect(content).toMatch(/Đã hiểu, chọn ô kho khác/);
  });
});
