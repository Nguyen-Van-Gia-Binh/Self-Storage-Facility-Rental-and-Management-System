import { describe, it, expect } from 'vitest';
import { isStorageUnitAssigned } from '../unitAssignment';

describe('unitAssignment — isStorageUnitAssigned', () => {
  it('trả về true khi mã ô kho hợp lệ và cụ thể', () => {
    expect(isStorageUnitAssigned('Q7-S101')).toBe(true);
    expect(isStorageUnitAssigned('A-102')).toBe(true);
    expect(isStorageUnitAssigned('B203')).toBe(true);
    expect(isStorageUnitAssigned(' Ô 105 ')).toBe(true);
  });

  it('trả về false khi ô kho chưa được gán hoặc ở trạng thái chờ/tạm', () => {
    expect(isStorageUnitAssigned('Chưa gán ô')).toBe(false);
    expect(isStorageUnitAssigned('Chưa gán')).toBe(false);
    expect(isStorageUnitAssigned('Chưa chọn ô')).toBe(false);
    expect(isStorageUnitAssigned('Chua chon o')).toBe(false);
    expect(isStorageUnitAssigned('chua gan o')).toBe(false);
    expect(isStorageUnitAssigned('TBA')).toBe(false);
    expect(isStorageUnitAssigned('---')).toBe(false);
    expect(isStorageUnitAssigned('')).toBe(false);
    expect(isStorageUnitAssigned('   ')).toBe(false);
    expect(isStorageUnitAssigned(null)).toBe(false);
    expect(isStorageUnitAssigned(undefined)).toBe(false);
  });
});

