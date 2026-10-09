// frontend/src/features/manager/__tests__/ManagerStaffScheduleDrilldown.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FacilityShiftSummaryCard } from '../components/FacilityShiftSummaryCard';
import { CalendarWeekView, type DayWorkSummary } from '../components/CalendarWeekView';
import { DayShiftGrid, type ShiftInfo } from '../components/DayShiftGrid';
import { ShiftCard } from '../components/ShiftCard';
import { WorkItemCard } from '../components/WorkItemCard';
import { CheckinChecklist } from '../components/CheckinChecklist';
import { IncidentFaultDetermination } from '../components/IncidentFaultDetermination';
import { ReturnInspectionForm } from '../components/ReturnInspectionForm';
import { Sun, Sunset, Moon } from 'lucide-react';

const cleanHtml = (html: string) =>
  html
    .replace(/<!--.*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

describe('Facility Manager - Phân công nhân sự Drill-down (FM-05)', () => {
  // Test 1: Cấp 1 - FacilityShiftSummaryCard
  it('Cấp 1: FacilityShiftSummaryCard hiển thị tổng nhân viên và mini-stats 3 ca trực', () => {
    const mockFacility = {
      id: '1',
      code: 'FAC-CG',
      name: 'SmartStorage Cầu Giấy',
      address: '123 Cầu Giấy, Hà Nội',
      district: 'Cầu Giấy',
      city: 'Hà Nội',
      totalUnits: 50,
      occupiedUnits: 40,
      status: 'ACTIVE' as const,
    };

    const mockStats = {
      totalStaff: 10,
      morningStaffCount: 4,
      afternoonStaffCount: 4,
      nightStaffCount: 2,
    };

    const html = cleanHtml(
      renderToString(
        <FacilityShiftSummaryCard
          facility={mockFacility as any}
          stats={mockStats}
          onViewSchedule={vi.fn()}
        />
      )
    );

    expect(html).toContain('FAC-CG');
    expect(html).toContain('SmartStorage Cầu Giấy');
    expect(html).toContain('10 nhân viên');
    expect(html).toContain('Ca trực hôm nay');
    expect(html).toContain('Sáng');
    expect(html).toContain('Chiều');
    expect(html).toContain('Đêm');
    expect(html).toContain('Xem lịch trực');
  });

  // Test 2: Cấp 2 - CalendarWeekView
  it('Cấp 2: CalendarWeekView hiển thị thanh tuần và các ngày với số lượng công việc', () => {
    const daySummaries: DayWorkSummary[] = [
      { date: '2026-11-16', dayLabel: 'T2', dayNumber: 16, taskCount: 8, isToday: true },
      { date: '2026-11-17', dayLabel: 'T3', dayNumber: 17, taskCount: 6, isToday: false },
    ];

    const html = cleanHtml(
      renderToString(
        <CalendarWeekView
          currentDate="2026-11-16"
          selectedDate="2026-11-16"
          onSelectDate={vi.fn()}
          daySummaries={daySummaries}
          monthTitle="Tháng 11/2026"
        />
      )
    );

    expect(html).toContain('Tháng 11/2026');
    expect(html).toContain('T2');
    expect(html).toContain('16');
    expect(html).toContain('8');
    expect(html).toContain('cv');
    expect(html).toContain('Đang chọn');
  });

  // Test 3: Cấp 2 - DayShiftGrid & ShiftCard
  it('Cấp 2: DayShiftGrid và ShiftCard hiển thị 3 ca trực và mini-stats công việc nhân viên', () => {
    const shifts: ShiftInfo[] = [
      {
        id: 'MORNING',
        name: 'Ca Sáng',
        timeRange: '06:00 - 14:00',
        icon: Sun,
        colorClass: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        staffList: [
          {
            staffId: 101,
            staffName: 'Nguyễn Văn A',
            staffPhone: '0901234567',
            staffEmail: 'a@storage.vn',
            facilityId: 1,
            facilityName: 'Cầu Giấy',
            activeTaskCount: 3,
            completedTaskCount: 10,
            status: 'AVAILABLE',
          },
        ],
      },
      {
        id: 'AFTERNOON',
        name: 'Ca Chiều',
        timeRange: '14:00 - 22:00',
        icon: Sunset,
        colorClass: 'text-orange-600',
        badgeBg: 'bg-orange-50',
        staffList: [],
      },
      {
        id: 'NIGHT',
        name: 'Ca Đêm',
        timeRange: '22:00 - 06:00',
        icon: Moon,
        colorClass: 'text-indigo-600',
        badgeBg: 'bg-indigo-50',
        staffList: [],
      },
    ];

    const html = cleanHtml(
      renderToString(
        <DayShiftGrid
          shifts={shifts}
          staffTaskCountsMap={{
            101: { checkInCount: 2, returnCount: 1, incidentCount: 0 },
          }}
          onViewStaffWork={vi.fn()}
          onViewShiftWork={vi.fn()}
        />
      )
    );

    expect(html).toContain('Ca Sáng');
    expect(html).toContain('06:00 - 14:00');
    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('Check-in');
    expect(html).toContain('Trả kho');
    expect(html).toContain('Sự cố');
    expect(html).toContain('Chi tiết việc');
    expect(html).toContain('(Chưa có nhân viên trực ca này)');
  });

  // Test 4: Cấp 3 - WorkItemCard
  it('Cấp 3: WorkItemCard hiển thị loại công việc, khách hàng, ô kho và trạng thái', () => {
    const mockTask = {
      id: 1,
      taskType: 'CHECK_IN' as const,
      title: 'Bàn giao nhận kho khách mới',
      facilityId: 1,
      facilityName: 'SmartStorage Cầu Giấy',
      unitCode: 'S-101',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0901234567',
      scheduledDate: '2026-11-16',
      scheduledTime: '08:00',
      priority: 'NORMAL' as const,
      isUrgent: false,
      assignedStaffId: 101,
      assignedStaffName: 'Nguyễn Văn M',
      status: 'COMPLETED' as const,
      notes: 'Đã bàn giao hoàn tất',
      referenceCode: 'HD-001',
    };

    const html = cleanHtml(renderToString(<WorkItemCard task={mockTask} onViewDetails={vi.fn()} />));

    expect(html).toContain('Check-in bàn giao');
    expect(html).toContain('Đã hoàn thành');
    expect(html).toContain('HD-001');
    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('S-101');
    expect(html).toContain('08:00');
    expect(html).toContain('Xem chi tiết');
  });

  // Test 5: Cấp 4 - CheckinChecklist (Case A)
  it('Cấp 4: CheckinChecklist hiển thị biên bản bàn giao, mã PIN và chữ ký', () => {
    const html = cleanHtml(
      renderToString(
        <CheckinChecklist
          pinCode="123456"
          isSigned={true}
          onViewContract={vi.fn()}
          onPrintHandover={vi.fn()}
        />
      )
    );

    expect(html).toContain('Biên bản bàn giao ô kho (Check-in)');
    expect(html).toContain('1. Vệ sinh sàn & vách kho');
    expect(html).toContain('Đạt chuẩn');
    expect(html).toContain('123456');
    expect(html).toContain('✓ Đã ký nhận bàn giao');
    expect(html).toContain('Xem Hợp đồng điện tử');
    expect(html).toContain('In biên bản bàn giao');
  });

  // Test 6: Cấp 4 - IncidentFaultDetermination (Case B)
  it('Cấp 4: IncidentFaultDetermination cho phép phân định lỗi công ty vs khách hàng', () => {
    const html = cleanHtml(
      renderToString(
        <IncidentFaultDetermination
          initialFaultType="CUSTOMER"
          initialCost={200000}
          initialFeeCategory="ACCESS_KEY"
          onConfirmFault={vi.fn()}
        />
      )
    );

    expect(html).toContain('Phân định trách nhiệm lỗi & Chi phí xử lý');
    expect(html).toContain('Lỗi do Công ty / Hệ thống');
    expect(html).toContain('Lỗi do Khách hàng gây ra');
    expect(html).toContain('200.000 đ');
    expect(html).toContain('Xác nhận phân định lỗi');
  });

  // Test 7: Cấp 4 - ReturnInspectionForm (Case C)
  it('Cấp 4: ReturnInspectionForm tính toán khấu trừ cọc và tiền hoàn khách chính xác', () => {
    const html = cleanHtml(
      renderToString(
        <ReturnInspectionForm
          depositAmount={1500000}
          initialCondition="DAMAGE"
          initialCleaningFee={200000}
          initialDamageFee={500000}
          onConfirmSettlement={vi.fn()}
          onRequestRecheck={vi.fn()}
        />
      )
    );

    expect(html).toContain('Kết quả nghiệm thu trả kho & Quyết toán hoàn cọc');
    expect(html).toContain('Kho nguyên trạng sạch sẽ');
    expect(html).toContain('Có hư hại hoặc vệ sinh kém');
    expect(html).toContain('700.000 đ'); // Tổng trừ (200k + 500k)
    expect(html).toContain('800.000 đ'); // Hoàn cọc (1.500k - 700k)
    expect(html).toContain('Xác nhận quyết toán');
    expect(html).toContain('Gửi lại khách xác nhận');
  });
});
