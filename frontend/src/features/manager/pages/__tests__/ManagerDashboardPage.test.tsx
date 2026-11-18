// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ManagerDashboardPage } from '../ManagerDashboardPage';
import { getPortalUrlByRole } from '@/api/auth';
import { getNavigationForRole } from '@/layouts/navigationConfig';

function getIsoOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn().mockResolvedValue([
    { id: 1, code: 'FAC-Q1', name: 'Cơ sở Quận 1 - TP.HCM', isActive: true },
  ]),
}));

vi.mock('@/api/unit', () => ({
  fetchStorageUnits: vi.fn().mockResolvedValue({
    content: [
      { id: 101, facilityId: 1, unitTypeId: 1, code: 'Q1-A101', floor: 1, status: 'OCCUPIED', unitTypeName: 'Kho Tiêu Chuẩn S' },
      { id: 102, facilityId: 1, unitTypeId: 1, code: 'Q1-A102', floor: 1, status: 'AVAILABLE', unitTypeName: 'Kho Tiêu Chuẩn S' },
      { id: 103, facilityId: 1, unitTypeId: 1, code: 'Q1-A103', floor: 1, status: 'MAINTENANCE', unitTypeName: 'Kho Tiêu Chuẩn M' },
      { id: 201, facilityId: 1, unitTypeId: 2, code: 'Q1-B201', floor: 2, status: 'AVAILABLE', unitTypeName: 'Kho Máy Lạnh M' },
    ],
    totalElements: 4,
    totalPages: 1,
    page: 0,
    size: 500,
  }),
}));

vi.mock('@/api/reservation', () => ({
  listReservations: vi.fn().mockResolvedValue([
    { id: 101, facilityId: 1, status: 'PAID', storageUnitId: null },
    { id: 102, facilityId: 1, status: 'PAID', storageUnitId: undefined },
    { id: 103, facilityId: 1, status: 'PAID', storageUnitId: 99 },
  ]),
}));

vi.mock('@/api/contract', () => ({
  getManagerContracts: vi.fn().mockImplementation(() => {
    const todayIso = getIsoOffset(0);
    const in5Days = getIsoOffset(5);
    const in40Days = getIsoOffset(40);
    return Promise.resolve([
      {
        id: 1,
        code: 'CTR-202611-001',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        storageUnitId: 101,
        storageUnitCode: 'Q1-A101',
        customerName: 'Nguyễn Văn An',
        status: 'ACTIVE',
        startDate: todayIso,
        endDateExclusive: in5Days,
        monthlyPrice: 1200000,
      },
      {
        id: 2,
        code: 'CTR-202611-002',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        storageUnitId: 102,
        storageUnitCode: 'Q1-A102',
        customerName: 'Trần Minh Khôi',
        status: 'PENDING_CHECK_IN',
        startDate: todayIso,
        endDateExclusive: in40Days,
        monthlyPrice: 1500000,
      },
      {
        id: 3,
        code: 'CTR-202611-003',
        facilityId: 1,
        facilityName: 'Cơ sở Quận 1 - TP.HCM',
        storageUnitId: 201,
        storageUnitCode: 'Q1-B201',
        customerName: 'Lê Thu Hà',
        status: 'OVERDUE',
        startDate: '2026-08-01',
        endDateExclusive: getIsoOffset(-2),
        monthlyPrice: 900000,
      },
    ]);
  }),
}));

vi.mock('../../api/staffAssignmentApi', () => ({
  getManagementSupportRequests: vi.fn().mockResolvedValue([
    {
      id: 501,
      code: 'SUP-501',
      facilityId: 1,
      storageUnitId: 103,
      storageUnitCode: 'Q1-A103',
      description: 'Hỏng đèn khu vực hành lang',
      status: 'OPEN',
    },
    {
      id: 502,
      code: 'SUP-502',
      facilityId: 1,
      storageUnitId: 102,
      storageUnitCode: 'Q1-A102',
      description: 'Đã xử lý xong',
      status: 'RESOLVED',
    },
  ]),
}));

