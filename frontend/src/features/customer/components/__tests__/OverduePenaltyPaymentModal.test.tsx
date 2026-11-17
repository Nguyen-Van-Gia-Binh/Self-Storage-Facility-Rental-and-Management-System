// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OverduePenaltyPaymentModal } from '../OverduePenaltyPaymentModal';
import * as paymentApi from '@/api/payment';

vi.mock('@/api/payment', () => ({
  createCheckout: vi.fn(),
  pollPaymentStatus: vi.fn(),
}));

describe('OverduePenaltyPaymentModal — Chuẩn Fintech UI/UX (Xóa Dev Tools & Nút Thanh toán VNPay chủ động)', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/OverduePenaltyPaymentModal.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentApi.createCheckout).mockResolvedValue({
      orderCode: 990011,
    } as any);
    vi.mocked(paymentApi.pollPaymentStatus).mockResolvedValue({
      status: 'PENDING',
    } as any);
  });

  it('Lỗi 1, 2 & 3 (Code): bỏ header đen Navy, bỏ khối nền đỏ chót, bỏ công cụ Giả lập/Thẻ test và bỏ nút Kiểm tra trạng thái thủ công', () => {
    const content = fs.readFileSync(modalPath, 'utf-8');
    expect(content).not.toContain('from-[#0a1614]');
    expect(content).not.toContain('bg-rose-50 border border-rose-200');
    expect(content).not.toContain('Giả lập');
    expect(content).not.toContain('Thẻ test');
    expect(content).not.toContain('Kiểm tra trạng thái ngay');
    expect(content).toContain('border-l-4 border-amber-500');
    expect(content).toContain('Thanh toán qua VNPay');
  });

  it('Lỗi 4 & Render: hiển thị Header trắng sạch, 2 radio phương thức VNPay, tổng tiền nổi bật sát nút Thanh toán qua VNPay', async () => {
    render(
      <OverduePenaltyPaymentModal
        isOpen={true}
        onClose={vi.fn()}
        onPaymentSuccess={vi.fn()}
        unitNumber="Q1-XS101"
        facilityName="Cơ sở Quận 1 - TP.HCM"
        totalAmount={350000}
        contractId={9006}
      />
    );

    expect(screen.getByText('Đóng phí quá hạn & Mở khóa PIN')).toBeInTheDocument();
    expect(screen.getByText(/Q1-XS101/)).toBeInTheDocument();
    expect(screen.getByText(/Tổng cần thanh toán:/i)).toBeInTheDocument();

    // 2 phương thức radio phẳng
    const atmRadio = screen.getByLabelText(/Thẻ ATM \/ Tài khoản nội địa/i) as HTMLInputElement;
    const intlRadio = screen.getByLabelText(/Thẻ Quốc tế/i) as HTMLInputElement;
    expect(atmRadio.checked).toBe(true);
    expect(intlRadio.checked).toBe(false);

    fireEvent.click(intlRadio);
    expect(intlRadio.checked).toBe(true);

    // Không có công cụ dev/test hay nút Kiểm tra thủ công
    expect(screen.queryByText(/Giả lập/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thẻ test/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kiểm tra trạng thái/i)).not.toBeInTheDocument();

    // Nút hành động chính là Thanh toán qua VNPay (active sau khi khởi tạo orderCode)
    await waitFor(() => {
      const payBtn = screen.getByRole('button', { name: /Thanh toán qua VNPay/i });
      expect(payBtn).not.toBeDisabled();
      expect(payBtn.className).toContain('bg-brand-600');
    });
  });
});
