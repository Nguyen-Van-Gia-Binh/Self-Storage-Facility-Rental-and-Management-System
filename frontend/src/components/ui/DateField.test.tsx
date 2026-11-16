import { describe, expect, it } from 'vitest';
import { parseVnDate, toVnDate } from './DateField';

describe('ngày Việt Nam', () => {
  it('đổi 16/11/2026 thành 2026-11-16', () => {
    expect(parseVnDate('16/11/2026')).toBe('2026-11-16');
  });

  it('từ chối 11/16/2026 vì tháng 16 không có', () => {
    expect(parseVnDate('11/16/2026')).toBeNull();
  });

  it('in 2026-11-16 thành 16/11/2026', () => {
    expect(toVnDate('2026-11-16')).toBe('16/11/2026');
  });
});
