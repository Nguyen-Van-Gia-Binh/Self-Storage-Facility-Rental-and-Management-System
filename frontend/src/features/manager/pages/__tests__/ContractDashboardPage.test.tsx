// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContractDashboardPage } from '../ContractDashboardPage';
import * as facilityApi from '@/api/facility';
import * as contractApi from '@/api/contract';

vi.mock('@/api/facility', () => ({
  fetchMyAssignedFacilities: vi.fn(),
}));

vi.mock('@/api/contract', () => ({
  getManagerContracts: vi.fn(),
}));

describe('ContractDashboardPage — Chuẩn hóa UI Enterprise SaaS (Compact List & High Data Density)', () => {
  const dashboardPath = path.resolve(
    process.cwd(),
    'src/features/manager/pages/ContractDashboardPage.tsx'
  );
  const cardPath = path.resolve(
    process.cwd(),
    'src/features/manager/components/FacilityContractSummaryCard.tsx'
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(facilityApi.fetchMyAssignedFacilities).mockResolvedValue([
      {
        id: 1,
        code: 'FAC-Q7',
        name: 'Cơ sở Quận 7 - TP.HCM',
        address: 'Số 10 Mai Văn Vĩnh, Phường Tân Quy, Quận 7, TP.HCM',
        phone: '028-3775-5555',
        isActive: true,
      } as any,
      {
        id: 2,
        code: 'FAC-CG',
        name: 'Cơ sở Cầu Giấy - Hà Nội',
        address: 'Số 19 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
        phone: '024-3795-8888',
        isActive: true,
      } as any,
    ]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([
      { id: 10, facilityId: 1, status: 'ACTIVE' } as any,
      { id: 11, facilityId: 1, status: 'ACTIVE' } as any,
      { id: 12, facilityId: 2, status: 'OVERDUE' } as any,
    ]);
  });

  it('Lỗi 1 & 2: xóa hoàn toàn thanh tổng quan nền đen Navy và lớp gradient trên thẻ cơ sở', () => {
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
    const cardContent = fs.readFileSync(cardPath, 'utf-8');

    expect(dashboardContent).not.toContain('from-slate-900');
    expect(dashboardContent).not.toContain('bg-gradient-to-r from-slate-900');
    expect(cardContent).not.toContain('bg-gradient-to-b');
    expect(cardContent).not.toContain('<span>Xem danh sách hợp đồng</span>');
  });

  it('Lỗi 3 & 4: hiển thị danh sách nén (Compact List) với số liệu Active / Quá hạn ngay trên từng dòng cơ sở và chấm tròn màu ngữ nghĩa ở thanh Tổng quan', async () => {
    render(
      <MemoryRouter>
        <ContractDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cơ sở Quận 7 - TP.HCM')).toBeInTheDocument();
    });

    // Thanh tổng quan sáng, không nền đen, hiển thị đúng KPI toàn hệ thống
    expect(screen.getByText('Tổng quan toàn hệ thống')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng (Active / Quá hạn)')).toBeInTheDocument();

    // Số liệu ngay trên từng dòng cơ sở
    expect(screen.getByText('2 Đang thuê')).toBeInTheDocument();
    expect(screen.getByText('0 Quá hạn')).toBeInTheDocument();
    expect(screen.getByText('0 Đang thuê')).toBeInTheDocument();
    expect(screen.getByText('1 Quá hạn')).toBeInTheDocument();
  });
});
