// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookingPaymentStep } from '../BookingPaymentStep';
import { VnpayPayLinks } from '../VnpayPayLinks';

describe('BookingPaymentStep & VnpayPayLinks UI Redesign (Fintech UX Standard)', () => {
  afterEach(() => {
    cleanup();
  });

  const dummyFacility: any = {
    id: 1,
    name: 'Cơ sở Quận 1',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    phone: '0901234567',
    openingHours: '08:00 - 21:00',
  };

  const dummyUnitType: any = {
    id: 10,
    name: 'Kho Nhỏ Standard S',
    sizeCategory: 'S',
    dimensions: '1.5m x 2m x 2.5m',
    areaM2: 3,
  };

  const dummyCalculation: any = {
    rentalFee: 3300000,
    depositAmount: 2200000,
    discountAmount: 0,
    discountPercent: 0,
    totalDueToday: 5500000,
  };

  const dummyCheckoutData: any = {
    orderCode: 9048,
    amount: 5500000,
    description: 'DH9048',
    checkoutUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order=9048',
  };

  it('Lỗi 2 Fix: Không hiển thị khối "Thẻ test NCB" hay số thẻ 9704198526191432198 trên UI', () => {
    const { container: containerStep } = render(
      <BookingPaymentStep
        createdReservationId={9048}
        checkoutData={dummyCheckoutData}
        calculation={dummyCalculation}
        formattedCountdown="14:59:53"
        paymentNotice={null}
        paymentStatus="PENDING"
        redirectCountdown={3}
        isVerifying={false}
        handleCheckPaymentStatus={vi.fn()}
        facility={dummyFacility}
        unitType={dummyUnitType}
        finalUnitNumber="U-101"
        durationMonths={3}
        depositMultiplierLabel="2"
      />
    );

    expect(screen.queryByText(/Thẻ test NCB/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/9704198526191432198/)).not.toBeInTheDocument();
    expect(containerStep.textContent).not.toContain('9704198526191432198');

    cleanup();

    const { container: containerLinks } = render(
      <VnpayPayLinks orderCode={9048} />
    );
    expect(screen.queryByText(/Thẻ test NCB/i)).not.toBeInTheDocument();
    expect(containerLinks.textContent).not.toContain('9704198526191432198');
  });

  it('Lỗi 3 Fix: Nút chính là "Thanh toán ngay với VNPay" trong cột Tóm tắt, không còn nút "Kiểm tra trạng thái thanh toán"', () => {
    render(
      <BookingPaymentStep
        createdReservationId={9048}
        checkoutData={dummyCheckoutData}
        calculation={dummyCalculation}
        formattedCountdown="14:59:53"
        paymentNotice={null}
        paymentStatus="PENDING"
        redirectCountdown={3}
        isVerifying={false}
        handleCheckPaymentStatus={vi.fn()}
        facility={dummyFacility}
        unitType={dummyUnitType}
        finalUnitNumber="U-101"
        durationMonths={3}
        depositMultiplierLabel="2"
      />
    );

    // Nút chính "Thanh toán ngay với VNPay"
    const payBtn = screen.getByRole('button', { name: /Thanh toán ngay với VNPay/i });
    expect(payBtn).toBeInTheDocument();

    // Không còn nút màu xanh mint thủ công "Kiểm tra trạng thái thanh toán"
    expect(screen.queryByText('Kiểm tra trạng thái thanh toán')).not.toBeInTheDocument();

    // Vẫn hiển thị bộ đếm giữ ô kho
    expect(screen.getByText(/\[14:59:53\]/)).toBeInTheDocument();
    expect(screen.getByText(/DH9048/)).toBeInTheDocument();

    // Có bảo mật mã hóa
    expect(screen.getByText(/Giao dịch được mã hóa an toàn bởi VNPay/i)).toBeInTheDocument();
  });

  it('Hiển thị 2 phương thức thanh toán dạng Radio Card: Thẻ ATM nội địa (Khuyên dùng) và Thẻ quốc tế', () => {
    render(
      <BookingPaymentStep
        createdReservationId={9048}
        checkoutData={dummyCheckoutData}
        calculation={dummyCalculation}
        formattedCountdown="14:59:53"
        paymentNotice={null}
        paymentStatus="PENDING"
        redirectCountdown={3}
        isVerifying={false}
        handleCheckPaymentStatus={vi.fn()}
        facility={dummyFacility}
        unitType={dummyUnitType}
        finalUnitNumber="U-101"
        durationMonths={3}
        depositMultiplierLabel="2"
      />
    );

    expect(screen.getByText(/Thẻ ATM \/ Tài khoản Nội địa/i)).toBeInTheDocument();
    expect(screen.getByText(/Khuyên dùng/i)).toBeInTheDocument();
    expect(screen.getByText(/Thẻ Quốc tế \(Visa \/ Mastercard \/ JCB\)/i)).toBeInTheDocument();
  });

  it('Hỗ trợ nút Hủy giữ chỗ gọi onCancelReservation / setShowCancelModal', () => {
    const onCancelMock = vi.fn();
    render(
      <BookingPaymentStep
        createdReservationId={9048}
        checkoutData={dummyCheckoutData}
        calculation={dummyCalculation}
        formattedCountdown="14:59:53"
        paymentNotice={null}
        paymentStatus="PENDING"
        redirectCountdown={3}
        onCancelReservation={onCancelMock}
        isVerifying={false}
        handleCheckPaymentStatus={vi.fn()}
        facility={dummyFacility}
        unitType={dummyUnitType}
        finalUnitNumber="U-101"
        durationMonths={3}
        depositMultiplierLabel="2"
      />
    );

    const cancelBtn = screen.getByText(/✕ Hủy giữ chỗ/i);
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
