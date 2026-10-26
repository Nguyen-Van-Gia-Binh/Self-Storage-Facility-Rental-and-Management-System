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
  const modalsPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/UnitPickerModals.tsx'
  );
  const catalogHook = path.resolve(
    process.cwd(),
    'src/features/customer/hooks/useUnitPickerCatalog.ts'
  );
  const getUnitPickerContent = () => {
    let content = fs.readFileSync(unitPickerPage, 'utf-8');
    if (fs.existsSync(modalsPath)) {
      content += '\n' + fs.readFileSync(modalsPath, 'utf-8');
    }
    if (fs.existsSync(catalogHook)) {
      content += '\n' + fs.readFileSync(catalogHook, 'utf-8');
    }
    return content;
  };

  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );

  it('UnitPickerPage không còn fallback ngầm sang facList[0] (Thanh Xuân)', () => {
    const content = getUnitPickerContent();
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
});
