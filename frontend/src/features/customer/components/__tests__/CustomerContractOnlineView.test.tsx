// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { RentedUnitCard } from '../RentedUnitCard';
import { ContractDetailModal } from '../ContractDetailModal';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import type { RentedContract } from '../../types';

// Mock getContractAccessLogs and getMyRentalDetail
vi.mock('@/api/customerRentals', () => ({
  getContractAccessLogs: vi.fn().mockResolvedValue([]),
  getMyRentalDetail: vi.fn().mockImplementation((id: number) => {
    return Promise.resolve({
      id: id,
      contractCode: 'CTR-202610-001',
      facilityName: 'Kho Tự Quản Tân Thuận',
      facilityAddress: '123 Nguyễn Thị Thập, Quận 7',
      facilityPhone: '0281234567',
      unitCode: 'U-102',
      unitTypeName: 'Kho Tiêu Chuẩn S',
      floor: 1,
      position: 'Khu A',
      unitDimensions: '1.5m x 2.0m x 2.5m',
      startDate: '2026-10-01',
      endDateExclusive: '2026-11-01',
      status: 'ACTIVE',
      monthlyPrice: 1500000,
      depositAmount: 1500000,
      depositBalance: 1500000,
      totalRentalFee: 1500000,
      overdueFeeAccrued: 0,
      checkinDate: '2026-10-01',
      customerName: 'Nguyễn Văn Khách',
      customerPhone: '0987654321',
      customerEmail: 'khach@example.com',
      customerIdentityNumber: '079201001234',
      handoverStaffName: 'Trần Văn Staff',
      handoverConditionNote: 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao',
      customerConfirmedAt: '2026-10-01T09:30:00Z',
      relocationSupportRequestId: 801,
      relocationSupportRequestCode: 'SUP-202610-0001',
      relocationReason: 'Di dời kho do lỗi thấm dột tường',
    });
  }),
}));

describe('Customer Portal - Xem Hợp đồng điện tử & Biên bản bàn giao online', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleContract: RentedContract = {
    id: '501',
    contractNumber: 'CTR-202610-001',
    facilityId: '1',
    facilityName: 'Kho Tự Quản Tân Thuận',
    unitId: '102',
    unitNumber: 'U-102',
    unitTypeName: 'Kho Tiêu Chuẩn S',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    monthlyRent: 1500000,
    depositHeld: 1500000,
    status: 'ACTIVE',
    accessPin: '123456',
    relocationSupportRequestId: 801,
    relocationSupportRequestCode: 'SUP-202610-0001',
  };

  it('RentedUnitCard hiển thị nút Hợp đồng điện tử và gọi onViewDetail khi nhấn', () => {
    const onViewDetailMock = vi.fn();

    render(
      <BrowserRouter>
        <RentedUnitCard
          contract={sampleContract}
          onViewDetail={onViewDetailMock}
        />
      </BrowserRouter>
    );

    const contractBtn = screen.getByRole('button', { name: /Hợp đồng điện tử/i });
    expect(contractBtn).toBeInTheDocument();

    fireEvent.click(contractBtn);
    expect(onViewDetailMock).toHaveBeenCalledWith(sampleContract);
  });

  it('ContractDetailModal hiển thị chuẩn Hợp đồng điện tử, bên thuê, biên bản bàn giao và phụ lục đổi kho', async () => {
    render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={sampleContract}
      />
    );

    // Tiêu đề hợp đồng điện tử
    expect(await screen.findByText(/HỢP ĐỒNG THUÊ Ô KHO THÔNG MINH/i)).toBeInTheDocument();

    // Thông tin bên thuê kho (khách hàng xuất hiện ở Điều 1 và phần Ký tên)
    const customerElements = await screen.findAllByText(/Nguyễn Văn Khách/i);
    expect(customerElements.length).toBeGreaterThanOrEqual(1);

    expect(await screen.findByText(/079201001234/i)).toBeInTheDocument();

    // Biên bản bàn giao Check-in 4 tiêu chuẩn
    expect(await screen.findByText(/Biên bản bàn giao & Nghiệm thu tại chỗ/i)).toBeInTheDocument();
    const staffElements = await screen.findAllByText(/Trần Văn Staff/i);
    expect(staffElements.length).toBeGreaterThanOrEqual(1);

    expect(await screen.findByText(/Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao/i)).toBeInTheDocument();

    // Banner Phụ lục điều chuyển ô kho do sự cố kỹ thuật (BR-AVL-05, BR-SUP-02)
    expect(await screen.findByText(/PHỤ LỤC ĐIỀU CHUYỂN Ô KHO/i)).toBeInTheDocument();
    const relocationElements = await screen.findAllByText(/SUP-202610-0001/i);
    expect(relocationElements.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Bảo lưu toàn bộ quyền lợi khách hàng/i)).toBeInTheDocument();

    // Nút in hợp đồng
    expect(screen.getByRole('button', { name: /In hợp đồng/i })).toBeInTheDocument();
  });
});
