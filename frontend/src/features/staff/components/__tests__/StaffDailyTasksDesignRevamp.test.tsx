// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen } from '@testing-library/react';
import { DailyTasksOverview } from '../DailyTasksOverview';
import { StaffWeekCalendarStrip } from '../StaffWeekCalendarStrip';
import type { StaffDailyTaskReport } from '@/types';

describe('Staff Daily Tasks — Chuẩn hóa UI Enterprise SaaS (Loại bỏ Color Overload & AI Slop)', () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    'src/features/staff/pages/StaffDashboardPage.tsx'
  );
  const calendarPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/StaffWeekCalendarStrip.tsx'
  );
  const overviewPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/DailyTasksOverview.tsx'
  );

  it('Lỗi 4 (Header): loại bỏ emoji vẫy tay/kính lúp ở StaffDashboardPage và giữ badge Đang trong ca trực', () => {
    const content = fs.readFileSync(dashboardPath, 'utf-8');
    expect(content).not.toContain('👋');
    expect(content).not.toContain('🔍');
    expect(content).toContain('Đang trong ca trực');
  });

  it('Lỗi 3 (Lịch tuần): StaffWeekCalendarStrip thu gọn thành dải ngang, ngày đang chọn dùng nền trắng + viền brand thay vì nền xanh đặc', () => {
    const content = fs.readFileSync(calendarPath, 'utf-8');
    expect(content).not.toContain('bg-teal-600 text-white');
    expect(content).toContain('border-brand-500');
    expect(content).toContain('text-brand-700');

    render(
      <StaffWeekCalendarStrip
        selectedDate="2026-11-17"
        onDateChange={() => {}}
        totalTasksForSelectedDate={2}
      />
    );

    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('Lỗi 1 & 2 (Thẻ công việc & Nút hành động): bỏ nền hồng + nút đỏ trên task trễ hạn, thay bằng viền trái đỏ 4px và nút Tiếp đón màu Xanh Mint (brand-600)', () => {
    const content = fs.readFileSync(overviewPath, 'utf-8');
    expect(content).not.toContain('bg-rose-600');
    expect(content).not.toContain('bg-rose-50/25');
    expect(content).toContain('w-1 bg-rose-500');
    expect(content).toContain('bg-brand-600');

    const mockTasks: StaffDailyTaskReport = {
      date: '2026-11-17',
      staffId: 1,
      pendingCheckIns: [
        {
          reservationId: 101,
          contractId: 201,
          contractCode: 'CTR-20261114-001',
          unitCode: 'Q7-STD-501',
          customerName: 'Lê Thanh Tùng',
          customerPhone: '0901234567',
          facilityId: 7,
          facilityName: 'Cơ sở Quận 7 - TP.HCM',
          startDate: '2026-11-14',
          isLate: true,
          daysLate: 3,
          status: 'PENDING_CHECKIN',
          completed: false,
        } as any,
      ],
      pendingReturns: [],
      openSupportRequests: [],
    };

    render(
      <DailyTasksOverview
        tasks={mockTasks}
        selectedDate="2026-11-17"
        onRefresh={() => {}}
      />
    );

    const actionButton = screen.getByRole('button', { name: /^Tiếp đón$/i });
    expect(actionButton.className).toContain('bg-brand-600');
    expect(actionButton.className).not.toContain('bg-rose-600');

    expect(screen.getByText('Q7-STD-501')).toBeInTheDocument();
    expect(screen.getByText('Trễ 3 ngày')).toBeInTheDocument();
  });
});
