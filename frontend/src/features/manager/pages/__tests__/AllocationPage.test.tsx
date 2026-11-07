// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { AllocationPage } from '../AllocationPage';
import * as facilityApi from '@/api/facility';
import * as reservationApi from '@/api/reservation';
import * as staffAssignmentApi from '@/features/manager/api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { ReservationResponse } from '@/api/reservation';
import type { StaffWorkloadItem } from '@/features/manager/types/staffAssignment';
import type { StorageUnitResponse } from '@/types/unit';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('@/api/reservation', () => ({
  listReservations: vi.fn(),
  assignUnit: vi.fn(),
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
    vi.mocked(staffAssignmentApi.getStaffWorkload).mockResolvedValue(mockStaffList);
    vi.mocked(reservationApi.assignUnit).mockResolvedValue({
      id: 101,
      code: 'RES-20261107-001',
      storageUnitId: 42,
    } as ReservationResponse);
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
      expect(screen.getByText('Gán ô kho (Sơ đồ 2D)')).toBeDefined();
    });
  });

  it('2. Bấm "Gán ô kho (Sơ đồ 2D)" mở sơ đồ 2D, chọn ô cụ thể -> mở form xác nhận', async () => {
    render(<AllocationPage />);

    await waitFor(() => {
      expect(screen.getByText('RES-20261107-001')).toBeDefined();
    });

    // Bấm nút mở sơ đồ 2D
    const open2dBtn = screen.getByText('Gán ô kho (Sơ đồ 2D)');
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

    fireEvent.click(screen.getAllByText('Gán ô kho (Sơ đồ 2D)')[0]);
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
    const staffSelect = screen.getByRole('combobox');
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
});
