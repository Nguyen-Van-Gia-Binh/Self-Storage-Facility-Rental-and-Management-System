/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RentedUnitCard } from '../RentedUnitCard';
import { ContractDetailModal } from '../ContractDetailModal';
import type { RentedContract } from '../../types';

vi.mock('@/api/customerRentals', () => ({
  getContractAccessLogs: vi.fn().mockResolvedValue([]),
}));

describe('OverdueClearedAudit: Trạng thái & Cảnh báo Thẻ ô kho sau khi nộp phạt quá hạn', () => {
  afterEach(() => {
    cleanup();
  });

  const mockOnScheduleReturn = vi.fn();

  const overdueClearedContract: RentedContract = {
    id: '2',
    contractNumber: 'CTR-002',
    facilityId: '1',
    facilityName: 'SmartStorage Q1',
    unitId: 'U-102',
    unitNumber: 'U-102',
    unitTypeName: 'Kho Tiêu Chuẩn',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2023-01-01',
    endDate: '2023-02-01',
    monthlyRent: 1000000,
    depositHeld: 1000000,
    status: 'OVERDUE',
    inspectionDone: false,
    overdueDays: 5,
    overdueFee: 0,
    accessPin: '123456',
  };

  it('RentedUnitCard hiển thị badge cam Đã tất toán phạt và không có badge xanh Đang hoạt động', () => {
    render(
      <BrowserRouter>
        <RentedUnitCard
          contract={overdueClearedContract}
          onScheduleReturn={mockOnScheduleReturn}
        />
      </BrowserRouter>
    );

    // Không được có badge xanh hoạt động bình thường
    expect(screen.queryByText('Đang hoạt động 24/7')).not.toBeInTheDocument();
    expect(screen.queryByText('Đã nộp phạt (Chờ trả kho)')).not.toBeInTheDocument();

    // Phải có badge cam cảnh báo
    expect(screen.getByText('Đã tất toán phạt — Chờ dọn kho / trả kho')).toBeInTheDocument();

    // Banner màu cam nhắc nhở hoàn tất dọn đồ hoặc gia hạn
    expect(screen.getByText(/Bạn đã hoàn tất nộp phạt quá hạn:/i)).toBeInTheDocument();

    // Nút Báo trả kho phải khả dụng
    const returnBtn = screen.getByRole('button', { name: /Báo trả kho/i });
    expect(returnBtn).toBeInTheDocument();
  });

  it('ContractDetailModal hiển thị badge Đã tất toán phạt khi overdueFee = 0', () => {
    render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={overdueClearedContract}
      />
    );

    expect(screen.getByText('Đã tất toán phạt — Chờ dọn kho / trả kho')).toBeInTheDocument();
    expect(screen.queryByText('Quá hạn thanh toán')).not.toBeInTheDocument();
  });
});
