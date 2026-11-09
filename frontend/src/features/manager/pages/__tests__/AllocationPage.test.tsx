// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { AllocationPage } from '../AllocationPage';
import * as facilityApi from '@/api/facility';
import * as reservationApi from '@/api/reservation';
import * as contractApi from '@/api/contract';
import * as staffAssignmentApi from '@/features/manager/api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { ReservationResponse } from '@/api/reservation';
import type { ManagerContractItem } from '@/types/contractManager';
import type { StaffWorkloadItem } from '@/features/manager/types/staffAssignment';
import type { StorageUnitResponse } from '@/types/unit';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('@/api/reservation', () => ({
  listReservations: vi.fn(),
  assignUnit: vi.fn(),
  reassignStaffApi: vi.fn(),
}));

vi.mock('@/api/contract', () => ({
  getManagerContracts: vi.fn(),
  reassignStorageUnit: vi.fn(),
}));

vi.mock('@/features/manager/api/staffAssignmentApi', () => ({
  getStaffWorkload: vi.fn(),
}));

// Mock FacilityFloorPlanMapModal để kiểm tra tương tác chọn ô trên sơ đồ 2D
vi.mock('@/features/manager/components/FacilityFloorPlanMapModal', () => ({
  FacilityFloorPlanMapModal: ({
    isOpen,
    onClose,
    onSelectUnit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelectUnit: (unit: StorageUnitResponse) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-floor-plan-modal">
        <span>Sơ đồ mặt bằng 2D Modal</span>
        <button
          type="button"
          data-testid="select-mock-unit-btn"
          onClick={() =>
            onSelectUnit({
              id: 42,
              code: 'Q7-AC-M101',
              facilityId: 2,
              unitTypeId: 5,
              floor: 1,
              position: 'Khu A',
              status: 'AVAILABLE',
            } as StorageUnitResponse)
          }
        >
          Chọn ô Q7-AC-M101
        </button>
        <button type="button" onClick={onClose}>
          Đóng sơ đồ
        </button>
      </div>
    );
  },
}));

const mockFacilities: FacilityListItem[] = [
  { id: 2, name: 'Cơ sở Quận 7 - TP.HCM', code: 'FAC-Q7', address: '10 Mai Văn Vĩnh, Quận 7' } as FacilityListItem,
];

const mockReservations: ReservationResponse[] = [
  {
    id: 101,
    code: 'RES-20261107-001',
    facilityId: 2,
    facilityName: 'Cơ sở Quận 7 - TP.HCM',
    unitTypeId: 5,
    unitTypeName: 'Kho Máy Lạnh M (6m²)',
    startDate: '2026-11-15',
    rentalMonths: 3,
    endDateExclusive: '2026-02-15',
    monthlyPrice: 2100000,
    discountAmount: 0,
    depositAmount: 2100000,
    totalRentalFee: 6300000,
    status: 'CONFIRMED',
    storageUnitId: undefined,
    customerName: 'Nguyễn Văn Gia Bình',
    customerPhone: '0901234567',
    customerEmail: 'binh.nguyen@example.com',
  } as unknown as ReservationResponse,
];

const mockStaffList: StaffWorkloadItem[] = [
  {
    staffId: 2,
    staffName: 'Trần Thị Nhân Viên',
    staffEmail: 'staff@storage.vn',
    staffPhone: '0912345678',
    facilityId: 2,
    facilityName: 'Cơ sở Quận 7 - TP.HCM',
    activeTaskCount: 1,
    completedTaskCount: 5,
    shift: 'Ca sáng (07:00 - 15:30)',
    status: 'AVAILABLE',
  },
  {
    staffId: 9,
    staffName: 'Trần Văn Hùng',
    staffEmail: 'staff.q1@smartstorage.vn',
    staffPhone: '0934567891',
    facilityId: 2,
    facilityName: 'Cơ sở Quận 7 - TP.HCM',
    activeTaskCount: 0,
    completedTaskCount: 2,
    shift: 'Ca chiều (14:30 - 22:30)',
    status: 'AVAILABLE',
  },
];

