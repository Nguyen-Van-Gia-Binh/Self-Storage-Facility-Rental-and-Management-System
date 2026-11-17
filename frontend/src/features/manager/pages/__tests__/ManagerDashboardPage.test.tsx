// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ManagerDashboardPage } from '../ManagerDashboardPage';
import { getPortalUrlByRole } from '@/api/auth';
import { getNavigationForRole } from '@/layouts/navigationConfig';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn().mockResolvedValue([
    { id: 1, code: 'FAC-Q1', name: 'Cơ sở Quận 1 - TP.HCM', isActive: true },
  ]),
}));

vi.mock('@/api/unit', () => ({
  fetchStorageUnits: vi.fn().mockResolvedValue({
    content: [],
    totalElements: 12,
    totalPages: 12,
    page: 0,
    size: 1,
  }),
}));

vi.mock('@/api/reservation', () => ({
  listReservations: vi.fn().mockResolvedValue([
    { id: 101, facilityId: 1, status: 'PAID', storageUnitId: null },
    { id: 102, facilityId: 1, status: 'PAID', storageUnitId: undefined },
    { id: 103, facilityId: 1, status: 'PAID', storageUnitId: null },
    { id: 104, facilityId: 1, status: 'PAID', storageUnitId: 99 }, // đã gán -> không tính
  ]),
}));

vi.mock('@/api/contract', () => ({
  getManagerContracts: vi.fn().mockImplementation(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return Promise.resolve([
      { id: 1, facilityId: 1, status: 'PENDING_CHECK_IN', startDate: todayIso },
      { id: 2, facilityId: 1, status: 'PENDING_CHECK_IN', startDate: todayIso },
      { id: 3, facilityId: 1, status: 'PENDING_RETURN', startDate: '2026-01-01' },
      { id: 4, facilityId: 1, status: 'NOTICE_SUBMITTED', startDate: '2026-01-01' },
      { id: 5, facilityId: 1, status: 'PENDING_CHECK_IN', startDate: todayIso },
      { id: 6, facilityId: 1, status: 'ACTIVE', startDate: '2026-01-01' },
    ]);
  }),
}));

vi.mock('../../api/staffAssignmentApi', () => ({
  getManagementSupportRequests: vi.fn().mockResolvedValue([
    { id: 1, facilityId: 1, status: 'OPEN' },
    { id: 2, facilityId: 1, status: 'IN_PROGRESS' },
    { id: 3, facilityId: 1, status: 'RESOLVED' },
  ]),
}));

describe('ManagerDashboardPage & FM Portal — Chuẩn hóa Enterprise SaaS, Route đăng nhập & Việt hóa Quản lý cơ sở', () => {
  afterEach(() => {
    cleanup();
  });

  it('Mã nguồn bỏ Banner xanh đen, bỏ Emoji lời chào, bỏ Cầu vồng Icon và bỏ chữ "Mở ..." dư thừa', () => {
    const pagePath = path.resolve(
      process.cwd(),
      'src/features/manager/pages/ManagerDashboardPage.tsx'
    );
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('👋');
    expect(content).not.toContain('Chào buổi');
    expect(content).not.toContain('from-slate-900 via-blue-950');
    expect(content).not.toContain('from-teal-500');
    expect(content).not.toContain('from-purple-500');
    expect(content).not.toContain('Mở Gán ô kho');
    expect(content).not.toContain('Mở Giám sát hợp đồng');
  });

  it('Hiển thị Header phẳng, Thanh 4 KPI trực quan với dữ liệu thực và Lưới Truy cập nhanh đơn sắc', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Tổng quan Cơ sở')).toBeInTheDocument();
    expect(screen.getByText(/Cập nhật lúc:/i)).toBeInTheDocument();
    expect(screen.getByText(/Truy cập nhanh/i)).toBeInTheDocument();

    // 4 KPI Cards với số liệu từ API thực
    expect(screen.getByText('Ô kho trống')).toBeInTheDocument();
    expect(screen.getByText('Chờ gán ô kho')).toBeInTheDocument();
    expect(screen.getByText('Lịch hẹn hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Sự cố cần xử lý')).toBeInTheDocument();

    expect(await screen.findByText('12')).toBeInTheDocument();
    const pendingAllocVal = await screen.findByText('3');
    expect(pendingAllocVal.className).toContain('text-amber-600');
    expect(await screen.findByText('5')).toBeInTheDocument();
    const openIncidentsVal = await screen.findByText('2');
    expect(openIncidentsVal.className).toContain('text-rose-600');

    // Quick Access Cards không còn chữ "Mở ..."
    expect(screen.getByText('Gán ô kho')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng & Khách thuê')).toBeInTheDocument();
    expect(screen.queryByText(/^Mở /)).not.toBeInTheDocument();
  });

  it('Đăng nhập FM điều hướng thẳng vào /manager (Tổng quan cơ sở) và hiển thị tiếng Việt "Quản lý cơ sở"', () => {
    expect(getPortalUrlByRole('MANAGER')).toBe('/manager');
    expect(getPortalUrlByRole('FACILITY_MANAGER')).toBe('/manager');

    expect(getNavigationForRole('MANAGER').portalTitle).toBe('Quản lý cơ sở');

    const layoutPath = path.resolve(process.cwd(), 'src/layouts/DashboardLayout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    expect(layoutContent).toContain("MANAGER:  'Quản lý cơ sở'");
    expect(layoutContent).not.toContain("'Facility Manager'");
  });
});
