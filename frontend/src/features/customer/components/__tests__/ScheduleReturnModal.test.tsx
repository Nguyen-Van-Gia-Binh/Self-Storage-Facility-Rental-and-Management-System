/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ScheduleReturnModal } from '../ScheduleReturnModal';
import type { RentedContract } from '../../types';

afterEach(() => {
  cleanup();
});

vi.mock('@/api/customerRentals', () => ({
  scheduleContractReturn: vi.fn().mockResolvedValue({
    contractId: '1',
    scheduledReturnDate: '2026-11-08',
    status: 'PENDING_RETURN',
    estimatedDepositRefund: 0,
    message: 'Thành công',
  }),
}));

vi.mock('@/hooks/useActivePolicy', () => ({
  useActivePolicy: () => ({
    overdueGraceDays: 3,
    returnNoticeDays: 7,
    returnEarlyRefundRate: 1.0,
    returnEarlyPenaltyRate: 1.0,
  }),
}));

const mockEarlyContract: RentedContract = {
  id: '1',
  contractNumber: 'CTR-NHI-ACT-01',
  facilityId: '1',
  facilityName: 'Cơ sở Quận 7 - TP.HCM',
  unitId: '101',
  unitNumber: 'Q7-S101',
  unitTypeName: 'Kho Tiêu Chuẩn',
  sizeCategory: 'S',
  storageType: 'STANDARD',
  startDate: '2026-03-07',
  endDate: '2027-03-07', // Sau hôm nay -> Trả sớm
  monthlyRent: 750000,
  depositHeld: 750000,
  status: 'ACTIVE',
};

const mockOnTimeContract: RentedContract = {
  id: '2',
  contractNumber: 'CTR-NHI-ACT-02',
  facilityId: '1',
  facilityName: 'Cơ sở Quận 7 - TP.HCM',
  unitId: '102',
  unitNumber: 'Q7-S102',
  unitTypeName: 'Kho Tiêu Chuẩn',
  sizeCategory: 'S',
  storageType: 'STANDARD',
  startDate: '2026-03-07',
  endDate: '2026-11-08', // Hết hạn hôm nay -> Trả đúng hạn
  monthlyRent: 750000,
  depositHeld: 750000,
  status: 'ACTIVE',
};

describe('ScheduleReturnModal Component (BR-RET-06 & Compact UI)', () => {
  it('hiển thị đúng chính sách phạt 100% cọc và hoàn tiền thuê chưa dùng khi trả trước hạn', () => {
    render(
      <ScheduleReturnModal
        isOpen={true}
        onClose={vi.fn()}
        contract={mockEarlyContract}
        onReturnScheduled={vi.fn()}
      />
    );

    // Kiểm tra thông tin phạt 100% cọc
    expect(screen.getByText(/Phạt trả sớm \(100% cọc\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Hoàn tiền thuê chưa dùng/i)).toBeInTheDocument();

    // Kiểm tra box cảnh báo quy định
    expect(screen.getByText(/Lưu ý khi trả kho trước hạn:/i)).toBeInTheDocument();
    expect(screen.getByText(/Không được hoàn lại khi trả trước hạn/i)).toBeInTheDocument();

    // Checkbox đồng ý điều khoản trả sớm
    const earlyAgreeCheckbox = screen.getByLabelText(/Tôi đồng ý không nhận lại tiền cọc và nhận hoàn tiền thuê còn lại/i);
    expect(earlyAgreeCheckbox).toBeInTheDocument();
    expect(earlyAgreeCheckbox).not.toBeChecked();

    // Kiểm tra mini stepper 1 dòng chứa SLA 7 ngày làm việc
    expect(screen.getByText(/Quyết toán \(7 ngày làm việc\)/i)).toBeInTheDocument();
  });

  it('hiển thị hoàn 100% cọc khi trả kho đúng hạn', () => {
    render(
      <ScheduleReturnModal
        isOpen={true}
        onClose={vi.fn()}
        contract={mockOnTimeContract}
        onReturnScheduled={vi.fn()}
      />
    );

    // Không hiển thị cảnh báo phạt trả sớm
    expect(screen.queryByText(/Lưu ý khi trả kho trước hạn/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Tiền cọc dự kiến quyết toán hoàn lại:/i)).toBeInTheDocument();
  });

  it('bắt buộc xác nhận điều khoản trả trước hạn trước khi gửi', async () => {
    render(
      <ScheduleReturnModal
        isOpen={true}
        onClose={vi.fn()}
        contract={mockEarlyContract}
        onReturnScheduled={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Tôi đã dọn xong — Báo trả kho/i });
    expect(submitBtn).toBeDisabled();

    // Check sạch đồ
    const cleanCheckbox = screen.getByLabelText(/Đã dọn sạch 100% đồ đạc/i);
    fireEvent.click(cleanCheckbox);

    // Check nguyên vẹn
    const conditionCheckbox = screen.getByLabelText(/Ô kho nguyên vẹn/i);
    fireEvent.click(conditionCheckbox);

    // Vẫn disabled vì chưa đồng ý điều khoản trả sớm
    expect(submitBtn).toBeDisabled();

    // Check đồng ý trả sớm
    const earlyAgreeCheckbox = screen.getByLabelText(/Tôi đồng ý không nhận lại tiền cọc và nhận hoàn tiền thuê còn lại/i);
    fireEvent.click(earlyAgreeCheckbox);

    // Bây giờ đã enable
    expect(submitBtn).not.toBeDisabled();
  });
});
