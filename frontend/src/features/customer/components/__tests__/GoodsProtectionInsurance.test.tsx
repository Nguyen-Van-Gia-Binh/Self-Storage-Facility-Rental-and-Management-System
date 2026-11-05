// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BookingCustomerForm } from '../BookingCustomerForm';
import { BookingPriceSummary } from '../BookingPriceSummary';
import { BookingSummaryCard } from '../BookingSummaryCard';
import type { UnitType, Facility } from '../../types';

afterEach(() => {
  cleanup();
});

const mockUnitType: UnitType = {
  id: 1,
  name: 'Kho Nhỏ (S)',
  category: 'SELF_STORAGE',
  width: 1.5,
  length: 2,
  height: 2.5,
  volumeM3: 7.5,
  description: 'Kho nhỏ gọn',
  isClimateControlled: false,
  status: 'ACTIVE',
};

const mockFacility: Facility = {
  id: 1,
  code: 'FAC-Q1',
  name: 'Cơ sở Quận 1',
  address: 'Số 45 Lê Duẩn, Quận 1, TP.HCM',
  phone: '0901234567',
  status: 'ACTIVE',
};

const mockPricing = {
  months: 3,
  monthlyRate: 1000000,
  rawRentTotal: 3000000,
  discountPercentage: 0,
  discountAmount: 0,
  finalRentTotal: 3000000,
  depositAmount: 1000000,
  totalDueToday: 4000000,
  depositMultiplier: 1,
};

describe('BR-SUP-04 — Tùy chọn Gói Bảo Vệ Tài Sản Mở Rộng 50M', () => {
  it('cho phép chọn giữa Gói Cơ bản (10M - Miễn phí) và Gói Mở rộng (50M - 50.000đ/tháng)', () => {
    const TestFormWrapper = () => {
      const [hasExtendedInsurance, setHasExtendedInsurance] = useState(false);
      return (
        <BookingCustomerForm
          customerName="Nguyễn Văn A"
          setCustomerName={vi.fn()}
          customerPhone="0901234567"
          setCustomerPhone={vi.fn()}
          customerEmail="test@gmail.com"
          setCustomerEmail={vi.fn()}
          customerIdCard="079199001234"
          setCustomerIdCard={vi.fn()}
          agreeTerms={true}
          setAgreeTerms={vi.fn()}
          formErrors={{}}
          holdHours={48}
          depositMultiplierLabel="1"
          bookingError={null}
          isSubmitting={false}
          isCheckingAvailability={false}
          isButtonDisabled={false}
          onSubmit={vi.fn()}
          hasExtendedInsurance={hasExtendedInsurance}
          setHasExtendedInsurance={setHasExtendedInsurance}
        />
      );
    };

    render(<TestFormWrapper />);

    // Kiểm tra hiển thị 2 gói bảo hiểm
    expect(screen.getByText(/Gói Cơ bản/i)).toBeInTheDocument();
    expect(screen.getByText(/10.000.000/)).toBeInTheDocument();
    expect(screen.getByText(/Gói Toàn diện 50M/i)).toBeInTheDocument();
    expect(screen.getByText(/50.000.000/)).toBeInTheDocument();

    // Bấm chọn gói mở rộng
    const extendedOption = screen.getByLabelText(/Gói Toàn diện 50M/i);
    fireEvent.click(extendedOption);
    expect(extendedOption).toBeChecked();
  });

  it('BookingPriceSummary cộng thêm phí bảo hiểm mở rộng vào tổng thanh toán', () => {
    const { rerender } = render(
      <BookingPriceSummary
        unitType={mockUnitType}
        facility={mockFacility}
        calculation={mockPricing}
        startDate="2026-11-15"
        endDate="2027-02-15"
        holdHours={48}
        hasExtendedInsurance={false}
        insuranceTotal={0}
      />
    );

    // Chưa chọn: Tổng thanh toán là 4.000.000 đ
    expect(screen.getByText(/4\.000\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Bảo hiểm mở rộng/i)).not.toBeInTheDocument();

    // Kích hoạt gói mở rộng 3 tháng: +150.000 đ -> Tổng: 4.150.000 đ
    rerender(
      <BookingPriceSummary
        unitType={mockUnitType}
        facility={mockFacility}
        calculation={mockPricing}
        startDate="2026-11-15"
        endDate="2027-02-15"
        holdHours={48}
        hasExtendedInsurance={true}
        insuranceTotal={150000}
      />
    );

    expect(screen.getByText(/Bảo hiểm mở rộng/i)).toBeInTheDocument();
    expect(screen.getByText(/\+150\.000/)).toBeInTheDocument();
    expect(screen.getByText(/4\.150\.000/)).toBeInTheDocument();
  });

  it('BookingSummaryCard hiển thị gói bảo hiểm toàn diện 50M và cập nhật tổng thanh toán chính xác', () => {
    const { rerender } = render(
      <BookingSummaryCard
        facilityName="Cơ sở Quận 1"
        finalUnitNumber="U-101"
        unitTypeName="Kho Nhỏ"
        sizeCategory="S"
        areaM2={5}
        startDate="2026-11-15"
        endDate="2027-02-15"
        durationMonths={3}
        calculation={mockPricing}
        depositMultiplierLabel="1"
        hasExtendedInsurance={false}
        insuranceTotal={0}
      />
    );

    // Mặc định: 4.000.000 đ
    expect(screen.getByText(/4\.000\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Gói bảo vệ toàn diện 50M/i)).not.toBeInTheDocument();

    // Chọn gói mở rộng 50M
    rerender(
      <BookingSummaryCard
        facilityName="Cơ sở Quận 1"
        finalUnitNumber="U-101"
        unitTypeName="Kho Nhỏ"
        sizeCategory="S"
        areaM2={5}
        startDate="2026-11-15"
        endDate="2027-02-15"
        durationMonths={3}
        calculation={mockPricing}
        depositMultiplierLabel="1"
        hasExtendedInsurance={true}
        insuranceTotal={150000}
      />
    );

    expect(screen.getByText(/Gói bảo vệ toàn diện 50M/i)).toBeInTheDocument();
    expect(screen.getByText(/\+150\.000/)).toBeInTheDocument();
    expect(screen.getByText(/4\.150\.000/)).toBeInTheDocument();
  });
});
