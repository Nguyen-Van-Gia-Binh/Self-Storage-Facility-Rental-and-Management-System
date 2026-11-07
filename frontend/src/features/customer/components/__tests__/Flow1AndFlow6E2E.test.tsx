/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { UnitPickerModals } from '../UnitPickerModals';
import { WaitlistRegistrationModal } from '../WaitlistRegistrationModal';
import { DigitalMoveInPassModal } from '../DigitalMoveInPassModal';
import { MyUnitsTable } from '../MyUnitsTable';
import { RenewalPage } from '../../pages/RenewalPage';
import * as waitlistApi from '@/api/waitlist';
import * as customerRentalsApi from '@/api/customerRentals';
import { tokenStorage } from '@/utils/tokenStorage';
import type { MoveInPassData, RentedContract } from '@/types';
import type { ReservationResponse } from '@/api/reservation';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('E2E Customer Journey: Flow 1 (Reservation & Waitlist CRM) & Sub-flow 6.1 (Online Renewal) — Task ISS-146', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /* =========================================================================
   * 1. FLOW 1: STORAGE UNIT RESERVATION & WAITLIST CRM
   * ========================================================================= */
  describe('Flow 1: Storage Unit Reservation & Waitlist Lifecycle', () => {
    it('1.1. Chặn đơn đặt mới khi đang có đơn giữ chỗ PENDING chưa thanh toán (BR-RES-02) và hiển thị đúng tên loại kho', () => {
      const handlePayPending = vi.fn();
      const handleClosePending = vi.fn();

      const pendingMockReservation: Partial<ReservationResponse> = {
        id: 99,
        reservationCode: 'RES-PENDING-001',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        unitTypeName: 'Kho Tiêu Chuẩn S',
        storageUnitCode: 'Chua chon o',
        totalPrice: 1500000,
        status: 'PENDING',
      };

      render(
        <UnitPickerModals
          facilityInactiveModalOpen={false}
          onCloseFacilityInactive={vi.fn()}
          unitUnavailableModal={{ isOpen: false, title: '', message: '' }}
          onCloseUnitUnavailable={vi.fn()}
          pendingLimitModal={{
            isOpen: true,
            pendingReservation: pendingMockReservation,
          }}
          onClosePendingLimit={handleClosePending}
          onPayPendingReservation={handlePayPending}
        />
      );

      // Xác nhận tiêu đề và nội dung cảnh báo
      expect(screen.getByText('Quý khách đang có đơn giữ chỗ')).toBeInTheDocument();
      // Hiển thị tên hạng kho thay vì chuỗi thô 'Chua chon o'
      expect(screen.getByText(/Kho Tiêu Chuẩn S/i)).toBeInTheDocument();
      expect(screen.queryByText(/Chua chon o/i)).not.toBeInTheDocument();

      // Nhấn nút thanh toán đơn giữ chỗ
      const payButton = screen.getByRole('button', { name: /Thanh toán ô kho đang giữ chỗ/i });
      fireEvent.click(payButton);
      expect(handlePayPending).toHaveBeenCalledWith(pendingMockReservation);
    });

    it('1.2. Đăng ký Waitlist CRM khi hết ô kho trống (BR-WAT-01..06) và ghi nhận vào hàng đợi FIFO', async () => {
      vi.spyOn(tokenStorage, 'getUser').mockReturnValue({
        id: 1,
        email: 'customer@smartstorage.vn',
        role: 'CUSTOMER',
        fullName: 'Nguyễn Phạm Xuân Nhi',
        phone: '0912345678',
      } as any);

      const registerSpy = vi.spyOn(waitlistApi, 'registerWaitlist').mockResolvedValue({
        id: 1,
        waitlistCode: 'WL-2026-0001',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        unitTypeId: 10,
        unitTypeName: 'Kho Lạnh M',
        targetStartDate: '2026-12-01',
        rentalMonths: 3,
        phoneNumber: '0912345678',
        status: 'WAITING',
        queuePosition: 1,
        createdAt: '2026-11-08T00:00:00Z',
      });

      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <WaitlistRegistrationModal
          isOpen={true}
          onClose={handleClose}
          facilityId={1}
          facilityName="Cơ sở Quận 1 - TP.HCM"
          unitTypeId={10}
          unitTypeName="Kho Lạnh M"
          initialStartDate="2026-12-01"
          initialRentalMonths={3}
          onSuccess={handleSuccess}
        />
      );

      // Kiểm tra thông tin hiển thị trên modal
      expect(screen.getByText('Đăng ký Danh sách chờ (Waitlist)')).toBeInTheDocument();
      expect(screen.getByText('Kho Lạnh M')).toBeInTheDocument();

      // Nhập số điện thoại hợp lệ theo placeholder
      const phoneInput = screen.getByPlaceholderText(/0912345678/i);
      fireEvent.change(phoneInput, { target: { value: '0912345678' } });

      // Nhấn gửi đăng ký Waitlist
      const submitBtn = screen.getByRole('button', { name: /Xác nhận đăng ký/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(registerSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            facilityId: 1,
            unitTypeId: 10,
            phoneNumber: '0912345678',
            rentalMonths: 3,
          })
        );
      });

      // Màn hình thành công hiển thị giải thích hàng đợi FIFO
      await waitFor(() => {
        expect(screen.getByText('Đăng ký Danh sách chờ thành công!')).toBeInTheDocument();
        expect(screen.getByText(/hệ thống ưu tiên \(FIFO\)/i)).toBeInTheDocument();
      });
      expect(handleSuccess).toHaveBeenCalled();
    });

    it('1.3. Bảng điều khiển MyUnitsTable & Phân quyền nút Check-in online theo trạng thái gán ô', () => {
      const mockContracts: RentedContract[] = [
        {
          id: 'CTR-01',
          contractNumber: 'CTR-01-UNASSIGNED',
          facilityId: '1',
          facilityName: 'Cơ sở Quận 1',
          unitId: 'TBA',
          unitNumber: 'Chưa gán ô',
          unitTypeName: 'Kho Tiêu Chuẩn S',
          sizeCategory: 'S',
          storageType: 'STANDARD',
          startDate: '2026-11-10',
          endDate: '2026-12-10',
          monthlyRent: 1500000,
          depositHeld: 1500000,
          status: 'PENDING_CHECK_IN',
          inspectionDone: false,
          overdueDays: 0,
          overdueFee: 0,
        },
        {
          id: 'CTR-02',
          contractNumber: 'CTR-02-ASSIGNED',
          facilityId: '1',
          facilityName: 'Cơ sở Quận 1',
          unitId: 'U-101',
          unitNumber: 'Q1-A101',
          unitTypeName: 'Kho Tiêu Chuẩn S',
          sizeCategory: 'S',
          storageType: 'STANDARD',
          startDate: '2026-11-10',
          endDate: '2026-12-10',
          monthlyRent: 1500000,
          depositHeld: 1500000,
          status: 'PENDING_CHECK_IN',
          inspectionDone: false,
          overdueDays: 0,
          overdueFee: 0,
        },
      ];

      render(
        <BrowserRouter>
          <MyUnitsTable
            contracts={mockContracts}
            pendingReservations={[]}
            loading={false}
            searchQuery=""
            statusFilter="ALL"
            onClearFilters={vi.fn()}
            onViewDetail={vi.fn()}
            onChangePin={vi.fn()}
            onScheduleReturn={vi.fn()}
            onReschedulePeriod={vi.fn()}
            onOpenOverduePayment={vi.fn()}
            onCancelReturn={vi.fn()}
            onCancelPendingCheckIn={vi.fn()}
            onCancelReservation={vi.fn()}
          />
        </BrowserRouter>
      );

      // Cả 2 hợp đồng đều có nút "Vé nhận kho"
      const passButtons = screen.getAllByRole('button', { name: /Vé nhận kho/i });
      expect(passButtons.length).toBe(2);

      // Chỉ có DUY NHẤT 1 nút "Check-in online" cho hợp đồng đã gán ô (Q1-A101)
      const checkinButtons = screen.getAllByRole('button', { name: /Check-in online/i });
      expect(checkinButtons.length).toBe(1);
    });

    it('1.4. Ký số điện tử E-Handover 24/7 trên DigitalMoveInPassModal khi đã gán ô kho', () => {
      const mockPassData: MoveInPassData = {
        passCode: 'PASS-777',
        reservationId: 777,
        unitNumber: 'Q1-A101',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        facilityAddress: '45 Lê Duẩn, Quận 1',
        facilityPhone: '1900 8888',
        customerName: 'Nguyễn Phạm Xuân Nhi',
        customerPhone: '0987654321',
        customerIdentity: '079199001234',
        startDate: '2026-11-10',
        checkInWindow: '10 ngày',
        status: 'PENDING_CHECKIN',
        totalPaid: 1500000,
      };

      render(
        <DigitalMoveInPassModal
          isOpen={true}
          onClose={vi.fn()}
          passData={mockPassData}
          initialMode="checkin"
        />
      );

      // Tiêu đề & khối E-Handover 24/7 hiển thị
      expect(screen.getByText(/Check-in Online & Bàn Giao 24\/7/i)).toBeInTheDocument();
      expect(screen.getByText(/Xác nhận Ký số Bàn giao Điện tử/i)).toBeInTheDocument();

      // Hiển thị chỉ số IoT Telemetry
      expect(screen.getByText(/24\.5°C/i)).toBeInTheDocument();
      expect(screen.getByText(/52% RH/i)).toBeInTheDocument();
      expect(screen.getByText(/98% Pin/i)).toBeInTheDocument();

      // Nhập họ tên ký số và tích chọn cam kết
      const nameInput = screen.getByPlaceholderText(/Nguyễn Phạm Xuân Nhi/i);
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Phạm Xuân Nhi' } });

      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);

      // Nút kích hoạt PIN sáng lên
      const activateBtn = screen.getByRole('button', { name: /Ký số & Kích hoạt mã PIN mở kho 24\/7/i });
      expect(activateBtn).not.toBeDisabled();
      fireEvent.click(activateBtn);

      // Kích hoạt thành công: hiển thị mã PIN mở kho
      expect(screen.getByText(/Đã Ký Số Thành Công · Bàn Giao Điện Tử 24\/7/i)).toBeInTheDocument();
      expect(screen.getByText(/Mã PIN Smart Lock ô kho của bạn:/i)).toBeInTheDocument();
    });
  });

  /* =========================================================================
   * 2. SUB-FLOW 6.1: ONLINE STORAGE RENEWAL (TỰ GIA HẠN ONLINE)
   * ========================================================================= */
  describe('Sub-flow 6.1: Online Renewal Lifecycle & Capacity Conflict Handling', () => {
    it('2.1. Hợp đồng ACTIVE sắp hết hạn (<= 30 ngày) hiển thị cảnh báo đỏ và nút Gia hạn kích hoạt', () => {
      const expiringContract: RentedContract = {
        id: 'CTR-EXPIRING',
        contractNumber: 'CTR-EXP-15D',
        facilityId: '1',
        facilityName: 'Cơ sở Quận 1',
        unitId: 'U-202',
        unitNumber: 'Q1-B202',
        unitTypeName: 'Kho Tiêu Chuẩn M',
        sizeCategory: 'M',
        storageType: 'STANDARD',
        startDate: '2026-05-01',
        endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        monthlyRent: 2000000,
        depositHeld: 2000000,
        status: 'ACTIVE',
        inspectionDone: false,
        overdueDays: 0,
        overdueFee: 0,
        accessPin: '654321',
      };

      render(
        <BrowserRouter>
          <MyUnitsTable
            contracts={[expiringContract]}
            pendingReservations={[]}
            loading={false}
            searchQuery=""
            statusFilter="ALL"
            onClearFilters={vi.fn()}
            onViewDetail={vi.fn()}
            onChangePin={vi.fn()}
            onScheduleReturn={vi.fn()}
            onReschedulePeriod={vi.fn()}
            onOpenOverduePayment={vi.fn()}
            onCancelReturn={vi.fn()}
            onCancelPendingCheckIn={vi.fn()}
            onCancelReservation={vi.fn()}
          />
        </BrowserRouter>
      );

      // Cảnh báo thời hạn sắp hết
      expect(screen.getByText(/Sắp hết hạn/i)).toBeInTheDocument();

      // Nút Gia hạn kích hoạt
      const renewButton = screen.getByRole('button', { name: /Gia hạn/i });
      expect(renewButton).toBeInTheDocument();
      expect(renewButton).not.toBeDisabled();
    });

    it('2.2. Xử lý Capacity Conflict khi kỳ tiếp theo bị người khác đặt trước (CAPACITY_NOT_AVAILABLE)', async () => {
      vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue('mock-jwt-token');

      const mockContract: RentedContract = {
        id: '201',
        contractNumber: 'CTR-CONFLICT-01',
        facilityId: '1',
        facilityName: 'SmartStorage Q1',
        unitId: 'U-201',
        unitNumber: 'Q1-A201',
        unitTypeName: 'Kho Tiêu Chuẩn S',
        sizeCategory: 'S',
        storageType: 'STANDARD',
        startDate: '2026-05-01',
        endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        monthlyRent: 1200000,
        depositHeld: 1200000,
        status: 'ACTIVE',
        inspectionDone: false,
        overdueDays: 0,
        overdueFee: 0,
        accessPin: '123456',
      };

      vi.spyOn(customerRentalsApi, 'getCustomerContracts').mockResolvedValue([mockContract]);

      const conflictErr = new Error('Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo.');
      (conflictErr as any).errorCode = 'CAPACITY_NOT_AVAILABLE';
      vi.spyOn(customerRentalsApi, 'getRenewalQuote').mockRejectedValue(conflictErr);

      render(
        <MemoryRouter initialEntries={['/customer/renew/201']}>
          <Routes>
            <Route path="/customer/renew/:contractId" element={<RenewalPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Xác nhận hiển thị thông báo xung đột
      await waitFor(() => {
        expect(screen.getByText(/Ô kho Q1-A201 đã có người đặt trước cho kỳ tiếp theo/i)).toBeInTheDocument();
      });

      // Hiển thị 2 nút hướng giải quyết cho khách hàng
      expect(screen.getByRole('button', { name: /Tìm & Thuê ô kho mới tại cơ sở này/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Lên lịch nghiệm thu & Trả kho/i })).toBeInTheDocument();
    });
  });
});
