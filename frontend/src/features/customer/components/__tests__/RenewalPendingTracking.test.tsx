/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RentedUnitCard } from '../RentedUnitCard';
import type { RentedContract } from '../../types';

describe('RenewalPendingTracking', () => {
  afterEach(() => {
    cleanup();
  });
  const mockOnChangePin = vi.fn();
  const mockOnScheduleReturn = vi.fn();
  const mockOnViewDetail = vi.fn();
  const mockOnOpenOverduePayment = vi.fn();

  const defaultContract: RentedContract = {
    id: '1',
    contractNumber: 'CTR-001',
    facilityId: '1',
    facilityName: 'SmartStorage Q1',
    unitId: 'U-101',
    unitNumber: 'U-101',
    unitTypeName: 'Kho Tiêu Chuẩn',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2023-01-01',
    endDate: '2099-12-31',
    monthlyRent: 1000000,
    depositHeld: 1000000,
    status: 'ACTIVE',
    inspectionDone: false,
    overdueDays: 0,
    overdueFee: 0,
  };

  const renderComponent = (contract: RentedContract) => {
    return render(
      <BrowserRouter>
        <RentedUnitCard
          contract={contract}
          onChangePin={mockOnChangePin}
          onScheduleReturn={mockOnScheduleReturn}
          onViewDetail={mockOnViewDetail}
          onOpenOverduePayment={mockOnOpenOverduePayment}
        />
      </BrowserRouter>
    );
  };

  it('rendersPendingRenewalBadgeWhenHasPendingIsTrue', () => {
    const contract: RentedContract = {
      ...defaultContract,
      hasPendingRenewal: true,
    };
    renderComponent(contract);
    expect(screen.getByText('Chờ thanh toán gia hạn')).toBeInTheDocument();
  });

  it('rendersContinuePaymentButtonWithCorrectUrlAndOrderCode', () => {
    const contract: RentedContract = {
      ...defaultContract,
      hasPendingRenewal: true,
      pendingRenewalOrderCode: 12345,
    };
    renderComponent(contract);
    const continueBtn = screen.getByText('Tiếp tục thanh toán');
    expect(continueBtn).toBeInTheDocument();
    
    // Nút này được bọc trong một thẻ Link
    const link = continueBtn.closest('a');
    expect(link).toHaveAttribute('href', '/customer/renew/1?orderCode=12345&step=3');
  });

  it('rendersDefaultRenewalButtonWhenNoPendingRenewal', () => {
    renderComponent(defaultContract);
    const elements = screen.getAllByText('Gia hạn hợp đồng trực tuyến');
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.queryByText('Tiếp tục thanh toán')).not.toBeInTheDocument();
    expect(screen.queryByText('Chờ thanh toán gia hạn')).not.toBeInTheDocument();
  });
});
