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
    if (id === 888) {
      return Promise.resolve({
        id: 888,
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
        status: 'PENDING_CHECK_IN',
        monthlyPrice: 1500000,
        depositAmount: 1500000,
        depositBalance: 1500000,
        totalRentalFee: 1500000,
        overdueFeeAccrued: 0,
        checkinDate: null,
        customerName: 'Nguyễn Văn Khách',
        customerPhone: '0987654321',
        customerEmail: 'khach@example.com',
        customerIdentityNumber: '079201001234',
        handoverStaffName: null,
        handoverConditionNote: null,
        customerConfirmedAt: null,
        relocationEligible: true,
      });
    }
    if (id === 777) {
      return Promise.resolve({
        id: 777,
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
        status: 'TERMINATED',
        monthlyPrice: 1500000,
        depositAmount: 1500000,
        depositBalance: 1500000,
        totalRentalFee: 1500000,
        overdueFeeAccrued: 0,
        checkinDate: null,
        customerName: 'Nguyễn Văn Khách',
        customerPhone: '0987654321',
        customerEmail: 'khach@example.com',
        customerIdentityNumber: '079201001234',
        handoverStaffName: 'Lễ tân trực quầy',
        handoverConditionNote: 'Mái dột nước ngập góc kho',
        customerConfirmedAt: null,
      });
    }
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
    const titleElements = await screen.findAllByText(/HỢP ĐỒNG THUÊ Ô KHO THÔNG MINH/i);
    expect(titleElements.length).toBeGreaterThanOrEqual(1);

    // Thông tin bên thuê kho (khách hàng xuất hiện ở Điều 1 và phần Ký tên)
    const customerElements = await screen.findAllByText(/Nguyễn Văn Khách/i);
    expect(customerElements.length).toBeGreaterThanOrEqual(1);

    const identityElements = await screen.findAllByText(/079201001234/i);
    expect(identityElements.length).toBeGreaterThanOrEqual(1);

    // Biên bản bàn giao Check-in 4 tiêu chuẩn
    const handoverElements = await screen.findAllByText(/Biên bản bàn giao & Nghiệm thu tại chỗ/i);
    expect(handoverElements.length).toBeGreaterThanOrEqual(1);
    const staffElements = await screen.findAllByText(/Trần Văn Staff/i);
    expect(staffElements.length).toBeGreaterThanOrEqual(1);

    const noteElements = await screen.findAllByText(/Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao/i);
    expect(noteElements.length).toBeGreaterThanOrEqual(1);

    // Banner Phụ lục điều chuyển ô kho do sự cố kỹ thuật (BR-AVL-05, BR-SUP-02)
    expect(await screen.findByText(/PHỤ LỤC ĐIỀU CHUYỂN Ô KHO/i)).toBeInTheDocument();
    const relocationElements = await screen.findAllByText(/SUP-202610-0001/i);
    expect(relocationElements.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/Bảo lưu toàn bộ quyền lợi khách hàng/i)).toBeInTheDocument();

    // Nút in hợp đồng
    expect(screen.getByRole('button', { name: /In hợp đồng/i })).toBeInTheDocument();
  });

  it('ContractDetailModal khi ở trạng thái PENDING_CHECKIN hiển thị Điều 4 chờ nghiệm thu và chưa ký bàn giao', async () => {
    const pendingContract: RentedContract = {
      ...sampleContract,
      id: 999,
      status: 'PENDING_CHECKIN',
      checkinDate: undefined,
      handoverStaffName: undefined,
      handoverConditionNote: undefined,
    };

    render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={pendingContract}
      />
    );

    // Banner và badge chờ nghiệm thu
    expect(await screen.findByText(/Chờ nghiệm thu tại quầy/i)).toBeInTheDocument();
    expect(await screen.findByText(/Ô kho đang ở trạng thái Chờ nhận kho/i)).toBeInTheDocument();

    // Chữ ký hiển thị chờ tiếp đón tại quầy
    const staffSigns = await screen.findAllByText(/CHỜ TIẾP ĐÓN & KÝ TẠI QUẦY|CHỜ KÝ BÀN GIAO TẠI QUẦY/i);
    expect(staffSigns.length).toBeGreaterThanOrEqual(1);

    const customerSigns = await screen.findAllByText(/CHỜ XÁC NHẬN KHI NHẬN KHO/i);
    expect(customerSigns.length).toBeGreaterThanOrEqual(1);

    // Không được hiển thị đã ký số bàn giao
    expect(screen.queryByText(/✓ ĐÃ KÝ SỐ ĐIỆN TỬ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓ ĐÃ XÁC NHẬN BÀN GIAO/i)).not.toBeInTheDocument();
  });

  it('RentedUnitCard và ContractDetailModal khi PENDING_CHECKIN có relocationEligible hiển thị "Đang sắp xếp đổi ô kho"', async () => {
    const relocatingContract: RentedContract = {
      ...sampleContract,
      id: '888',
      status: 'PENDING_CHECKIN',
      relocationEligible: true,
      checkinDate: undefined,
      handoverStaffName: undefined,
      handoverConditionNote: undefined,
      relocationSupportRequestId: undefined,
    } as any;

    // 1. Kiểm tra trên RentedUnitCard
    const { unmount } = render(
      <BrowserRouter>
        <RentedUnitCard contract={relocatingContract} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Đang sắp xếp đổi ô kho/i)).toBeInTheDocument();
    unmount();

    // 2. Kiểm tra trên ContractDetailModal
    const { unmount: unmountModal } = render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={relocatingContract}
      />
    );

    // Huy hiệu và banner đang sắp xếp đổi ô
    const relocatingBadges = await screen.findAllByText(/Đang sắp xếp đổi ô kho/i);
    expect(relocatingBadges.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText(/ĐANG SẮP XẾP ĐỔI Ô KHO DO PHÁT HIỆN SỰ CỐ TẠI HIỆN TRƯỜNG/i)).toBeInTheDocument();
    const relocateNotes = await screen.findAllByText(/Đang điều phối đổi ô kho tại chỗ/i);
    expect(relocateNotes.length).toBeGreaterThanOrEqual(1);

    // Chữ ký hiển thị chờ đổi ô mới (có ở cả modal view và print document)
    expect(screen.getAllByText(/ĐANG ĐỢI ĐỔI Ô MỚI/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/CHỜ BÀN GIAO Ô MỚI/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/✓ ĐÃ KÝ SỐ ĐIỆN TỬ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓ ĐÃ XÁC NHẬN BÀN GIAO/i)).not.toBeInTheDocument();
    unmountModal();
  });

  it('ContractDetailModal khi TERMINATED hiển thị biên bản sự cố, không hiển thị nghiệm thu thành công', async () => {
    const terminatedContract: RentedContract = {
      ...sampleContract,
      id: '777',
      status: 'TERMINATED',
      checkinDate: undefined,
      handoverStaffName: 'Lễ tân trực quầy',
      handoverConditionNote: 'Mái dột nước ngập góc kho',
      relocationSupportRequestId: undefined,
    };

    const { unmount } = render(
      <ContractDetailModal
        isOpen={true}
        onClose={vi.fn()}
        contract={terminatedContract}
      />
    );

    // Huy hiệu và banner dừng do sự cố
    expect(await screen.findByText(/Hủy do sự cố bàn giao \(Chờ hoàn cọc\)/i)).toBeInTheDocument();
    expect(await screen.findByText(/HỢP ĐỒNG ĐÃ DỪNG THỦ TỤC NHẬN KHO DO SỰ CỐ KỸ THUẬT/i)).toBeInTheDocument();
    const incidentReports = await screen.findAllByText(/Biên bản ghi nhận sự cố bàn giao tại hiện trường/i);
    expect(incidentReports.length).toBeGreaterThanOrEqual(1);

    // Chữ ký từ chối / hủy nhận do hư hỏng (có ở cả modal view và print document)
    expect(screen.getAllByText(/HỦY NHẬN DO SỰ CỐ/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ĐÃ TỪ CHỐI NHẬN KHO/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/✓ ĐÃ KÝ SỐ ĐIỆN TỬ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/✓ ĐÃ XÁC NHẬN BÀN GIAO/i)).not.toBeInTheDocument();
    unmount();
  });
});
