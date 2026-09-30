export const FEE_CATEGORIES = [
  { value: 'ACCESS_KEY', label: 'Cấp lại khóa cơ' },
  { value: 'CLEANING', label: 'Vệ sinh khi trả kho' },
  { value: 'DAMAGE', label: 'Bồi thường hư hại' },
  { value: 'VALUE_ADDED', label: 'Tiện ích bổ sung' },
] as const;

export type FeeCategory = (typeof FEE_CATEGORIES)[number]['value'];

export function feeCategoryLabel(category?: string | null): string {
  return FEE_CATEGORIES.find((item) => item.value === category)?.label ?? 'Chưa phân nhóm';
}

/** Nhãn danh mục khi chưa có đơn giá hợp đồng: số cố định hoặc tỷ lệ, không nhân với 0. */
export function catalogFeePriceLabel(fee: { type?: string; amount: number }): string {
  if (fee.type === 'PERCENTAGE') {
    return `${fee.amount}% đơn giá tháng`;
  }
  return `${fee.amount.toLocaleString('vi-VN')} đ`;
}

/** Số tiền một lần: FIXED giữ nguyên, PERCENTAGE là phần trăm của đơn giá tháng snapshot. */
export function catalogLineAmount(
  fee: { type?: string; amount: number },
  monthlyPrice: number,
): number {
  if (fee.type === 'PERCENTAGE') {
    const raw = Math.max(0, monthlyPrice) * (fee.amount / 100);
    return Math.round(raw / 1000) * 1000;
  }
  return fee.amount;
}
