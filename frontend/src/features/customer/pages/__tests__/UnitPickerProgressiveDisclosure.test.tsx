import { describe, it, expect } from 'vitest';
import { findFirstAvailableUnit } from '../../utils/pricing';

interface MockUnit {
  id: number;
  unitNumber: string;
  unitTypeId: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

describe('UnitPicker progressive disclosure helper', () => {
  const units: MockUnit[] = [
    { id: 1, unitNumber: 'Q1-A101', unitTypeId: 10, status: 'OCCUPIED' },
    { id: 2, unitNumber: 'Q1-A102', unitTypeId: 10, status: 'AVAILABLE' },
    { id: 3, unitNumber: 'Q1-A103', unitTypeId: 10, status: 'AVAILABLE' },
    { id: 4, unitNumber: 'Q1-B201', unitTypeId: 20, status: 'RESERVED' },
  ];

  it('chọn đúng ô trống đầu tiên của loại kho 10 (Q1-A102)', () => {
    const unit = findFirstAvailableUnit(10, units);
    expect(unit).not.toBeNull();
    expect(unit?.unitNumber).toBe('Q1-A102');
  });

  it('trả về null nếu loại kho không còn ô trống nào', () => {
    const unit = findFirstAvailableUnit(20, units);
    expect(unit).toBeNull();
  });
});
