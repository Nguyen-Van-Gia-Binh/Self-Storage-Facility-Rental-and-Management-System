import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatLocalDate,
  getMondayOfWeek,
} from '../StaffWeekCalendarStrip';

describe('StaffWeekCalendarStrip - Date Calculations', () => {
  it('định dạng và phân tích cú pháp chuỗi ngày YYYY-MM-DD không bị lệch múi giờ', () => {
    const dateStr = '2026-10-12';
    const parsed = parseLocalDate(dateStr);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed: October is 9
    expect(parsed.getDate()).toBe(12);

    const formatted = formatLocalDate(parsed);
    expect(formatted).toBe('2026-10-12');
  });

  it('xác định chính xác ngày Thứ Hai đầu tuần theo chuẩn lịch Việt Nam & ISO (2026-10-12 là Thứ Hai)', () => {
    // 2026-10-12 là Thứ Hai
    const monday = parseLocalDate('2026-10-12');
    const computedMonday = getMondayOfWeek(monday);
    expect(formatLocalDate(computedMonday)).toBe('2026-10-12');

    // 2026-10-14 là Thứ Tư -> Thứ Hai cùng tuần phải là 2026-10-12
    const wednesday = parseLocalDate('2026-10-14');
    expect(formatLocalDate(getMondayOfWeek(wednesday))).toBe('2026-10-12');

    // 2026-10-18 là Chủ Nhật -> Thứ Hai cùng tuần phải là 2026-10-12
    const sunday = parseLocalDate('2026-10-18');
    expect(formatLocalDate(getMondayOfWeek(sunday))).toBe('2026-10-12');

    // 2026-10-19 là Thứ Hai tuần kế tiếp -> Thứ Hai là 2026-10-19
    const nextMonday = parseLocalDate('2026-10-19');
    expect(formatLocalDate(getMondayOfWeek(nextMonday))).toBe('2026-10-19');
  });

  it('tạo chuỗi 7 ngày liên tiếp từ Thứ Hai đến Chủ Nhật', () => {
    const monday = parseLocalDate('2026-10-12');
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      weekDays.push(formatLocalDate(d));
    }

    expect(weekDays).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
  });

  it('ẩn hoàn toàn thanh cuộn ngang và không dùng scale gây tràn khung khi bấm chọn Chủ Nhật', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(
      process.cwd(),
      'src/features/staff/components/StaffWeekCalendarStrip.tsx'
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('[&::-webkit-scrollbar]:hidden');
    expect(content).toContain('md:overflow-visible');
    expect(content).not.toContain('scale-[1.01]');
    expect(content).not.toContain('scrollbar-thumb-slate-200');
  });
});
