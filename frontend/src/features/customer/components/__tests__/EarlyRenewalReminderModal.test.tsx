// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { EarlyRenewalReminderModal } from '../EarlyRenewalReminderModal';
import type { RentedContract } from '../../types';

function addDaysISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function makeContract(daysRemaining: number): RentedContract {
  return {
    id: '9055',
    contractNumber: 'CTR-REN-DEMO-T25',
    unitNumber: 'CG-M202',
    facilityId: '1',
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    facilityAddress: '19 Duy Tân',
    unitTypeName: 'Kho Tiêu Chuẩn M',
    sizeCategory: 'M',
    storageType: 'STANDARD',
    dimensions: '5m x 6m x 4m',
    startDate: '2026-09-13',
    endDate: addDaysISO(daysRemaining),
    durationMonths: 3,
    monthlyRent: 6000000,
    depositAmount: 6000000,
    status: 'ACTIVE',
    accessCode: '618204',
  };
}

afterEach(() => {
  cleanup();
});

describe('EarlyRenewalReminderModal (Enterprise Clean + Fix double-cutoff bug)', () => {
  it('khi còn 25 ngày (noticeDays = 20): hiển thị đúng "Chỉ còn 5 ngày" và nút Primary CTA "Gia hạn ngay" dẫn tới /customer/renew/9055', () => {
    render(
      <MemoryRouter>
        <EarlyRenewalReminderModal
          isOpen
          onClose={vi.fn()}
          contract={makeContract(25)}
          noticeDays={20}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Sắp hết hạn ưu tiên giữ ô kho')).toBeInTheDocument();
    expect(screen.getByText(/Chỉ còn 5 ngày/i)).toBeInTheDocument();
    const renewLink = screen.getByRole('link', { name: 'Gia hạn ngay' });
    expect(renewLink).toHaveAttribute('href', '/customer/renew/9055');
    expect(screen.queryByText(/Đã hết hạn ưu tiên gia hạn/i)).not.toBeInTheDocument();
    const hotlineLink = screen.getByRole('link', { name: '1900 2026' });
    expect(hotlineLink).toHaveAttribute('href', 'tel:19002026');
  });

  it('khi còn 15 ngày (đã qua mốc khóa T-20): không dùng nút disabled vô dụng, hiển thị liên kết gọi hỗ trợ tel:19002026', () => {
    render(
      <MemoryRouter>
        <EarlyRenewalReminderModal
          isOpen
          onClose={vi.fn()}
          contract={makeContract(15)}
          noticeDays={20}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Đã hết thời hạn ưu tiên gia hạn trực tuyến')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gia hạn ngay' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Liên hệ hỗ trợ' })).toHaveAttribute('href', 'tel:19002026');
  });
});
