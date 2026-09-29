/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RenewalPage } from '../../pages/RenewalPage';
import { tokenStorage } from '@/utils/tokenStorage';
import * as customerRentalsApi from '@/api/customerRentals';
import { customerApi } from '../../api/customerApi';
import type { RentedContract } from '../../types';

describe('RenewalPage Stepper Disabled & Digital Clock', () => {
  const mockContract: RentedContract = {
    id: '1',
    contractNumber: 'CTR-DEMO-TX-104',
    facilityId: '1',
    facilityName: 'SmartStorage Q1',
    unitId: 'U-101',
    unitNumber: 'U-101',
    unitTypeName: 'Kho Tiêu Chuẩn',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2024-01-01',
    endDate: '2028-01-01',
    monthlyRent: 1500000,
    depositHeld: 1500000,
    status: 'ACTIVE',
    inspectionDone: false,
    overdueDays: 0,
    overdueFee: 0,
    pendingRenewalOrderCode: 888888,
    hasPendingRenewal: true,
    pendingRenewalExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  };

  beforeEach(() => {
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('valid-token');
    vi.spyOn(customerRentalsApi, 'getCustomerContracts').mockResolvedValue([mockContract]);
    vi.spyOn(customerRentalsApi, 'getRenewalQuote').mockResolvedValue({
      contractId: 1,
      renewalMonths: 3,
      monthlyPrice: 1500000,
      totalRenewalFee: 4500000,
      newEndDateExclusive: '2028-04-01',
      overdueFeeSettled: 0,
    } as any);
    vi.spyOn(customerApi, 'createPaymentCheckout').mockResolvedValue({
      orderCode: 888888,
      amount: 4500000,
      accountNumber: '0888567999',
      accountName: 'CONG TY SMARTSTORAGE',
      description: 'GH1T3',
      qrCode: 'vietqr://mock-qr',
      checkoutUrl: 'https://sandbox.payos.vn/checkout',
      status: 'PENDING',
    });
    vi.spyOn(customerApi, 'getPaymentStatus').mockResolvedValue({
      orderCode: 888888,
      amount: 4500000,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderRenewalPageAtStep3 = async () => {
    const utils = render(
      <MemoryRouter initialEntries={['/customer/renew/1?step=3&orderCode=888888']}>
        <Routes>
          <Route path="/customer/renew/:contractId" element={<RenewalPage />} />
        </Routes>
      </MemoryRouter>
    );
    // Wait for step 3 to render
    await screen.findByText('Quét Mã VietQR Hoàn Tất Gia Hạn');
    return utils;
  };

  it('renders digital countdown clock in hh:mm:ss format instead of Vietnamese text', async () => {
    await renderRenewalPageAtStep3();

    // Text "Hết hạn sau:" must be present
    expect(screen.getByText('Hết hạn sau:')).toBeInTheDocument();

    // Must NOT contain Vietnamese text "Còn 47 giờ" or "Còn 48 giờ"
    const expiryContainer = screen.getByText('Hết hạn sau:').parentElement;
    expect(expiryContainer?.textContent).not.toMatch(/Còn \d+ giờ/);

    // Must match hh:mm:ss format (e.g. 47:59:xx or 48:00:00)
    expect(expiryContainer?.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('disables clicking step 1 and step 2 when at step 3', async () => {
    await renderRenewalPageAtStep3();

    const step1El = screen.getByText('1. Chọn kỳ hạn & Kiểm tra').closest('div');
    const step2El = screen.getByText('2. Bảng kê tài chính').closest('div');

    expect(step1El).toHaveClass('cursor-not-allowed');
    expect(step2El).toHaveClass('cursor-not-allowed');

    // Click step 1
    if (step1El) fireEvent.click(step1El);
    // Should still be at Step 3
    expect(screen.getByText('Quét Mã VietQR Hoàn Tất Gia Hạn')).toBeInTheDocument();
    expect(screen.queryByText('Tiến Hành Thanh Toán VietQR (Napas247)')).not.toBeInTheDocument();

    // Click step 2
    if (step2El) fireEvent.click(step2El);
    // Should still be at Step 3
    expect(screen.getByText('Quét Mã VietQR Hoàn Tất Gia Hạn')).toBeInTheDocument();
    expect(screen.queryByText('Tiến Hành Thanh Toán VietQR (Napas247)')).not.toBeInTheDocument();
  });
});
