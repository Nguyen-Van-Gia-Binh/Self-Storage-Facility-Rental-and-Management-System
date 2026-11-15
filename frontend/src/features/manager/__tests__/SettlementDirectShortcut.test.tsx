// @vitest-environment jsdom
// frontend/src/features/manager/__tests__/SettlementDirectShortcut.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffDailyScheduleModal } from '../components/StaffDailyScheduleModal';
import { DailyTasksDispatchBoard } from '../components/DailyTasksDispatchBoard';
import type { DailyDispatchTaskItem, StaffWorkloadItem } from '../types/staffAssignment';
import type { StaffDailyTaskReport } from '@/types';
import * as staffApi from '../api/staffAssignmentApi';

vi.mock('../api/staffAssignmentApi', async () => {
  const actual = await vi.importActual<typeof staffApi>('../api/staffAssignmentApi');
  return {
    ...actual,
    getStaffDailySchedule: vi.fn(),
  };
});

describe('Settlement Direct Shortcut Suite (Nút tắt điều hướng trực tiếp Quyết toán)', () => {
  it('StaffDailyScheduleModal: hiển thị nút Duyệt quyết toán cho mỗi lượt hẹn trả kho của nhân viên', async () => {
    const mockStaff: StaffWorkloadItem = {
      staffId: 101,
      staffName: 'Nguyễn Văn Nhân Viên',
      facilityId: 1,
      facilityName: 'Cơ sở Cầu Giấy',
      assignedTasksCount: 2,
      activeTasksCount: 2,
      completedTodayCount: 0,
      activeCheckInTasksCount: 0,
      activeReturnTasksCount: 1,
      activeIncidentTasksCount: 0,
      activeOverlockTasksCount: 0,
      currentAssignedTasks: [],
    };

    const mockReport: StaffDailyTaskReport = {
      staffId: 101,
      staffName: 'Nguyễn Văn Nhân Viên',
      pendingCheckIns: [],
      pendingReturns: [
        {
          contractId: 777,
          contractCode: 'HD-777-TEST',
          unitCode: 'UNIT-B01',
          customerName: 'Trần Văn Khách Trả',
          customerPhone: '0988776655',
          depositAmount: 1500000,
          returnDate: '2026-11-16',
          status: 'PENDING_RETURN',
        },
      ],
      openSupportRequests: [],
    };

    vi.mocked(staffApi.getStaffDailySchedule).mockResolvedValue(mockReport);

    render(
      <MemoryRouter>
        <StaffDailyScheduleModal
          isOpen={true}
          onClose={vi.fn()}
          staff={mockStaff}
        />
      </MemoryRouter>
    );

    const btn = await screen.findByRole('button', { name: /Duyệt quyết toán/i });
    expect(btn).toBeDefined();
    expect(screen.getByText(/HD-777-TEST/)).toBeDefined();
    expect(screen.getByText('UNIT-B01')).toBeDefined();
  });

  it('DailyTasksDispatchBoard: hiển thị nút Duyệt quyết toán cho task trả kho RETURN', () => {
    const mockTasks: DailyDispatchTaskItem[] = [
      {
        id: 200555,
        taskType: 'RETURN',
        title: 'Nghiệm thu trả kho hợp đồng HD-555',
        facilityId: 1,
        facilityName: 'Cơ sở SmartStorage',
        unitCode: 'U-555',
        customerName: 'Lê Thị Thu',
        customerPhone: '0912345678',
        scheduledDate: '2026-11-16',
        scheduledTime: '10:00',
        priority: 'NORMAL',
        isUrgent: false,
        status: 'COMPLETED',
        referenceId: 555,
        referenceCode: 'HD-555',
      },
    ];

    render(
      <MemoryRouter>
        <DailyTasksDispatchBoard
          tasks={mockTasks}
          selectedStaffIdFilter={null}
          onClearStaffFilter={vi.fn()}
          onAssignClick={vi.fn()}
        />
      </MemoryRouter>
    );

    const settlementButtons = screen.getAllByRole('button', { name: /Duyệt quyết toán/i });
    expect(settlementButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /HĐ: HD-555 ↗/i })).toBeDefined();
  });
});
