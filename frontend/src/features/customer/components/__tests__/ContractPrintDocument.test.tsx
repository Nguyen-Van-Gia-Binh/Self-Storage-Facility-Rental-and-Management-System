// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ContractPrintDocument } from '../ContractPrintDocument';
import { ContractDetailModal } from '../ContractDetailModal';
import type { RentedContract } from '../../types';
import type { CustomerRentalDetail } from '@/api/customerRentals';

// Mock getMyRentalDetail để tránh gọi backend thực trong unit test
vi.mock('@/api/customerRentals', () => ({
  getMyRentalDetail: vi.fn().mockImplementation(() =>
    Promise.resolve({
      id: 101,
      contractCode: 'CTR-20260915-5291',
      facilityName: 'SmartStorage Landmark Center',
      unitCode: 'HC-B203',
      unitTypeName: 'Kho Lạnh (Climate Unit)',
      startDate: '2026-09-15',
      endDateExclusive: '2027-04-15',
      status: 'ACTIVE',
      monthlyPrice: 1450000,
      depositAmount: 1450000,
      depositBalance: 1450000,
      totalRentalFee: 10150000,
      overdueFeeAccrued: 0,
      facilityAddress: 'Số 102 Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
      facilityPhone: '1900 8888',
      floor: 2,
      position: 'Khu B',
      unitDimensions: '2.0m x 2.5m x 2.5m',
      checkinDate: '2026-09-15',
      customerName: 'Nguyễn Văn Khách',
      customerPhone: '0909123456',
      customerEmail: 'khachhang@example.com',
      customerIdentityNumber: '079201009999',
      handoverStaffName: 'Nhân viên lễ tân cơ sở',
      handoverConditionNote: 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao',
      customerConfirmedAt: '2026-09-15 10:30:00',
    })
  ),
}));

