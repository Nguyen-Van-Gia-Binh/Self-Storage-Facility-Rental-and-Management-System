/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { RentedUnitCard } from '../RentedUnitCard';
import { RenewalPage } from '../../pages/RenewalPage';
import { tokenStorage } from '@/utils/tokenStorage';
import * as customerRentalsApi from '@/api/customerRentals';
import type { RentedContract } from '../../types';

describe('RenewalRevampFlow (Task 10 / Phase 4)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const createActiveContract = (daysFromNow: number): RentedContract => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const endDateStr = d.toISOString().split('T')[0];

    return {
      id: '101',
      contractNumber: 'CTR-ACTIVE-15D',
      facilityId: '1',
      facilityName: 'SmartStorage Q1',
      unitId: 'U-101',
      unitNumber: 'U-101',
      unitTypeName: 'Kho Tiêu Chuẩn',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      startDate: '2025-01-01',
      endDate: endDateStr,
      monthlyRent: 1200000,
      depositHeld: 1200000,
      status: 'ACTIVE',
      inspectionDone: false,
      overdueDays: 0,
      overdueFee: 0,
      accessPin: '123456',
    };
  };

  const createOverdueClearedContract = (): RentedContract => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    const endDateStr = d.toISOString().split('T')[0];

    return {
      id: '102',
      contractNumber: 'CTR-OVERDUE-CLEARED',
      facilityId: '1',
      facilityName: 'SmartStorage Q1',
      unitId: 'U-102',
      unitNumber: 'U-102',
      unitTypeName: 'Kho Tiêu Chuẩn',
      sizeCategory: 'S',
      storageType: 'STANDARD',
      startDate: '2024-01-01',
      endDate: endDateStr,
      monthlyRent: 1200000,
      depositHeld: 1200000,
      status: 'OVERDUE',
      inspectionDone: false,
      overdueDays: 5,
      overdueFee: 0, // Đã nộp phạt xong
      accessPin: '123456',
    };
  };

  it('1. Hợp đồng ACTIVE còn dưới 30 ngày: hiển thị nhắc nhở và nút Gia hạn không bị khóa', () => {
    const contract = createActiveContract(15);
    render(
      <BrowserRouter>
        <RentedUnitCard contract={contract} />
      </BrowserRouter>
    );

    // Không còn nút bị khóa
    expect(screen.queryByText(/Đã khóa gia hạn/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gia hạn hợp đồng \(Đã khóa\)/i)).not.toBeInTheDocument();

    // Hiển thị badge nhắc nhở
    expect(screen.getByText(/Còn 15 ngày — Hãy gia hạn sớm/i)).toBeInTheDocument();

    // Nút Gia hạn hợp đồng trực tuyến sáng và click được
    const renewBtn = screen.getByRole('button', { name: /Gia hạn hợp đồng trực tuyến/i });
    expect(renewBtn).toBeInTheDocument();
    expect(renewBtn).not.toBeDisabled();
  });

  it('2. Hợp đồng OVERDUE đã tất toán nợ phạt: hiển thị nút Gia hạn trực tuyến và nút Báo trả kho', () => {
    const contract = createOverdueClearedContract();
    render(
      <BrowserRouter>
        <RentedUnitCard contract={contract} onScheduleReturn={vi.fn()} />
      </BrowserRouter>
    );

    // Hiển thị badge đã tất toán nợ phạt
    expect(screen.getByText(/Đã tất toán nợ phạt/i)).toBeInTheDocument();

    // Hiển thị nút Gia hạn hợp đồng trực tuyến
    const renewBtn = screen.getByRole('button', { name: /Gia hạn hợp đồng trực tuyến/i });
    expect(renewBtn).toBeInTheDocument();

    // Hiển thị nút Báo trả kho
    const returnBtn = screen.getByRole('button', { name: /Báo trả kho/i });
    expect(returnBtn).toBeInTheDocument();
  });

  it('3. RenewalPage: Khi ô kho bị trùng lịch người khác đặt trước (CAPACITY_NOT_AVAILABLE), hiển thị Conflict View và 2 nút hành động', async () => {
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('mock-token');

    const contract = createActiveContract(10);
    vi.spyOn(customerRentalsApi, 'getCustomerContracts').mockResolvedValue([contract]);

    const capacityError = new Error('Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo.');
    (capacityError as any).errorCode = 'CAPACITY_NOT_AVAILABLE';
    vi.spyOn(customerRentalsApi, 'getRenewalQuote').mockRejectedValue(capacityError);

    render(
      <MemoryRouter initialEntries={['/customer/renew/101']}>
        <Routes>
          <Route path="/customer/renew/:contractId" element={<RenewalPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Chờ màn hình Conflict Notice hiển thị
    await waitFor(() => {
      expect(screen.getByText(/Ô kho U-101 đã có người đặt trước cho kỳ tiếp theo/i)).toBeInTheDocument();
    });

    // Kiểm tra nội dung hướng dẫn
    expect(
      screen.getByText(/khoảng thời gian tiếp theo của ô kho này đã được một khách hàng khác đặt chỗ trước/i)
    ).toBeInTheDocument();

    // Kiểm tra 2 nút hành động: Tìm & Thuê ô kho mới và Lên lịch nghiệm thu & Trả kho
    expect(screen.getByRole('button', { name: /Tìm & Thuê ô kho mới tại cơ sở này/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lên lịch nghiệm thu & Trả kho/i })).toBeInTheDocument();
  });
});
