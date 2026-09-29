/** Kỳ hạn khách được chọn: giữ 1, 3, 6, 12 nếu nằm trong khoảng chính sách, luôn có mốc tối đa. */
export function termMonthChoices(minMonths?: number | null, maxMonths?: number | null): number[] {
  const min = Math.max(1, Number(minMonths) || 1);
  const max = Math.max(min, Number(maxMonths) || min);
  const anchors = [1, 3, 6, 12].filter((months) => months >= min && months <= max);
  const months = anchors.includes(max) ? [...anchors] : [...anchors, max];
  return months.length > 0 ? months : [max];
}

export function parseReminderDays(raw?: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((day) => Number.isFinite(day) && day > 0);
}

export function discountTag(months: number, style: 'save' | 'reduce' = 'save'): string | null {
  if (months >= 12) return style === 'save' ? 'Tiết kiệm 10%' : 'Giảm 10%';
  if (months >= 6) return style === 'save' ? 'Tiết kiệm 5%' : 'Giảm 5%';
  if (months === 3) return 'Phổ biến';
  return null;
}

export function shouldRemindRenewal(daysRemaining: number, noticeDays: number, reminderDays: number[]): boolean {
  if (daysRemaining < 0) return false;
  if (noticeDays > 0 && daysRemaining >= noticeDays && daysRemaining <= noticeDays + 7) return true;
  return reminderDays.includes(daysRemaining);
}