describe('ContractPrintDocument & Print Contract Flow', () => {
  const sampleContract: RentedContract = {
    id: 101,
    contractNumber: 'CTR-20260915-5291',
    unitNumber: 'HC-B203',
    unitTypeName: 'Kho Lạnh (Climate Unit)',
    sizeCategory: 'M',
    facilityName: 'SmartStorage Landmark Center',
    startDate: '2026-09-15',
    endDate: '2027-04-15',
    monthlyRent: 1450000,
    depositHeld: 1450000,
    status: 'ACTIVE',
    accessCode: '582910',
    floor: 2,
    position: 'Khu B',
    unitDimensions: '2.0m x 2.5m x 2.5m',
    customerName: 'Nguyễn Văn Khách',
    customerPhone: '0909123456',
    customerIdentityNumber: '079201009999',
    customerEmail: 'khachhang@example.com',
    checkinDate: '2026-09-15',
    handoverStaffName: 'Nhân viên lễ tân cơ sở',
    handoverConditionNote: 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao',
  };

  const sampleDetail: CustomerRentalDetail = {
    id: 101,
    contractCode: 'CTR-20260915-5291',
    facilityName: 'SmartStorage Landmark Center',
    unitCode: 'HC-B203',
    unitTypeName: 'Kho Lạnh (Climate Unit)',
    startDate: '2026-09-15',
    endDateExclusive: '2027-04-15',
    status: 'ACTIVE',
    monthlyPrice: 1450000,
    depositAmount: 1450000,
    depositBalance: 1450000,
    totalRentalFee: 10150000,
    overdueFeeAccrued: 0,
    facilityAddress: 'Số 102 Đường Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
    facilityPhone: '1900 8888',
    floor: 2,
    position: 'Khu B',
    unitDimensions: '2.0m x 2.5m x 2.5m',
    checkinDate: '2026-09-15',
    customerName: 'Nguyễn Văn Khách',
    customerPhone: '0909123456',
    customerEmail: 'khachhang@example.com',
    customerIdentityNumber: '079201009999',
    handoverStaffName: 'Nhân viên lễ tân cơ sở',
    handoverConditionNote: 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao',
    customerConfirmedAt: '2026-09-15 10:30:00',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders standard Vietnamese legal header with National Motto and Title', () => {
    render(
      <ContractPrintDocument
        contract={sampleContract}
        detail={sampleDetail}
      />
    );

    // Quốc hiệu & Tiêu ngữ chuẩn Việt Nam
    expect(screen.getByText(/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i)).toBeInTheDocument();
    expect(screen.getByText(/Độc lập - Tự do - Hạnh phúc/i)).toBeInTheDocument();

    // Tiêu đề hợp đồng và số hiệu
    expect(screen.getByText(/HỢP ĐỒNG THUÊ Ô KHO TỰ QUẢN THÔNG MINH/i)).toBeInTheDocument();
    expect(screen.getByText(/BIÊN BẢN BÀN GIAO HIỆN TRƯỜNG ĐIỆN TỬ/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CTR-20260915-5291/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders all legal contract sections and participating parties', () => {
    render(
      <ContractPrintDocument
        contract={sampleContract}
        detail={sampleDetail}
      />
    );

    // Căn cứ pháp lý
    expect(screen.getByText(/Bộ luật Dân sự số 91\/2015\/QH13/i)).toBeInTheDocument();
    expect(screen.getByText(/Luật Giao dịch Điện tử số 20\/2023\/QH15/i)).toBeInTheDocument();

    // Bên A & Bên B
    expect(screen.getAllByText(/BÊN CHO THUÊ \(BÊN A\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/BÊN THUÊ KHO \(BÊN B\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/SmartStorage Landmark Center/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Nguyễn Văn Khách/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/079201009999/i)).toBeInTheDocument();
  });

  it('renders unit specs, financial deposit and 4 check-in inspection criteria (BR-CHK-02)', () => {
    render(
      <ContractPrintDocument
        contract={sampleContract}
        detail={sampleDetail}
      />
    );

    // Ô kho & Thời hạn
    expect(screen.getAllByText(/HC-B203/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Kho Lạnh \(Climate Unit\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2.0m x 2.5m x 2.5m/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2026-09-15/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2027-04-15/i).length).toBeGreaterThanOrEqual(1);

    // Tiền cọc & Quy định BR-RET-04
    expect(screen.getByText(/BR-RET-04/i)).toBeInTheDocument();

    // 4 tiêu chí nghiệm thu vật lý hiện trường BR-CHK-02
    expect(screen.getByText(/Mặt bằng kho sạch sẽ, thông thoáng, không vật cản/i)).toBeInTheDocument();
    expect(screen.getByText(/Cửa cuốn & cơ cấu khóa vận hành an toàn, trơn tru/i)).toBeInTheDocument();
    expect(screen.getByText(/Sàn tường khô ráo, phòng chống ẩm mốc & PCCC đạt chuẩn/i)).toBeInTheDocument();
    expect(screen.getByText(/Khóa điện tử IoT đã sẵn sàng, cấp mã PIN mở cửa 24\/7/i)).toBeInTheDocument();
  });

  it('renders digital signatures and QR verification block', () => {
    render(
      <ContractPrintDocument
        contract={sampleContract}
        detail={sampleDetail}
      />
    );

    expect(screen.getByText(/ĐÃ KÝ SỐ ĐIỆN TỬ/i)).toBeInTheDocument();
    expect(screen.getByText(/ĐÃ XÁC NHẬN BÀN GIAO/i)).toBeInTheDocument();
    expect(screen.getByTestId('contract-qr-code')).toBeInTheDocument();
  });

  it('ContractDetailModal mounts ContractPrintDocument and triggers window.print when clicking In hợp đồng', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={sampleContract}
      />
    );

    const printButton = screen.getByRole('button', { name: /In hợp đồng/i });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);

    // Đảm bảo văn bản in hợp đồng tồn tại trong DOM dành cho in ấn
    expect(screen.getByTestId('contract-print-document')).toBeInTheDocument();
  });

  it('renders pending signature status in ContractPrintDocument when contract is PENDING_CHECKIN', () => {
    const pendingContract: RentedContract = {
      ...sampleContract,
      status: 'PENDING_CHECKIN',
      checkinDate: undefined,
      handoverStaffName: undefined,
      handoverConditionNote: undefined,
    };
    const pendingDetail: CustomerRentalDetail = {
      ...sampleDetail,
      status: 'PENDING_CHECKIN',
      checkinDate: undefined,
      handoverStaffName: undefined,
      handoverConditionNote: undefined,
      customerConfirmedAt: undefined,
    };

    render(
      <ContractPrintDocument
        contract={pendingContract}
        detail={pendingDetail}
      />
    );

    expect(screen.getByText(/CHỜ KÝ BÀN GIAO TẠI QUẦY/i)).toBeInTheDocument();
    expect(screen.getByText(/CHỜ XÁC NHẬN KHI NHẬN KHO/i)).toBeInTheDocument();
    expect(screen.queryByText(/✓ ĐÃ KÝ SỐ ĐIỆN TỬ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓ ĐÃ XÁC NHẬN BÀN GIAO/i)).not.toBeInTheDocument();
  });
});
