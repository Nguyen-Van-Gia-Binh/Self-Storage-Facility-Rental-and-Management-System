// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyWaitlistsTable } from '../MyWaitlistsTable';
import type { WaitlistResponse } from '@/types/waitlist';

const makeWaitlist = (overrides: Partial<WaitlistResponse>): WaitlistResponse => ({
  id: 1,
  customerId: 10,
  facilityId: 2,
  facilityName: 'Cơ sở Quận 1 - TP.HCM',
  unitTypeId: 3,
  unitTypeCode: 'CLIMATE_S',
  unitTypeName: 'Kho Máy Lạnh S',
  targetStartDate: '2026-12-20',
  rentalMonths: 3,
  status: 'WAITING',
  contactPhone: '0967890123',
  createdAt: '2026-11-18T02:00:00Z',
  updatedAt: '2026-11-18T02:00:00Z',
  ...overrides,
});

describe('MyWaitlistsTable & Customer Waitlist Integration — Chuẩn Enterprise SaaS (Chống AI Slop)', () => {
  afterEach(() => {
    cleanup();
  });

  it('Hiển thị đúng 4 nhóm màu trạng thái ngữ nghĩa, ngày DD/MM/YYYY, làm mờ dòng đã đóng và không lộ mã BR nội bộ', () => {
    const items: WaitlistResponse[] = [
      makeWaitlist({ id: 1, unitTypeName: 'Kho Máy Lạnh S', status: 'WAITING', targetStartDate: '2026-12-20' }),
      makeWaitlist({ id: 2, unitTypeName: 'Kho Tiêu Chuẩn M', status: 'CONTACTING', assignedFmName: 'Nguyễn Văn Gia Bình' }),
      makeWaitlist({ id: 3, unitTypeName: 'Kho Tiêu Chuẩn L', status: 'CONVERTED' }),
      makeWaitlist({ id: 4, unitTypeName: 'Kho Tiêu Chuẩn XS', status: 'CANCELLED' }),
    ];

    render(
      <MemoryRouter>
        <MyWaitlistsTable
          waitlists={items}
          loading={false}
          cancellingId={null}
          onCancel={vi.fn()}
          onViewContracts={vi.fn()}
        />
      </MemoryRouter>
    );

    // Định dạng ngày DD/MM/YYYY
    expect(screen.getAllByText('20/12/2026').length).toBeGreaterThanOrEqual(1);

    // 4 nhóm trạng thái ngữ nghĩa phẳng (chấm tròn + chữ màu, không nền pill pastel)
    expect(screen.getByText('Đang chờ trống').parentElement?.className).toContain('text-amber-700');
    expect(screen.getByText('Đang chờ trống').parentElement?.className).not.toContain('bg-amber-50');
    expect(screen.getByText('Đang tư vấn').parentElement?.className).toContain('text-sky-700');
    expect(screen.getByText('Đã chuyển thành đơn').parentElement?.className).toContain('text-emerald-700');
    expect(screen.getByText('Đã hủy').parentElement?.className).toContain('text-slate-500');

    // Dòng đã hủy được làm mờ nhẹ
    const cancelledRow = screen.getByText('Kho Tiêu Chuẩn XS').closest('tr');
    expect(cancelledRow?.className).toContain('bg-gray-50');
    expect(cancelledRow?.className).toContain('opacity-70');

    // Không lộ mã quy tắc nội bộ
    expect(screen.queryByText(/BR-WAT/i)).not.toBeInTheDocument();
  });

  it('Bỏ nút Gia hạn +15 ngày thừa và mở Modal xác nhận giữa màn hình khi Hủy yêu cầu chờ', () => {
    const onCancel = vi.fn();
    const item = makeWaitlist({ id: 77, status: 'WAITING', unitTypeName: 'Kho Máy Lạnh M' });

    render(
      <MemoryRouter>
        <MyWaitlistsTable
          waitlists={[item]}
          loading={false}
          cancellingId={null}
          onCancel={onCancel}
          onViewContracts={vi.fn()}
        />
      </MemoryRouter>
    );

    // Không còn nút Gia hạn +15 ngày
    expect(screen.queryByRole('button', { name: /Gia hạn \+15 ngày/i })).not.toBeInTheDocument();

    // Bấm Hủy yêu cầu -> mở Modal xác nhận (không đẩy lệch layout bảng)
    fireEvent.click(screen.getByRole('button', { name: /Hủy yêu cầu/i }));
    expect(screen.getByText('Hủy yêu cầu chờ?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quay lại/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy/i }));
    expect(onCancel).toHaveBeenCalledWith(item);
  });

  it('Hiển thị Empty State thu gọn, không viền đứt nét khi chưa có yêu cầu chờ nào', () => {
    render(
      <MemoryRouter>
        <MyWaitlistsTable
          waitlists={[]}
          loading={false}
          cancellingId={null}
          onCancel={vi.fn()}
          onViewContracts={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Bạn chưa có yêu cầu chờ nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tìm & Thuê ô kho/i })).toBeInTheDocument();
  });

  it('Tích hợp đầy đủ vào MyUnitsPage, CustomerRoutes, CustomerLayout và WaitlistRegistrationModal', () => {
    const myUnitsPage = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/customer/pages/MyUnitsPage.tsx'),
      'utf-8'
    );
    const routesFile = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/customer/CustomerRoutes.tsx'),
      'utf-8'
    );
    const layoutFile = fs.readFileSync(
      path.resolve(process.cwd(), 'src/layouts/CustomerLayout.tsx'),
      'utf-8'
    );
    const modalFile = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/customer/components/WaitlistRegistrationModal.tsx'),
      'utf-8'
    );

    expect(myUnitsPage).toContain('fetchMyWaitlists');
    expect(myUnitsPage).toContain('Danh sách chờ của tôi');
    expect(myUnitsPage).toContain('<MyWaitlistsTable');
    expect(routesFile).toContain('path="waitlists"');
    expect(layoutFile).toContain('/customer/my-units?tab=waitlist');
    expect(modalFile).toContain('/customer/my-units?tab=waitlist');
  });
});
