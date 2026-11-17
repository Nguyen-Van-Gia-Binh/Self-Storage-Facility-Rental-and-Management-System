// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TransactionHistoryTable } from '../TransactionHistoryTable';

const getPaymentHistoryMock = vi.fn();

vi.mock('@/api/payment', () => ({
  getPaymentHistory: (...args: unknown[]) => getPaymentHistoryMock(...args),
}));

describe('TransactionHistoryTable Enterprise Polish', () => {
  beforeEach(() => {
    getPaymentHistoryMock.mockReset();
    getPaymentHistoryMock.mockResolvedValue({
      content: [
        {
          id: 1,
          orderCode: 'ORD-001',
          referenceType: 'INITIAL_PAYMENT',
          customerName: 'Nhật Huỳnh',
          facilityName: 'Cơ sở Quận 1',
          method: 'VNPAY',
          status: 'SUCCESS',
          amount: 2500000,
          paidAt: '2026-11-19T10:59:04+07:00',
        },
        {
          id: 2,
          orderCode: 'ORD-002',
          referenceType: 'REFUND',
          customerName: 'Nhật Huỳnh',
          facilityName: 'Cơ sở Quận 1',
          method: 'BANK_TRANSFER',
          status: 'FAILED',
          amount: 500000,
          createdAt: '2026-11-19T08:15:45+07:00',
        },
      ],
      totalElements: 17,
      totalPages: 2,
      page: 0,
      size: 10,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders bordered colored status badges, compact DD/MM/YYYY HH:mm timestamps, right-aligned amounts, and 3-part pagination', async () => {
    render(<TransactionHistoryTable from="2026-11-01" to="2026-11-30" />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Compact timestamp DD/MM/YYYY HH:mm (no seconds)
    expect(screen.getByText('19/11/2026 10:59')).toBeInTheDocument();

    // Status badges with semantic border & color
    const successBadge = screen.getByText('Thành công');
    expect(successBadge.className).toContain('border-emerald-200');
    const failedBadge = screen.getByText('Thất bại');
    expect(failedBadge.className).toContain('border-rose-200');

    // Right-aligned amount column
    const amountHeader = screen.getByText('Số tiền').closest('th');
    expect(amountHeader?.className).toContain('text-right');

    // 3-part Enterprise pagination: rows/page select + summary + numbered pages 1 & 2
    expect(screen.getByLabelText('Số dòng mỗi trang')).toBeInTheDocument();
    expect(screen.getByText(/trong tổng số/i)).toBeInTheDocument();
    const page2Btn = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Btn);

    await waitFor(() => {
      expect(getPaymentHistoryMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, size: 10 })
      );
    });
  });
});
