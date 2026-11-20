// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { AllocationPage } from '../AllocationPage';
import * as facilityApi from '@/api/facility';
import * as reservationApi from '@/api/reservation';
import * as contractApi from '@/api/contract';
import * as staffAssignmentApi from '@/features/manager/api/staffAssignmentApi';
import * as unitApi from '@/api/unit';
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

vi.mock('@/api/unit', () => ({
  fetchStorageUnits: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  fetchUnitTypes: vi.fn().mockResolvedValue([]),
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
    highlightUnitId,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelectUnit: (unit: StorageUnitResponse) => void;
    highlightUnitId?: number;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-floor-plan-modal">
        <span>Sơ đồ mặt bằng 2D Modal</span>
        {highlightUnitId != null && <span data-testid="highlighted-unit-id">{highlightUnitId}</span>}
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
        <button
          type="button"
          data-testid="select-mock-swap-unit-btn"
          onClick={() =>
            onSelectUnit({
              id: 88,
              code: 'Q7-AC-M205',
              facilityId: 2,
              unitTypeId: 5,
              floor: 2,
              position: 'Khu B',
              status: 'AVAILABLE',
            } as StorageUnitResponse)
          }
        >
          Chọn ô Q7-AC-M205
        </button>
        <button
          type="button"
          data-testid="select-mock-upgrade-unit-btn"
          onClick={() =>
            onSelectUnit({
              id: 95,
              code: 'Q7-AC-XL101',
              facilityId: 2,
              unitTypeId: 8,
              unitTypeName: 'Kho Máy Lạnh XL',
              floor: 1,
              position: 'Khu A',
              status: 'AVAILABLE',
            } as StorageUnitResponse)
          }
        >
          Chọn ô Q7-AC-XL101
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

    // Kiểm tra thông tin đơn hàng & khách hàng được hiển thị phẳng, rõ ràng trên form modal
    expect(screen.getByText('Thông tin đơn hàng')).toBeDefined();
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

  it('6. Hợp đồng thực sự có sự cố bàn giao (relocationEligible = true) vẫn hiển thị "Sự cố bàn giao", badge "Cần đổi ô (Sự cố)" và nút chính màu Mint "Gán ô kho"', async () => {
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
      expect(screen.getByText('Cần đổi ô (Sự cố)')).toBeDefined();
      const actionBtn = screen.getByRole('button', { name: /Gán ô kho/i });
      expect(actionBtn.className).toContain('bg-brand-600');
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
      expect(screen.getAllByText('Cơ sở Quận 7 - TP.HCM').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Cơ sở Quận 1 - TP.HCM').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('2 đơn chờ xử lý')).toBeDefined();
    });
  });

  it('8. Đơn đã gán ô kho (isAssigned = true) KHÔNG biến mất khỏi danh sách, hiển thị badge "Đã gán: ..." và nút viền xám "Đổi ô"', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 705,
        code: 'CTR-20261109-5101',
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        customerId: 1,
        customerName: 'Le Go',
        customerPhone: '0901234567',
        storageUnitId: 42,
        storageUnitCode: 'Q7-AC-M101',
        unitTypeId: 5,
        unitTypeName: 'Kho Máy Lạnh M (6m²)',
        startDate: '2026-11-09',
        status: 'PENDING_CHECK_IN',
        assignedStaffName: 'Trần Thị Nhân Viên',
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('CTR-20261109-5101')).toBeDefined();
      expect(screen.getByText('Đã gán: Q7-AC-M101')).toBeDefined();
      expect(screen.getByText('NV: Trần Thị Nhân Viên')).toBeDefined();
      const swapBtn = screen.getByRole('button', { name: /^Đổi ô$/i });
      expect(swapBtn.className).toContain('bg-white');
      expect(swapBtn.className).not.toContain('bg-indigo-600');
    });
  });

  it('9. Bấm "Đổi ô" cho đơn đã gán mở sơ đồ 2D (có highlightUnitId), chọn ô mới và gọi đổi ô thành công theo BR-AVL-04', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([
      {
        id: 555,
        code: 'RSV-20261109-5555',
        contractId: 705,
        contractCode: 'CTR-20261109-5101',
        facilityId: 2,
        storageUnitId: 42,
        storageUnitCode: 'Q7-AC-M101',
        unitTypeId: 5,
        unitTypeName: 'Kho Máy Lạnh M (6m²)',
        startDate: '2026-11-09',
        status: 'CONFIRMED',
        customerName: 'Le Go',
        customerPhone: '0901234567',
      } as unknown as ReservationResponse,
    ]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 705,
        code: 'CTR-20261109-5101',
        reservationId: 555,
        facilityId: 2,
        customerId: 1,
        customerName: 'Le Go',
        customerPhone: '0901234567',
        storageUnitId: 42,
        storageUnitCode: 'Q7-AC-M101',
        unitTypeId: 5,
        unitTypeName: 'Kho Máy Lạnh M (6m²)',
        startDate: '2026-11-09',
        status: 'PENDING_CHECK_IN',
        assignedStaffId: 2,
        assignedStaffName: 'Trần Thị Nhân Viên',
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('CTR-20261109-5101')).toBeDefined();
    });

    // Bấm nút "Đổi ô"
    const reassignBtn = screen.getByRole('button', { name: /^Đổi ô$/i });
    fireEvent.click(reassignBtn);

    // Modal sơ đồ 2D hiển thị với highlightUnitId là ô 42
    await waitFor(() => {
      expect(screen.getByTestId('mock-floor-plan-modal')).toBeDefined();
      expect(screen.getByTestId('highlighted-unit-id').textContent).toBe('42');
    });

    // Chọn ô mới Q7-AC-M205 (ID 88)
    fireEvent.click(screen.getByTestId('select-mock-swap-unit-btn'));

    // Modal xác nhận đổi ô kho mở ra
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xác nhận đổi ô kho trước ngày nhận/i })).toBeDefined();
      expect(screen.getByText('Q7-AC-M205')).toBeDefined();
      expect(screen.getByText('Q7-AC-M101')).toBeDefined();
    });

    // Bấm nút xác nhận đổi sang ô mới
    const confirmSwapBtn = screen.getByRole('button', { name: /Xác nhận đổi sang ô Q7-AC-M205/i });
    fireEvent.click(confirmSwapBtn);

    await waitFor(() => {
      expect(reservationApi.assignUnit).toHaveBeenCalledWith(555, expect.objectContaining({
        storageUnitId: 88,
      }));
    });
  });

  it('10. Bộ lọc tab: Lọc chính xác giữa "Tất cả", "Chưa gán ô" và "Đã gán ô (Có thể đổi)"', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 801,
        code: 'CTR-UNASSIGNED-01',
        facilityId: 2,
        storageUnitId: null as unknown as number,
        storageUnitCode: 'Chưa gán',
        unitTypeId: 5,
        unitTypeName: 'Kho Tiêu Chuẩn S',
        startDate: '2026-11-10',
        status: 'PENDING_CHECK_IN',
      } as ManagerContractItem,
      {
        id: 802,
        code: 'CTR-ASSIGNED-02',
        facilityId: 2,
        storageUnitId: 99,
        storageUnitCode: 'Q7-S101',
        unitTypeId: 5,
        unitTypeName: 'Kho Tiêu Chuẩn S',
        startDate: '2026-11-12',
        status: 'PENDING_CHECK_IN',
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    // Mặc định ở tab "Tất cả (2)"
    await waitFor(() => {
      expect(screen.getByText('Tất cả (2)')).toBeDefined();
      expect(screen.getByText('CTR-UNASSIGNED-01')).toBeDefined();
      expect(screen.getByText('CTR-ASSIGNED-02')).toBeDefined();
    });

    // Chuyển sang tab "Chưa gán ô / Cần đổi (1)"
    fireEvent.click(screen.getByText('Chưa gán ô / Cần đổi (1)'));
    await waitFor(() => {
      expect(screen.getByText('CTR-UNASSIGNED-01')).toBeDefined();
      expect(screen.queryByText('CTR-ASSIGNED-02')).toBeNull();
    });

    // Chuyển sang tab "Đã gán ô (1)"
    fireEvent.click(screen.getByText('Đã gán ô (1)'));
    await waitFor(() => {
      expect(screen.queryByText('CTR-UNASSIGNED-01')).toBeNull();
      expect(screen.getByText('CTR-ASSIGNED-02')).toBeDefined();
    });
  });

  it('11. Đồng bộ tải ban đầu: Tự động dùng cơ sở phân công đầu tiên, không query rỗng gây giật số lượng đơn và giữ dropdown ổn định', async () => {
    localStorage.removeItem('manager_selected_facility_id');
    vi.mocked(reservationApi.listReservations).mockResolvedValue(mockReservations);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([]);

    render(<AllocationPage />);

    // Kiểm tra dropdown hiển thị đúng cơ sở được phân công
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDefined();
      expect(screen.getAllByText('Cơ sở Quận 7 - TP.HCM').length).toBeGreaterThanOrEqual(1);
    });

    // Đảm bảo listReservations được gọi với đúng facilityId = 2, không bị gọi không có facilityId
    expect(reservationApi.listReservations).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId: 2,
      })
    );
  });

  it('12. Chuẩn hóa UI Enterprise SaaS: không còn cầu vồng nút cam/tím, bỏ emoji thừa, bỏ Box Soup trong Modal và đồng bộ Soft Badges', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pagePath = path.resolve(
      process.cwd(),
      'src/features/manager/pages/AllocationPage.tsx'
    );
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('bg-indigo-600');
    expect(content).not.toContain('bg-amber-600');
    expect(content).not.toContain('🏢');
    expect(content).not.toContain('💡');
    // Modal Xác nhận phân bổ ô kho đã làm phẳng: không còn khung xanh nhạt bg-sky-50 hay hộp mã đơn/mã kho
    expect(content).not.toContain('bg-sky-50/70');
    expect(content).toContain('<hr className="border-gray-100 my-4" />');
  });

  it('13. Modal điều chuyển ô kho (sự cố + nâng hạng): bỏ icon đũa thần Sparkles, bỏ bôi đỏ ngày bắt đầu, hiện rõ chuyển từ ô cũ -> ô mới và dùng nút Primary Xanh dương', async () => {
    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 6357,
        code: 'CTR-20261111-6357',
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        customerId: 11,
        customerName: 'Lê Thanh Tùng',
        customerPhone: '0868268970',
        customerEmail: 'thanhtung22012006@gmail.com',
        storageUnitId: 501,
        storageUnitCode: 'Q7-STD-501',
        unitTypeId: 5,
        unitTypeName: 'Kho Máy Lạnh M',
        startDate: '2026-11-14',
        endDateExclusive: '2027-02-14',
        rentalMonths: 3,
        status: 'RELOCATION_PENDING',
        relocationEligible: true,
        assignedStaffId: 9,
        assignedStaffName: 'Trần Văn Hùng',
      } as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('CTR-20261111-6357')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Gán ô kho/i }));
    await waitFor(() => expect(screen.getByTestId('select-mock-upgrade-unit-btn')).toBeDefined());
    fireEvent.click(screen.getByTestId('select-mock-upgrade-unit-btn'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xác nhận điều chuyển ô kho/i })).toBeDefined();
    });

    // Không còn icon Sparkles (đũa thần AI Slop) trong modal
    expect(document.body.innerHTML).not.toContain('lucide-sparkles');
    // Hiển thị chuyển dịch từ ô cũ (Q7-STD-501) sang ô mới (Q7-AC-XL101)
    expect(screen.getByText('Q7-STD-501')).toBeDefined();
    expect(screen.getByText('Q7-AC-XL101')).toBeDefined();

    // Ngày bắt đầu hợp đồng dùng text đen/xám chuẩn, KHÔNG bôi đỏ như lỗi
    const contractDateEl = screen.getByTestId('modal-contract-date');
    expect(contractDateEl.textContent).toBe('14/11/2026');
    expect(contractDateEl.className).not.toContain('text-rose-700');
    expect(contractDateEl.className).not.toContain('bg-rose-50');

    // Nút xác nhận điều chuyển dùng màu Primary Xanh dương (bg-blue-600)
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận điều chuyển/i });
    expect(confirmBtn.className).toContain('bg-blue-600');
    expect(confirmBtn.className).toContain('text-white');
  });

  it('14. Khi cơ sở cháy kho 100% (không còn ô trống cùng loại hoặc nâng hạng): bỏ hoàn toàn nút Gán ô kho, chỉ hiển thị nút Phạt cọc 2x (BR-BMP-02)', async () => {
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue([mockFacilities[0]]);
    vi.mocked(reservationApi.listReservations).mockResolvedValue([]);

    // Mock cơ sở có 1 ô nhưng đã bị OCCUPIED (không còn ô AVAILABLE nào -> Cháy kho 100%)
    vi.mocked(unitApi.fetchStorageUnits).mockResolvedValue({
      content: [
        {
          id: 101,
          unitCode: 'Q7-AC-XL101',
          facilityId: 2,
          unitTypeId: 5,
          status: 'OCCUPIED',
        } as StorageUnitResponse,
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 10,
    });
    vi.mocked(unitApi.fetchUnitTypes).mockResolvedValue([
      {
        id: 5,
        typeName: 'Kho Máy Lạnh XL',
        environment: 'CLIMATE_CONTROLLED',
        areaM2: 20,
      } as any,
    ]);

    // Hợp đồng gặp sự cố cần đổi ô nhưng cơ sở đã cháy kho
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      {
        id: 9999,
        code: 'CTR-20261120-5225',
        reservationCode: 'RSV-20261120-9999',
        customerName: 'Lê Thanh Tùng',
        customerPhone: '0868268970',
        customerEmail: 'thanhtung@gmail.com',
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        unitTypeId: 5,
        unitTypeName: 'Kho Máy Lạnh XL',
        storageUnitId: null,
        storageUnitCode: 'Chờ gán lại ô kho',
        rentalMonths: 3,
        status: 'ACTIVE',
        relocationEligible: true,
        startDate: '2026-11-20',
        endDate: '2027-02-20',
      } as unknown as ManagerContractItem,
    ]);

    render(<AllocationPage />);

    // Đợi danh sách nạp xong
    await waitFor(() => {
      expect(screen.getByText('CTR-20261120-5225')).toBeDefined();
    });

    // 1. Phải có huy hiệu Cháy kho 100%
    expect(screen.getByText(/Cháy kho 100%/i)).toBeDefined();

    // 2. Nút "Gán ô kho" hoặc "Đổi ô" PHẢI BỊ BỎ ĐI HOÀN TOÀN
    expect(screen.queryByRole('button', { name: /Gán ô kho/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Đổi ô/i })).toBeNull();

    // 3. Nút "Phạt cọc 2x (BR-BMP-02)" PHẢI XUẤT HIỆN
    const penaltyBtn = screen.getByTestId('btn-allocation-double-deposit');
    expect(penaltyBtn).toBeDefined();
    expect(penaltyBtn.textContent).toContain('Phạt cọc 2x (BR-BMP-02)');

    // 4. Bấm vào nút Phạt cọc 2x -> Modal Bồi thường phạt cọc gấp đôi phải mở ra
    fireEvent.click(penaltyBtn);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Kích hoạt Bồi thường Phạt cọc Gấp đôi/i })).toBeDefined();
    });
    expect(screen.getAllByText(/Điều 328 Bộ luật Dân sự 2015/i).length).toBeGreaterThanOrEqual(1);
  });
});
