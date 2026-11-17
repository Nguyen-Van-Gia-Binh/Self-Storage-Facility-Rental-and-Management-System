// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettlementApprovalModal } from '../SettlementApprovalModal';
import * as contractApi from '@/api/contract';
import type { ManagerContractItem } from '@/types/contractManager';

vi.mock('@/api/contract', () => ({
  getSettlementPreview: vi.fn(),
  approveSettlementRefund: vi.fn(),
}));

const mockContract: ManagerContractItem = {
  id: 9022,
  code: 'CTR-TEST-022',
  status: 'CANCELLED',
  facilityId: 5,
  facilityName: 'Cơ sở Quận 1',
  customerName: 'Yoo Na',
  customerPhone: '0901234567',
  storageUnitCode: 'Q1-A301',
  unitTypeName: 'Kho Tiêu Chuẩn S',
  monthlyPrice: 750000,
  rentalMonths: 3,
  startDate: '2026-11-25',
  endDate: '2027-02-25',
  depositAmount: 750000,
  totalRentalFee: 2250000,
  totalPaid: 3000000,
};

describe('SettlementApprovalModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading indicator while preview is in flight and disables submit button', async () => {
    // Return a pending promise that does not resolve immediately
    let resolvePromise: (val: any) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(contractApi.getSettlementPreview).mockReturnValue(pendingPromise as any);

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Đang đối soát & nạp dữ liệu quyết toán/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Đang nạp bảng tính/i });
    expect(submitBtn).toBeDisabled();

    // Clean up
    resolvePromise({
      contractId: 9022,
      settlementType: 'CANCELLED_CHECKIN',
      depositAmount: 750000,
      totalRentalFee: 2250000,
      depositForfeited: 0,
      depositRefundAmount: 3000000,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 2250000,
      earlyReturn: false,
    });
  });

  it('renders error alert with retry button when preview fails, and keeps submit button disabled', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockRejectedValue(new Error('Máy chủ đang bận'));

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Máy chủ đang bận')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Thử tải lại bảng quyết toán/i })).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Chốt tất toán & Đóng HĐ/i });
    expect(submitBtn).toBeDisabled();
  });

  it('renders calculation accurately when preview succeeds and enables approve button', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'CANCELLED_CHECKIN',
      depositAmount: 750000,
      totalRentalFee: 2250000,
      depositForfeited: 0,
      depositRefundAmount: 3000000,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 2250000,
      earlyReturn: false,
    });

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Bảng quyết toán hủy nhận kho trước bàn giao/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/Hủy trước ≥ 7 ngày — Không phạt/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\.000\.000 đ/).length).toBeGreaterThan(0);

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('renders EARLY_RETURN case correctly with earlyRentRefund and deposit forfeiture (BR-RET-06)', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'EARLY_RETURN',
      depositAmount: 1000000,
      totalRentalFee: 3000000,
      depositForfeited: 1000000,
      depositRefundAmount: 400000,
      payableAmount: 0,
      damageCost: 100000,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 500000,
      unusedDays: 15,
      earlyReturn: true,
    });

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Bảng quyết toán trả kho sớm/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Trả kho sớm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tiền thuê ngày chưa sử dụng/i)).toBeInTheDocument();
    expect(screen.getByText(/Phạt vi phạm trả kho sớm/i)).toBeInTheDocument();
    expect(screen.getByText('400.000 đ')).toBeInTheDocument();

    // Không dùng số thứ tự 1., 2. hay gạch ngang line-through trong bảng quyết toán
    expect(screen.queryByText(/^1\.\s*Tiền thuê/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^2\.\s*Phạt vi phạm/)).not.toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('renders REJECTED_CHECKIN case with 100% rent + deposit refund (BR-CHK-06)', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'REJECTED_CHECKIN',
      depositAmount: 1000000,
      totalRentalFee: 2000000,
      depositRefundAmount: 3000000,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 2000000,
      earlyReturn: false,
    });

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Bảng hoàn tiền từ chối bàn giao/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Từ chối nhận kho/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn 100% Tiền thuê đã đóng/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn 100% Tiền cọc ban đầu/i)).toBeInTheDocument();
    expect(screen.getByText('3.000.000 đ')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('renders OVERDUE_TERMINATED case and handles deficit / payable amount (BR-OVD-07, BR-OVD-11)', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'OVERDUE_TERMINATED',
      depositAmount: 1000000,
      totalRentalFee: 2000000,
      depositRefundAmount: 0,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 550000,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Bảng quyết toán cưỡng chế & Kho Tổng/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Cưỡng chế Kho Tổng/i)).toBeInTheDocument();
    expect(screen.getByText(/Phí quá hạn lũy kế/i)).toBeInTheDocument();
    expect(screen.getByText(/Phí niêm phong & chuyển về Kho Tổng/i)).toBeInTheDocument();

    // Default with 0 extra cost: balanced settlement
    const submitBtn = screen.getByRole('button', { name: /Chốt tất toán & Đóng HĐ/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('renders NORMAL return case correctly preserving 100% deposit minus deductions (BR-RET-04, UC-F3-06)', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'NORMAL',
      depositAmount: 1000000,
      totalRentalFee: 3000000,
      depositForfeited: 0,
      depositRefundAmount: 850000,
      payableAmount: 0,
      damageCost: 100000,
      overdueFee: 50000,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Bảng quyết toán hoàn cọc đúng hạn/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Trả kho đúng hạn/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiền cọc ban đầu được bảo toàn/i)).toBeInTheDocument();
    expect(screen.getByText(/Khấu trừ hư hại \/ vệ sinh/i)).toBeInTheDocument();
    expect(screen.getByText(/Khấu trừ phí quá hạn phát sinh/i)).toBeInTheDocument();
    expect(screen.getByText('850.000 đ')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submits settlement approval with confirmPaid: true, invoking onSuccess and onClose', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'NORMAL',
      depositAmount: 1000000,
      totalRentalFee: 3000000,
      depositForfeited: 0,
      depositRefundAmount: 1000000,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });
    vi.mocked(contractApi.approveSettlementRefund).mockResolvedValue({
      success: true,
      message: 'Đã hoàn tất quyết toán hợp đồng!',
    });

    const onCloseMock = vi.fn();
    const onSuccessMock = vi.fn();

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i })).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText(/VD: Đã xác nhận STK hoàn tiền qua Vietcombank/i);
    fireEvent.change(noteInput, { target: { value: 'Đã chuyển khoản VCB số GD #12345' } });

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contractApi.approveSettlementRefund).toHaveBeenCalledWith({
        contractId: 9022,
        damageCost: 0,
        depositRefundAmount: 1000000,
        penaltyAmount: 0,
        note: 'Đã chuyển khoản VCB số GD #12345',
        confirmPaid: true,
      });
      expect(onSuccessMock).toHaveBeenCalledWith(9022, 'Đã hoàn tất quyết toán hợp đồng!');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('handles OVERDUE_TERMINATED existing deficit and dynamic extra cost addition (BR-OVD-11)', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'OVERDUE_TERMINATED',
      depositAmount: 1000000,
      totalRentalFee: 2000000,
      depositRefundAmount: 0,
      payableAmount: 150000, // Existing damage or unpaid charges
      damageCost: 150000,
      overdueFee: 550000,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });
    vi.mocked(contractApi.approveSettlementRefund).mockResolvedValue({
      success: true,
      message: 'Đã thu bù thành công!',
    });

    const onSuccessMock = vi.fn();

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={vi.fn()}
        onSuccess={onSuccessMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('150.000 đ')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Xác nhận thu tiền & Đóng HĐ/i })).toBeInTheDocument();
    });

    // Bấm "+ Thêm chi phí phát sinh"
    const addCostBtn = screen.getByRole('button', { name: /Thêm chi phí phát sinh/i });
    fireEvent.click(addCostBtn);

    const costInput = screen.getByPlaceholderText('VD: 300000');
    const reasonInput = screen.getByPlaceholderText('VD: Lưu Kho Tổng 10 ngày...');

    fireEvent.change(costInput, { target: { value: '250000' } });
    fireEvent.change(reasonInput, { target: { value: 'Phí lưu kho tổng 15 ngày' } });

    // 150.000 đ existing + 250.000 đ extra = 400.000 đ payableAmount
    await waitFor(() => {
      expect(screen.getByText('400.000 đ')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận thu tiền & Đóng HĐ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contractApi.approveSettlementRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 9022,
          damageCost: 400000, // 150k + 250k
          depositRefundAmount: 0,
          penaltyAmount: 550000,
          confirmPaid: true,
          note: expect.stringContaining('[Chi phí phát sinh: +250.000đ - Phí lưu kho tổng 15 ngày]'),
        })
      );
    });
  });

  it('displays error alert when approval API fails and keeps modal open', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'NORMAL',
      depositAmount: 1000000,
      totalRentalFee: 3000000,
      depositRefundAmount: 1000000,
      payableAmount: 0,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });
    vi.mocked(contractApi.approveSettlementRefund).mockRejectedValue(new Error('Lỗi cổng thanh toán'));

    const onCloseMock = vi.fn();

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={onCloseMock}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /^Xác nhận hoàn tiền$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Lỗi cổng thanh toán')).toBeInTheDocument();
    });

    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('supports online VietQR debt collection option (confirmPaid: false) when payableAmount > 0', async () => {
    vi.mocked(contractApi.getSettlementPreview).mockResolvedValue({
      contractId: 9022,
      settlementType: 'NORMAL',
      depositAmount: 500000,
      totalRentalFee: 2000000,
      depositForfeited: 0,
      depositRefundAmount: 0,
      payableAmount: 300000, // Damage 800k - Deposit 500k = Deficit 300k
      damageCost: 800000,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      earlyRentRefund: 0,
      earlyReturn: false,
    });
    vi.mocked(contractApi.approveSettlementRefund).mockResolvedValue({
      success: true,
      message: 'Đã mở cổng nộp bù online cho khách hàng',
    });

    const onSuccessMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <SettlementApprovalModal
        isOpen={true}
        contract={mockContract}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
      />
    );

    // Verify initial state: default to cash collected (confirmPaid: true)
    await waitFor(() => {
      expect(screen.getByText(/Hình thức thu khoản nộp bù/i)).toBeInTheDocument();
    });

    const qrRadio = screen.getByLabelText(/Khách sẽ quét mã VietQR tự thanh toán online/i);
    expect(qrRadio).toBeInTheDocument();

    // Select online VietQR option
    fireEvent.click(qrRadio);

    // Verify CTA button label updates (ngắn gọn, không nhồi số tiền dài dòng)
    const ctaBtn = screen.getByRole('button', {
      name: /^Chốt công nợ & Mở cổng QR$/i,
    });
    expect(ctaBtn).toBeInTheDocument();

    // Click submit
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(contractApi.approveSettlementRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: 9022,
          confirmPaid: false,
          damageCost: 800000,
          depositRefundAmount: 0,
        })
      );
      expect(onSuccessMock).toHaveBeenCalledWith(9022, 'Đã mở cổng nộp bù online cho khách hàng');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('chuẩn hóa giao diện Enterprise SaaS: header trắng, không dùng gradient tím đen, không gạch ngang line-through, số liệu căn phải tabular-nums', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const content = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/manager/components/SettlementApprovalModal.tsx'),
      'utf-8'
    );

    expect(content).not.toContain('from-slate-900 via-purple-950');
    expect(content).not.toContain('from-purple-700 to-indigo-700');
    expect(content).not.toContain('line-through');
    expect(content).toContain('tabular-nums');
    expect(content).toContain('Hủy bỏ');
    expect(content).toContain('Xác nhận hoàn tiền');
  });
});
