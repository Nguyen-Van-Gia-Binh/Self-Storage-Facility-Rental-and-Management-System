// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReschedulePeriodModal } from '../ReschedulePeriodModal';
import type { RentedContract } from '../../types';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockContract: RentedContract = {
  id: 101,
  contractNumber: 'CTR-20261105-001',
  unitNumber: 'A101',
  unitTypeName: 'Kho Tiêu Chuẩn',
  facilityName: 'Cơ Sở Quận 1',
  monthlyRent: 900000,
  rentalMonths: 3,
  startDate: '2026-11-20', // Đủ điều kiện > 48h
  endDate: '2027-02-20',
  status: 'PENDING_CHECKIN',
};

describe('ReschedulePeriodModal — Dời ngày nhận kho có thu phí (BR-RES-06)', () => {
  it('hiển thị thông tin hợp đồng và giới hạn ngày chọn trong 7 ngày tới', () => {
    render(
      <ReschedulePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        contract={mockContract}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Dời ngày nhận kho/i)).toBeInTheDocument();
    expect(screen.getByText('A101')).toBeInTheDocument();

    const dateInput = screen.getByLabelText(/Chọn ngày bắt đầu mới/i) as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.min).toBe('2026-11-21');
    expect(dateInput.max).toBe('2026-11-27');
  });

  it('tính toán và hiển thị phí dời ngày theo số ngày dời khi người dùng chọn ngày mới', () => {
    render(
      <ReschedulePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        contract={mockContract}
        onSuccess={vi.fn()}
      />
    );

    const dateInput = screen.getByLabelText(/Chọn ngày bắt đầu mới/i) as HTMLInputElement;
    // Chọn ngày 2026-11-23 (dời 3 ngày: 23 - 20 = 3 ngày)
    // Đơn giá ngày = 900.000 / 30 = 30.000 đ/ngày -> Phí = 3 * 30.000 = 90.000 đ
    fireEvent.change(dateInput, { target: { value: '2026-11-23' } });

    expect(screen.getAllByText(/3 ngày/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/90.000/)).toBeInTheDocument();
  });

  it('hiển thị cảnh báo và khóa thao tác dời ngày nếu còn dưới 48 giờ trước ngày bắt đầu', () => {
    const urgentContract: RentedContract = {
      ...mockContract,
      // Bắt đầu vào hôm nay hoặc ngày mai (< 48h)
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    render(
      <ReschedulePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        contract={urgentContract}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/dưới 48 giờ/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Xác nhận dời ngày/i });
    expect(submitBtn).toBeDisabled();
  });

  it('hiển thị cảnh báo và khóa hoàn toàn thao tác nếu hợp đồng đã dời ngày 1 lần (BR-RES-06)', () => {
    const rescheduledContract: RentedContract = {
      ...mockContract,
      rescheduleCount: 1,
      rescheduledAt: '2026-11-06T10:00:00Z',
    };

    render(
      <ReschedulePeriodModal
        isOpen={true}
        onClose={vi.fn()}
        contract={rescheduledContract}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/1\/1 lần/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Xác nhận dời ngày/i });
    expect(submitBtn).toBeDisabled();
  });
});
