const MAX_PRESET_CARD_MONTHS = 12;

/** Kỳ hạn thẻ chọn nhanh: giữ 1, 3, 6, 12 trong khoảng chính sách, chỉ hiện tối đa đến 12 tháng. */
export function termMonthChoices(minMonths?: number | null, maxMonths?: number | null): number[] {
  const min = Math.max(1, Number(minMonths) || 1);
  const max = Math.max(min, Number(maxMonths) || min);
  if (min > MAX_PRESET_CARD_MONTHS) return [];
  const effectiveMax = Math.min(max, MAX_PRESET_CARD_MONTHS);
  const anchors = [1, 3, 6, 12].filter((months) => months >= min && months <= effectiveMax);
  if (max <= MAX_PRESET_CARD_MONTHS && !anchors.includes(max)) {
    return [...anchors, max];
  }
  return anchors;
}

/** Kẹp số tháng gia hạn vào khoảng chính sách. Rỗng hoặc không phải số thì về min. */
export function clampRenewalMonths(
  value: number,
  minMonths?: number | null,
  maxMonths?: number | null,
): number {
  const min = Math.max(1, Number(minMonths) || 1);
  const max = Math.max(min, Number(maxMonths) || min);
  const whole = Math.trunc(Number(value));
  if (!Number.isFinite(whole)) return min;
  return Math.min(max, Math.max(min, whole));
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
