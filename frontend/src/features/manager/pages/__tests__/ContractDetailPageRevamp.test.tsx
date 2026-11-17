// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ContractDetailPage } from '../ContractDetailPage';
import { PaymentInfoPanel } from '../../components/PaymentInfoPanel';
import { ContractTimeline } from '../../components/ContractTimeline';
import { OverdueAlertBanner } from '../../components/OverdueAlertBanner';
import type { ManagerContractItem } from '@/types/contractManager';

const mockGetManagerContractById = vi.fn();
const mockGetManagerContracts = vi.fn();
const mockGetSettlementPreview = vi.fn();

vi.mock('@/api/contract', () => ({
  getManagerContractById: (...args: unknown[]) => mockGetManagerContractById(...args),
  getManagerContracts: (...args: unknown[]) => mockGetManagerContracts(...args),
  getSettlementPreview: (...args: unknown[]) => mockGetSettlementPreview(...args),
  reassignStorageUnit: vi.fn(),
  completeSettlementPayment: vi.fn(),
}));

const inspectedContract: ManagerContractItem = {
  id: 9044,
  code: 'CTR-20261116-8602',
  customerId: 194,
  customerName: 'Nhật Huỳnh',
  customerPhone: '0349380691',
  customerEmail: 'huynhnhatphuyentuyhoa@gmail.com',
  facilityId: 1,
  facilityName: 'Cơ sở Quận 1 - TP.HCM',
  storageUnitId: 103,
  storageUnitCode: 'Q1-DRY-103',
  unitTypeId: 1,
  unitTypeName: 'Kho Tiêu Chuẩn S',
  startDate: '2026-11-16',
  endDateExclusive: '2036-11-16',
  rentalMonths: 120,
  monthlyPrice: 750000,
  depositAmount: 750000,
  depositBalance: 750000,
  status: 'INSPECTED' as ManagerContractItem['status'],
  isInspected: true,
  accessCode: '123456',
};

const activeContract: ManagerContractItem = {
  ...inspectedContract,
  id: 9001,
  code: 'CTR-TEST-001',
  status: 'ACTIVE',
  isInspected: false,
  startDate: '2026-10-12',
  endDateExclusive: '2027-01-10',
  rentalMonths: 3,
  monthlyPrice: 1000000,
  depositAmount: 1000000,
  depositBalance: 1000000,
};

function renderPage(contractId: number) {
  return render(
    <MemoryRouter initialEntries={[`/manager/contracts/${contractId}`]}>
      <Routes>
        <Route path="/manager/contracts/:contractId" element={<ContractDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ContractDetailPage — Enterprise SaaS Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetManagerContracts.mockResolvedValue([]);
    mockGetSettlementPreview.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it('di chuyển toàn bộ Action Buttons lên Page Header, xóa khối Hành động quản lý giữa trang và bỏ nút nền đen', async () => {
    mockGetManagerContractById.mockResolvedValue(inspectedContract);
    renderPage(9044);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CTR-20261116-8602' })).toBeInTheDocument();
    });

    // Không còn khối "Hành động quản lý" giữa trang
    expect(screen.queryByText(/Hành động quản lý/i)).not.toBeInTheDocument();

    // Toàn bộ nút hành động nằm trong Page Header
    const header = screen.getByTestId('contract-detail-header');
    const viewEContractBtn = screen.getByRole('button', { name: /Xem HĐ điện tử/i });
    const debtDetailBtn = screen.getByRole('button', { name: /Chi tiết công nợ/i });
    const approveBtn = screen.getByRole('button', { name: /Duyệt quyết toán & Hoàn cọc/i });

    expect(header).toContainElement(viewEContractBtn);
    expect(header).toContainElement(debtDetailBtn);
    expect(header).toContainElement(approveBtn);

    // Tuyệt đối không dùng nút nền đen
    expect(viewEContractBtn.className).not.toMatch(/bg-slate-900|bg-gray-900|bg-black/);
    // Secondary actions dùng Outline Gray
    expect(viewEContractBtn.className).toContain('bg-white');
    expect(viewEContractBtn.className).toContain('border-gray-300');
    expect(debtDetailBtn.className).toContain('bg-white');
    expect(debtDetailBtn.className).toContain('border-gray-300');
    // Primary action dùng Solid Brand Mint
    expect(approveBtn.className).toContain('bg-brand-600');
    expect(approveBtn.className).toContain('text-white');
  });

  it('định dạng toàn bộ ngày tháng theo chuẩn Việt Nam DD/MM/YYYY ở Header, Thông tin hợp đồng, Lịch sử thanh toán & Timeline', async () => {
    mockGetManagerContractById.mockResolvedValue(inspectedContract);
    const { container } = renderPage(9044);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CTR-20261116-8602' })).toBeInTheDocument();
    });

    const fullText = container.textContent || '';
    expect(fullText).toContain('16/11/2026');
    expect(fullText).toContain('16/11/2036');
    expect(fullText).not.toContain('2026-11-16');
    expect(fullText).not.toContain('2036-11-16');
  });

  it('áp dụng bố cục 2/3 - 1/3 phẳng và hỗ trợ che/hiện mã PIN khi click', async () => {
    mockGetManagerContractById.mockResolvedValue(activeContract);
    renderPage(9001);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'CTR-TEST-001' })).toBeInTheDocument();
    });

    const mainGrid = screen.getByTestId('contract-detail-grid');
    expect(mainGrid.className).toContain('lg:grid-cols-3');

    // Mặc định ẩn PIN dạng ••••••, click để hiện mã PIN thực
    expect(screen.getByText('••••••')).toBeInTheDocument();
    const toggleBtn = screen.getByRole('button', { name: /Hiện mã PIN/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText('123456')).toBeInTheDocument();
  });

  it('PaymentInfoPanel làm phẳng Box Soup (không bọc khung xám con cho Đơn giá, Tiền cọc, Tổng tiền)', () => {
    const { container } = render(<PaymentInfoPanel contract={inspectedContract} />);

    // Không còn các sub-box nền xám / xanh lồng trong card
    expect(container.querySelector('.bg-slate-50\\/80')).toBeNull();
    expect(container.querySelector('.bg-brand-50\\/50')).toBeNull();
    expect(container.textContent).toContain('750.000 đ');
    expect(container.textContent).toContain('90.750.000 đ');
    expect(container.textContent).toContain('Đã hoàn tất thanh toán');
  });

  it('ContractTimeline và OverdueAlertBanner format ngày tháng theo chuẩn DD/MM/YYYY', () => {
    const overdueContract: ManagerContractItem = {
      ...activeContract,
      status: 'OVERDUE',
      overdueDays: 4,
      accruedOverdueFee: 250000,
    };

    const timelineRender = render(<ContractTimeline contract={overdueContract} />);
    expect(timelineRender.container.textContent).toContain('12/10/2026');
    expect(timelineRender.container.textContent).toContain('10/01/2027');
    expect(timelineRender.container.textContent).not.toContain('2026-10-12');
    expect(timelineRender.container.textContent).not.toContain('2027-01-10');

    cleanup();

    const bannerRender = render(<OverdueAlertBanner contract={overdueContract} />);
    expect(bannerRender.container.textContent).toContain('10/01/2027');
    expect(bannerRender.container.textContent).not.toContain('2027-01-10');
  });
});
