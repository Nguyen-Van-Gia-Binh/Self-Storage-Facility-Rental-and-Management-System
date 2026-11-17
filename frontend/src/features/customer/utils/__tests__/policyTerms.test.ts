import { describe, it, expect } from 'vitest';
import { termMonthChoices, clampRenewalMonths } from '../policyTerms';

describe('policyTerms.termMonthChoices — giới hạn tối đa thẻ chọn nhanh 12 tháng', () => {
  it('không sinh thêm card cho các mốc > 12 tháng (VD: maxMonths = 180 hoặc 24)', () => {
    expect(termMonthChoices(1, 180)).toEqual([1, 3, 6, 12]);
    expect(termMonthChoices(1, 24)).toEqual([1, 3, 6, 12]);
    expect(termMonthChoices(3, 180)).toEqual([3, 6, 12]);
  });

  it('vẫn giữ đầy đủ các mốc <= 12 tháng nằm trong khoảng chính sách', () => {
    expect(termMonthChoices(1, 12)).toEqual([1, 3, 6, 12]);
    expect(termMonthChoices(1, 6)).toEqual([1, 3, 6]);
    expect(termMonthChoices(1, 9)).toEqual([1, 3, 6, 9]);
  });

  it('trả về danh sách rỗng nếu minMonths > 12 để khách nhập số tháng tùy chỉnh thay vì hiện card > 12', () => {
    expect(termMonthChoices(15, 180)).toEqual([]);
  });

  it('vẫn cho phép clampRenewalMonths chấp nhận số tháng tùy chỉnh > 12 trong giới hạn chính sách', () => {
    expect(clampRenewalMonths(180, 1, 180)).toBe(180);
    expect(clampRenewalMonths(200, 1, 180)).toBe(180);
  });
});
