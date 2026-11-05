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

  it('UnitPickerPage đặt theo hạng kho và không gửi mã ô', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/handleProceedToBooking\s*=\s*async/);
    expect(content).toMatch(/type:\s*String\(selectedTypeId\)/);
    expect(content).toMatch(/startDate/);
    expect(content).toMatch(/months:\s*String\(durationMonths\)/);
    expect(content).not.toMatch(/unitNumber:\s*targetUnit/);
  });

  it('UnitPickerPage không còn bắt khách chọn ô trên sơ đồ', () => {
    const content = getUnitPickerContent();
    expect(content).not.toMatch(/Vui lòng chọn 1 ô kho/);
    expect(content).not.toMatch(/onSelectUnitOnGrid/);
  });
});
