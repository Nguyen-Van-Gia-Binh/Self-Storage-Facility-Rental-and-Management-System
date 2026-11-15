// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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
    const submitBtn = screen.getByRole('button', { name: /Chốt tất toán & Đóng hợp đồng/i });
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

    const submitBtn = screen.getByRole('button', { name: /Xác nhận đã hoàn 3\.000\.000 đ & Đóng HĐ/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
