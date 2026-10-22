// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PolicySummaryCard } from '../PolicySummaryCard';

const mockPolicy: any = {
  version: '1',
  effectiveDate: '2026-01-01',
  depositMultiplier: 1,
  reservationHoldHours: 48,
  checkinGraceDays: 10,
  overdueDailyRate: 0.1,
  overdueCapRate: 0.7,
  overdueGraceDays: 3,
  cancelFullRefundHours: 48,
  cancelLateRefundRate: 0.5,
  returnNoticeDays: 30,
  renewalMinMonths: 1,
  renewalMaxMonths: 12,
};

const mockVersions: any[] = [
  {
    id: 1,
    versionNo: 1,
    effectiveDate: '2026-01-01',
    status: 'Đang hiệu lực',
    publishedBy: 4,
  },
];

describe('PolicySummaryCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Alert Banner, 3 business clusters, and triggers drawer callbacks', () => {
    const onOpenPublishDrawer = vi.fn();
    const onViewVersion = vi.fn();

    render(
      <PolicySummaryCard
        policy={mockPolicy}
        versions={mockVersions}
        onOpenPublishDrawer={onOpenPublishDrawer}
        onViewVersion={onViewVersion}
      />
    );

    // Alert Banner
    expect(screen.getByText(/Lưu ý:/i)).toBeInTheDocument();

    // 3 Cluster Headers
    expect(screen.getByText(/Tài chính & Tiền cọc/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời gian & Gia hạn/i)).toBeInTheDocument();
    expect(screen.getByText(/Rủi ro & Kết thúc/i)).toBeInTheDocument();

    // Trigger update button
    const updateBtn = screen.getByRole('button', { name: /Cập nhật chính sách/i });
    fireEvent.click(updateBtn);
    expect(onOpenPublishDrawer).toHaveBeenCalledTimes(1);

    // Trigger view details button in table
    const viewBtn = screen.getByRole('button', { name: /Xem chi tiết/i });
    fireEvent.click(viewBtn);
    expect(onViewVersion).toHaveBeenCalledWith(mockVersions[0]);
  });
});