describe('ManagerDashboardPage — Operational Cockpit (Enterprise B2B)', () => {
  afterEach(() => {
    cleanup();
  });

  it('Mã nguồn giữ chuẩn Anti AI Slop: bỏ Banner xanh đen, bỏ Emoji lời chào, bỏ Cầu vồng Icon và bỏ 5 thẻ Truy cập nhanh thưa thớt', () => {
    const pagePath = path.resolve(
      process.cwd(),
      'src/features/manager/pages/ManagerDashboardPage.tsx'
    );
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).not.toContain('👋');
    expect(content).not.toContain('Chào buổi');
    expect(content).not.toContain('from-slate-900 via-blue-950');
    expect(content).not.toContain('min-h-[152px]');
    expect(content).not.toContain('Mở Gán ô kho');
  });

  it('Khu vực 1 (Command Center): Hiển thị Tình hình kho (Progress Bar + cảnh báo sắp hết hạn), Action Queue định hướng hành động và Sparkline Hiệu suất', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Tổng quan Cơ sở' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Làm mới/i })).toBeInTheDocument();

    // Khối 1: Occupancy + Progress Bar + cảnh báo sắp hết hạn trong 7 ngày
    await waitFor(() => {
      expect(screen.getByText('1/4')).toBeInTheDocument();
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/1 ô kho sắp hết hạn hợp đồng trong 7 ngày tới/i)).toBeInTheDocument();

    // Khối 2: Action Queue hiển thị rõ việc cần làm ngay + nút xử lý
    expect(screen.getByText(/Việc cần làm ngay/i)).toBeInTheDocument();
    expect(screen.getByText(/1 sự cố \(Q1-A103\)/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Xử lý$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Gán ô$/i })).toBeInTheDocument();

    // Khối 3: Performance Sparkline
    expect(screen.getByTestId('performance-sparkline')).toBeInTheDocument();
  }, 15000);

  it('Khu vực 2 (Workspace) & Khu vực 3 (Mini-Map): Bảng hợp đồng gần đây có tìm kiếm/lọc, Lối tắt nghiệp vụ 1 dòng và Sơ đồ mặt bằng thu nhỏ theo tầng', async () => {
    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CTR-202611-001')).toBeInTheDocument();
    });

    // Bảng Hợp đồng & Giao dịch gần đây (Stripe-style table)
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table.textContent).toContain('Nguyễn Văn An');
    expect(table.textContent).toContain('CTR-202611-003');

    // Tìm kiếm hoạt động ngay trên bảng
    const searchInput = screen.getByPlaceholderText(/Tìm mã HĐ, khách thuê, ô kho/i);
    fireEvent.change(searchInput, { target: { value: 'Lê Thu Hà' } });
    expect(table.textContent).toContain('CTR-202611-003');
    expect(table.textContent).not.toContain('CTR-202611-001');

    // Lối tắt nghiệp vụ dạng list 1 dòng gọn gàng
    expect(screen.getByText('Lối tắt nghiệp vụ')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gán ô kho/i })).toHaveAttribute('href', '/manager/allocation');
    expect(screen.getByRole('link', { name: /Danh sách chờ/i })).toHaveAttribute('href', '/manager/waitlists');

    // Khu vực 3: Mini-Map Mặt bằng Cơ sở theo tầng
    const miniMap = screen.getByTestId('dashboard-floor-minimap');
    expect(miniMap).toBeInTheDocument();
    expect(miniMap.textContent).toContain('Q1-A101');
    expect(miniMap.textContent).toContain('Q1-A103');

    // Chuyển sang Tầng 2 trên Mini-Map
    fireEvent.click(screen.getByRole('button', { name: /Tầng 2/i }));
    expect(miniMap.textContent).toContain('Q1-B201');
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
