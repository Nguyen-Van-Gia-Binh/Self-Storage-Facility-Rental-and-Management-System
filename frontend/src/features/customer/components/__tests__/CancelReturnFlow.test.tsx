/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RentedUnitCard } from '../RentedUnitCard';
import * as customerRentalsApi from '@/api/customerRentals';
import type { RentedContract } from '../../types';

vi.mock('@/api/customerRentals', async () => {
  const actual = await vi.importActual<any>('@/api/customerRentals');
  return {
    ...actual,
    cancelContractReturn: vi.fn().mockResolvedValue({ success: true }),
    getContractAccessLogs: vi.fn().mockResolvedValue([]),
  };
});

describe('CancelReturnFlow: Ẩn nút gia hạn & Hiển thị/thực thi nút Hủy yêu cầu trả kho (BR-RET-12)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const pendingReturnContract: RentedContract = {
    id: '10',
    contractNumber: 'CTR-010',
    facilityId: '1',
    facilityName: 'SmartStorage Q1',
    unitId: 'U-110',
    unitNumber: 'U-110',
    unitTypeName: 'Kho Tiêu Chuẩn',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2023-01-01',
    endDate: '2023-06-01',
    monthlyRent: 1000000,
    depositHeld: 1000000,
    status: 'PENDING_RETURN',
    inspectionDone: false,
    overdueDays: 0,
    overdueFee: 0,
    accessPin: '654321',
  };

  it('Ẩn nút gia hạn và hiển thị nút Hủy yêu cầu trả kho khi PENDING_RETURN và chưa nghiệm thu', () => {
    render(
      <BrowserRouter>
        <RentedUnitCard contract={pendingReturnContract} />
      </BrowserRouter>
    );

    // Tuyệt đối không xuất hiện nút gia hạn
    expect(screen.queryByText(/Gia hạn hợp đồng trực tuyến/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gia hạn hợp đồng/i)).not.toBeInTheDocument();

    // Hiển thị nút Hủy yêu cầu trả kho
    const cancelBtn = screen.getByRole('button', { name: /Hủy yêu cầu trả kho/i });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('Khi click Hủy yêu cầu trả kho và confirm, gọi API cancelContractReturn', async () => {
    const cancelSpy = vi.spyOn(customerRentalsApi, 'cancelContractReturn');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const mockOnCancel = vi.fn();

    render(
      <BrowserRouter>
        <RentedUnitCard
          contract={pendingReturnContract}
          onCancelReturn={mockOnCancel}
        />
      </BrowserRouter>
    );

    const cancelBtn = screen.getByRole('button', { name: /Hủy yêu cầu trả kho/i });
    fireEvent.click(cancelBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith('10');
      expect(mockOnCancel).toHaveBeenCalledWith(pendingReturnContract);
    });
  });

  it('Không hiển thị nút Hủy yêu cầu trả kho nếu nhân viên đã nghiệm thu xong', () => {
    const inspectedContract: RentedContract = {
      ...pendingReturnContract,
      inspectionDone: true,
    };

    render(
      <BrowserRouter>
        <RentedUnitCard contract={inspectedContract} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: /Hủy yêu cầu trả kho/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Biên bản nghiệm thu đã lập/i)).toBeInTheDocument();
  });
});
