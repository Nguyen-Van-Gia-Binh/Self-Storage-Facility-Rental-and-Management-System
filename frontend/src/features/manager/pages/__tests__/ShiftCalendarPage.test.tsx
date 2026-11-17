// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShiftCalendarPage } from '../ShiftCalendarPage';
import * as facilityApi from '@/api/facility';
import * as staffAssignApi from '../../api/staffAssignmentApi';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('../../api/staffAssignmentApi', async () => {
  const actual = await vi.importActual<typeof staffAssignApi>('../../api/staffAssignmentApi');
  return {
    ...actual,
    getStaffWorkload: vi.fn(),
    getDailyDispatchTasks: vi.fn(),
    assignStaffToTask: vi.fn(),
  };
});

describe('ShiftCalendarPage & WorkItemCard — Chuẩn hóa UI Enterprise SaaS (Table Đội ngũ & Giảm Badge Overload)', () => {
  const shiftPagePath = path.resolve(
    process.cwd(),
    'src/features/manager/pages/ShiftCalendarPage.tsx'
  );
  const workItemCardPath = path.resolve(
    process.cwd(),
    'src/features/manager/components/WorkItemCard.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue([
      {
        id: 5,
        code: 'FAC-BN',
        name: 'Cơ sở KCN Yên Phong - Bắc Ninh',
        address: 'KCN Yên Phong 1, Bắc Ninh',
        isActive: true,
      } as any,
    ]);
    vi.mocked(staffAssignApi.getStaffWorkload).mockResolvedValue([
      {
        staffId: 10,
        staffName: 'Trần Thị Nhân Viên',
        staffPhone: '0912345678',
        staffEmail: 'staff@storage.vn',
        activeTaskCount: 1,
        completedTaskCount: 0,
      } as any,
      {
        staffId: 11,
        staffName: 'Trần Văn Hùng',
        staffPhone: '0934567891',
        staffEmail: 'hung@storage.vn',
        activeTaskCount: 2,
        completedTaskCount: 0,
      } as any,
    ]);
    vi.mocked(staffAssignApi.getDailyDispatchTasks).mockResolvedValue([
      {
        id: 901,
        taskType: 'CHECK_IN',
        status: 'UNASSIGNED',
        title: 'Tiếp đón bàn giao kho cho hợp đồng CTR-20261117-8991',
        referenceCode: 'CTR-20261117-8991',
        customerName: 'Nhật Huynh',
        customerPhone: '0349380691',
        unitCode: 'Chưa gán',
        scheduledDate: '2026-11-17',
      } as any,
    ]);
  });

  it('Cấu trúc code: Tab chính dạng gạch chân, Tab Đội ngũ nhân sự dùng Data Table và Empty State gọn không dùng border-dashed to', () => {
    const pageContent = fs.readFileSync(shiftPagePath, 'utf-8');
    const cardContent = fs.readFileSync(workItemCardPath, 'utf-8');

    // Tabs gạch chân thay cho nút viên thuốc
    expect(pageContent).toContain('border-b-2');
    // Bảng nhân sự (table) thay cho Card Grid 4 cột
    expect(pageContent).toContain('<table');
    expect(pageContent).not.toContain('xl:grid-cols-4');
    // Empty state gọn gàng, không dùng border-dashed
    expect(pageContent).not.toContain('border-dashed');
    // WorkItemCard bỏ badge loại công việc thừa, chỉ giữ 1 status badge + text thường
    expect(cardContent).not.toContain('getTypeBadge');
  });

  it('Render Tab Điều phối công việc và Tab Đội ngũ nhân sự dạng bảng với Empty State thu gọn', async () => {
    render(
      <MemoryRouter initialEntries={['/manager/staff-schedule/5?date=2026-11-17']}>
        <Routes>
          <Route path="/manager/staff-schedule/:facilityId" element={<ShiftCalendarPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CTR-20261117-8991')).toBeInTheDocument();
    });

    // Tab 1: hiển thị trạng thái Chờ xử lý, khách hàng và nút Phân công
    expect(screen.getByText('Chờ xử lý')).toBeInTheDocument();
    expect(screen.getByText('Chưa gán nhân sự')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Phân công$/i })).toBeInTheDocument();

    // Chuyển sang Tab 2: Đội ngũ nhân sự dạng Table
    fireEvent.click(screen.getByRole('button', { name: /Đội ngũ nhân sự/i }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Nhân Viên')).toBeInTheDocument();
    expect(screen.getByText('Trần Văn Hùng')).toBeInTheDocument();

    // Click Xem việc của nhân viên chưa có task -> hiện Empty State gọn gàng
    const viewButtons = screen.getAllByRole('button', { name: /Xem việc/i });
    fireEvent.click(viewButtons[0]);

    expect(
      screen.getByText(/Chưa có nhiệm vụ nào được giao cho nhân viên này/i)
    ).toBeInTheDocument();
  });
});
