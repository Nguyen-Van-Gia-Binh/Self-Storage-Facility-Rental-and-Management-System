/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-75: Xử lý cảnh báo & điều hướng khi Cơ sở / Ô kho bị ngừng hoạt động
 * Người thực hiện: Nhi
 */
describe('ISS-75: Xử lý Cảnh báo & Điều hướng khi Cơ sở/Ô kho ngừng hoạt động', () => {
  const unitPickerPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/UnitPickerPage.tsx'
  );
  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );
  const facilityDetailPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/FacilityDetailPage.tsx'
  );
  const unitTypeCard = path.resolve(
    process.cwd(),
    'src/features/customer/components/UnitTypeCard.tsx'
  );

  it('UnitPickerPage không còn fallback ngầm sang facList[0] (Thanh Xuân)', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).not.toMatch(/matchedFac\s*=\s*facList\.find\([^)]+\)\s*\|\|\s*facList\[0\]/);
    expect(content).toMatch(/facilityInactiveModalOpen/);
    expect(content).toMatch(/Cơ sở tạm ngừng hoạt động/);
    expect(content).toMatch(/\/customer/);
  });

  it('BookingPage không còn fallback ngầm sang facList[0] và có Modal cảnh báo cơ sở/ô kho ngừng hoạt động', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).not.toMatch(/matched\s*=\s*facList\.find\([^)]+\)\s*\|\|\s*facList\[0\]/);
    expect(content).toMatch(/unavailableModal/);
    expect(content).toMatch(/isFacilityInactive/);
    expect(content).toMatch(/isUnitUnavailable/);
    expect(content).toMatch(/Cơ sở lưu trữ tạm ngừng hoạt động/);
  });

  it('FacilityDetailPage chặn đặt chỗ khi cơ sở ngừng hoạt động và không hardcode mã cơ sở', () => {
    const content = fs.readFileSync(facilityDetailPage, 'utf-8');
    expect(content).not.toMatch(/FAC-D7-01/);
    expect(content).toMatch(/isFacilityActive=\{facility\.isActive\}/);
    expect(content).toMatch(/Cơ sở hiện đang tạm ngừng hoạt động/);
  });

  it('UnitTypeCard hỗ trợ prop isFacilityActive và vô hiệu hóa nút đặt khi cơ sở inactive', () => {
    const content = fs.readFileSync(unitTypeCard, 'utf-8');
    expect(content).toMatch(/isFacilityActive/);
    expect(content).toMatch(/Tạm ngưng nhận đặt/);
    expect(content).toMatch(/disabled=\{!isFacilityActive\}/);
  });
});