describe('AllocationPage Component (Gán ô kho)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue(mockFacilities);
    vi.mocked(reservationApi.listReservations).mockResolvedValue(mockReservations);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([]);
    vi.mocked(staffAssignmentApi.getStaffWorkload).mockResolvedValue(mockStaffList);
    vi.mocked(reservationApi.assignUnit).mockResolvedValue({
      id: 101,
      code: 'RES-20261107-001',
      storageUnitId: 42,
    } as ReservationResponse);
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Hiển thị danh sách nhiệm vụ gán ô kho từ trên xuống với đầy đủ thông tin đơn & khách hàng', async () => {
    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('Nhiệm vụ Gán ô kho')).toBeDefined();
      expect(screen.getByText('1 đơn chờ xử lý')).toBeDefined();
      expect(screen.getByText('RES-20261107-001')).toBeDefined();
      expect(screen.getByText('Nguyễn Văn Gia Bình')).toBeDefined();
      expect(screen.getByText('0901234567')).toBeDefined();
      expect(screen.getByText('Kho Máy Lạnh M')).toBeDefined();
      expect(screen.getByText('15/11/2026')).toBeDefined();
      expect(screen.getByText('Gán ô kho')).toBeDefined();
    });
  });

  it('2. Bấm "Gán ô kho" mở sơ đồ 2D, chọn ô cụ thể -> mở form xác nhận', async () => {
    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('RES-20261107-001')).toBeDefined();
    });

    // Bấm nút mở sơ đồ 2D
    const open2dBtn = screen.getByText('Gán ô kho');
    fireEvent.click(open2dBtn);

    // Modal sơ đồ 2D hiển thị
    await waitFor(() => {
      expect(screen.getByTestId('mock-floor-plan-modal')).toBeDefined();
    });

    // Chọn ô cụ thể trên sơ đồ 2D
    const selectUnitBtn = screen.getByTestId('select-mock-unit-btn');
    fireEvent.click(selectUnitBtn);

    // Modal sơ đồ 2D đóng và Form xác nhận phân bổ ô kho mở ra
    await waitFor(() => {
      expect(screen.queryByTestId('mock-floor-plan-modal')).toBeNull();
      expect(screen.getByRole('heading', { name: /Xác nhận phân bổ ô kho/i })).toBeDefined();
      expect(screen.getByText('Q7-AC-M101')).toBeDefined();
    });
  });

  it('3. Form xác nhận: hiển thị ngày khách book, KHÔNG có ô nhập giờ check-in, bắt buộc chọn nhân viên', async () => {
    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getAllByText('RES-20261107-001')[0]).toBeDefined();
    });

    fireEvent.click(screen.getAllByText('Gán ô kho')[0]);
    await waitFor(() => expect(screen.getByTestId('select-mock-unit-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('select-mock-unit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xác nhận phân bổ ô kho/i })).toBeDefined();
    });

    // Kiểm tra thông tin khách hàng được hiển thị rõ ràng trên form modal
    expect(screen.getByText('Thông tin khách hàng')).toBeDefined();
    expect(screen.getAllByText('Nguyễn Văn Gia Bình').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0901234567').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('binh.nguyen@example.com')).toBeDefined();

    // Kiểm tra ngày hẹn nhận kho đúng theo ngày khách book
    expect(screen.getAllByText('15/11/2026').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('(Theo ngày khách đặt chỗ nhận kho)')).toBeDefined();

    // Xác nhận KHÔNG CÒN các ô giờ hẹn check-in rườm rà
    expect(screen.queryByText('Khung giờ đón tiếp khách')).toBeNull();
    expect(screen.queryByText('08:00 - 09:00')).toBeNull();

    // Nút xác nhận bị disabled khi chưa chọn nhân viên
    const submitBtn = screen.getByRole('button', { name: /Xác nhận phân bổ ô kho/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Chọn nhân viên tiếp đón
    const staffSelect = screen.getByRole('combobox', { name: /tiếp đón/i });
    expect(staffSelect).toBeDefined();
    expect(screen.getByText('-- Chọn nhân viên tiếp đón (Bắt buộc) --')).toBeDefined();

    fireEvent.change(staffSelect, { target: { value: '2' } });

    // Sau khi chọn nhân viên, nút xác nhận được kích hoạt
    expect(submitBtn.disabled).toBe(false);

    // Bấm xác nhận
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reservationApi.assignUnit).toHaveBeenCalledWith(101, {
        storageUnitId: 42,
        staffId: 2,
        scheduledDate: '2026-11-15',
        scheduledStartTime: '08:00',
        scheduledEndTime: '17:00',
      });
    });
  });

  it('4. Tự động giải mã tên khách hàng (VD: ID 10 -> Nguyễn Phạm Xuân Nhi) khi backend chưa trả customerName', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([
      {
        id: 102,
        code: 'RSV-20261107-4192',
        facilityId: 2,
        customerId: 10,
        unitTypeId: 5,
        unitTypeName: 'Kho Tiêu Chuẩn S',
        startDate: '2026-11-07',
        rentalMonths: 1,
        status: 'CONFIRMED',
      } as unknown as ReservationResponse,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('RSV-20261107-4192')).toBeDefined();
      expect(screen.getByText('Nguyễn Phạm Xuân Nhi')).toBeDefined();
      expect(screen.getByText('0967890123')).toBeDefined();
    });
  });

  it('5. Hợp đồng mới thanh toán chưa gán ô (storageUnitCode = "Chưa gán", relocationEligible = false) hiển thị mã HĐ (CTR-...), trạng thái "Chờ gán ô", KHÔNG bị gắn nhãn "Sự cố bàn giao" và không bị nhân đôi dòng với RSV-...', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([
      {
        id: 334,
        code: 'RSV-20261108-2857',
        contractId: 309,
        contractCode: 'CTR-20261108-6789',
        contractStatus: 'PENDING_CHECK_IN',
        facilityId: 2,
        customerId: 11,
        customerName: 'Lê Thanh Tùng',
        customerPhone: '0987654321',
        customerEmail: 'thanhtung22012006@gmail.com',
        unitTypeId: 3,
        unitTypeName: 'Kho Tiêu Chuẩn L',
        startDate: '2026-11-14',
        rentalMonths: 3,
        endDateExclusive: '2027-02-14',
        status: 'CONFIRMED',
        storageUnitId: undefined,
      } as unknown as ReservationResponse,
    ]);

    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 309,
        code: 'CTR-20261108-6789',
        reservationId: 334,
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        customerId: 11,
        customerName: 'Lê Thanh Tùng',
        customerPhone: '0987654321',
        customerEmail: 'thanhtung22012006@gmail.com',
        storageUnitId: null as unknown as number,
        storageUnitCode: 'Chưa gán',
        unitTypeId: 3,
        unitTypeName: 'Kho Tiêu Chuẩn L',
        startDate: '2026-11-14',
        endDateExclusive: '2027-02-14',
        rentalMonths: 3,
        monthlyPrice: 2400000,
        depositAmount: 2400000,
        depositBalance: 2400000,
        status: 'PENDING_CHECK_IN',
        relocationEligible: false,
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('1 đơn chờ xử lý')).toBeDefined();
      expect(screen.getByText('CTR-20261108-6789')).toBeDefined();
      expect(screen.queryByText('RSV-20261108-2857')).toBeNull();
      expect(screen.queryByText('Sự cố bàn giao')).toBeNull();
      expect(screen.queryByText('Gán lại ô kho')).toBeNull();
      expect(screen.queryByText('Đổi ô kho')).toBeNull();
      expect(screen.getByText('Chờ gán ô')).toBeDefined();
      expect(screen.getByText('Gán ô kho')).toBeDefined();
    });
  });

  it('6. Hợp đồng thực sự có sự cố bàn giao (relocationEligible = true) vẫn hiển thị "Sự cố bàn giao" và "Đổi ô kho"', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 410,
        code: 'CTR-20261108-9999',
        reservationId: 400,
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        customerId: 11,
        customerName: 'Lê Thanh Tùng',
        customerPhone: '0987654321',
        storageUnitId: 55,
        storageUnitCode: '',
        unitTypeId: 3,
        unitTypeName: 'Kho Tiêu Chuẩn L',
        startDate: '2026-11-14',
        endDateExclusive: '2027-02-14',
        rentalMonths: 3,
        monthlyPrice: 2400000,
        depositAmount: 2400000,
        depositBalance: 2400000,
        status: 'RELOCATION_PENDING',
        relocationEligible: true,
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('CTR-20261108-9999')).toBeDefined();
      expect(screen.getByText('Sự cố bàn giao')).toBeDefined();
      expect(screen.getByText('Gán lại ô kho')).toBeDefined();
      expect(screen.getByText('Đổi ô kho')).toBeDefined();
    });
  });

  it('7. Cho phép chọn Tất cả cơ sở quản lý: hiển thị đồng thời hợp đồng từ cả Cơ sở Quận 7 và Cơ sở Quận 1 kèm nhãn cơ sở', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue([
      { id: 2, name: 'Cơ sở Quận 7 - TP.HCM', code: 'FAC-Q7' } as FacilityListItem,
      { id: 5, name: 'Cơ sở Quận 1 - TP.HCM', code: 'FAC-Q1' } as FacilityListItem,
    ]);

    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 701,
        code: 'CTR-20261109-5101',
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        customerId: 1,
        customerName: 'Le Go',
        customerPhone: '0901234567',
        storageUnitId: undefined,
        storageUnitCode: '',
        unitTypeId: 1,
        unitTypeName: 'Kho Tiêu Chuẩn S',
        startDate: '2026-11-09',
        status: 'PENDING_CHECK_IN',
      } as ManagerContractItem,
      {
        id: 702,
        code: 'CTR-20261128-6202',
        facilityId: 5,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        customerId: 1,
        customerName: 'Le Go',
        customerPhone: '0901234567',
        storageUnitId: undefined,
        storageUnitCode: '',
        unitTypeId: 1,
        unitTypeName: 'Kho Tiêu Chuẩn S',
        startDate: '2026-11-28',
        status: 'PENDING_CHECK_IN',
      } as ManagerContractItem,
    ]);

    // Giả lập manager chọn 'ALL' (Tất cả cơ sở)
    localStorage.setItem('manager_selected_facility_id', 'ALL');

    render(<AllocationPage />);

    await waitFor(() => {
      // Hiển thị cả 2 hợp đồng của Quận 7 và Quận 1
      expect(screen.getByText('CTR-20261109-5101')).toBeDefined();
      expect(screen.getByText('CTR-20261128-6202')).toBeDefined();
      expect(screen.getByText('Cơ sở Quận 7 - TP.HCM')).toBeDefined();
      expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeDefined();
      expect(screen.getByText('2 đơn chờ xử lý')).toBeDefined();
    });
  });
});
