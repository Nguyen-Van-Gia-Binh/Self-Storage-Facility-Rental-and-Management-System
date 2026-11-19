// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyTasksOverview } from '../DailyTasksOverview';
import { CustomerVerificationCard } from '../CustomerVerificationCard';
import type { StaffDailyTaskReport, CheckInContract } from '@/types';

describe('Staff Desk Check-In Online Badge & Method Verification', () => {
  const mockTasks: StaffDailyTaskReport = {
    date: '2026-11-19',
    facilityId: 1,
    facilityName: 'Kho Quận 7 - TP.HCM',
    staffId: 8,
    staffName: 'Trần Văn Staff',
    pendingCheckIns: [
      {
        contractId: 201,
        contractCode: 'CTR-ONLINE-001',
        unitCode: 'Q7-STD-501',
        customerName: 'Nguyễn Văn Online',
        customerPhone: '0987654321',
        startDate: '2026-11-19',
        appointmentTime: 'Hôm nay',
        isFullyPaid: true,
        status: 'ACTIVE',
        completed: true,
        isOnlineCheckIn: true,
        conditionNote: 'Khách hàng check-in online và ký số điện tử',
      },
      {
        contractId: 202,
        contractCode: 'CTR-COUNTER-002',
        unitCode: 'Q7-STD-502',
        customerName: 'Trần Thị Quầy',
        customerPhone: '0912345678',
        startDate: '2026-11-19',
        appointmentTime: 'Hôm nay',
        isFullyPaid: true,
        status: 'ACTIVE',
        completed: true,
        isOnlineCheckIn: false,
        conditionNote: 'Bàn giao trực tiếp tại quầy',
      },
    ],
    pendingReturns: [],
    openSupportRequests: [],
  };

  it('DailyTasksOverview hiển thị badge Check-in Online cho khách tự nhận kho từ xa và Tại quầy cho khách trực tiếp', () => {
    render(
      <DailyTasksOverview
        tasks={mockTasks}
        onRefresh={vi.fn()}
      />
    );

    // Chuyển sang tab Đã xong (nhiệm vụ completed)
    const completedTab = screen.getByText(/Đã xong/i);
    fireEvent.click(completedTab);

    // Kiểm tra huy hiệu Check-in Online
    const onlineBadge = screen.getByTestId('badge-online-checkin');
    expect(onlineBadge).toBeInTheDocument();
    expect(onlineBadge).toHaveTextContent('Check-in Online');

    // Kiểm tra huy hiệu Tại quầy
    const counterBadge = screen.getByTestId('badge-counter-checkin');
    expect(counterBadge).toBeInTheDocument();
    expect(counterBadge).toHaveTextContent('Tại quầy');
  });

  it('CustomerVerificationCard hiển thị banner xác nhận khi khách hàng đã check-in online thành công', () => {
    const onlineContract: CheckInContract = {
      id: 201,
      code: 'CTR-ONLINE-001',
      reservationId: 101,
      reservationCode: 'RSV-001',
      customerId: 15,
      customerName: 'Nguyễn Văn Online',
      customerPhone: '0987654321',
      customerIdentityNumber: '079201001234',
      facilityId: 1,
      facilityName: 'Kho Quận 7 - TP.HCM',
      storageUnitId: 501,
      storageUnitCode: 'Q7-STD-501',
      floor: 1,
      position: 'Khu A',
      unitTypeId: 1,
      unitTypeName: 'Kho Tiêu Chuẩn S',
      unitTypeDimensions: '1.5m x 2.0m x 2.5m',
      startDate: '2026-11-19',
      endDateExclusive: '2026-12-19',
      rentalMonths: 1,
      monthlyPrice: 1500000,
      totalRentalFee: 1500000,
      depositAmount: 1500000,
      totalPayable: 3000000,
      isFullyPaid: true,
      status: 'ACTIVE',
      appointmentTime: 'Bắt đầu 2026-11-19',
      graceDaysRemaining: 10,
      isOnlineCheckIn: true,
      checkinConditionNote: 'Khách hàng check-in online và ký số điện tử (Đạt 4/4 tiêu chí)',
    };

    render(<CustomerVerificationCard contract={onlineContract} />);

    const banner = screen.getByTestId('verification-online-checkin-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Khách tự check-in Online & ký số điện tử');
  });
});
