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
    id: 2,
    versionNo: 9,
    effectiveDate: '2026-11-18',
    status: 'Đang hiệu lực',
    publishedBy: 7,
    publishedByName: 'Huỳnh Nhật',
  },
  {
    id: 1,
    versionNo: 8,
    effectiveDate: '2026-11-16',
    status: 'Đã thay thế',
    publishedBy: 7,
    publishedByName: 'Huỳnh Nhật',
  },
];

describe('PolicySummaryCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders Enterprise Status Bar, unified Definition List, and clickable Notion/Linear Version History rows', () => {
    const onOpenPublishDrawer = vi.fn();
    const onViewVersion = vi.fn();

    const { container } = render(
      <PolicySummaryCard
        policy={mockPolicy}
        versions={mockVersions}
        onOpenPublishDrawer={onOpenPublishDrawer}
        onViewVersion={onViewVersion}
      />
    );

    // Legal notice stays concise and visible
    expect(screen.getByText(/Lưu ý:/i)).toBeInTheDocument();

    // 3 Section Headers inside unified vertical Definition List (no bloated rounded-2xl multi-card grids)
    expect(screen.getByText(/Nhóm 1: Tài chính & Tiền cọc/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhóm 2: Thời gian & Gia hạn/i)).toBeInTheDocument();
    expect(screen.getByText(/Nhóm 3: Rủi ro & Kết thúc/i)).toBeInTheDocument();
    expect(container.querySelector('.rounded-2xl')).toBeNull();

    // Status bar has compact Outline update button
    const updateBtn = screen.getByRole('button', { name: /Cập nhật chính sách/i });
    expect(updateBtn.className).toContain('bg-white');
    expect(updateBtn.className).toContain('border');
    fireEvent.click(updateBtn);
    expect(onOpenPublishDrawer).toHaveBeenCalledTimes(1);

    // Version History table has 4 columns, NO "Thao tác" column and NO "Xem chi tiết" buttons
    expect(screen.queryByText('Thao tác')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Xem chi tiết/i })).not.toBeInTheDocument();

    // Real publisher name & initials avatar rendered instead of "BOM #7"
    expect(screen.getAllByText('Huỳnh Nhật').length).toBe(2);
    expect(screen.queryByText('BOM #7')).not.toBeInTheDocument();

    // Superseded status uses muted strikethrough styling
    const replacedStatus = screen.getByText('Đã thay thế');
    expect(replacedStatus.className).toContain('line-through');

    // Clicking an entire table row opens version detail
    const versionRow = screen.getByText('v9').closest('tr');
    expect(versionRow).not.toBeNull();
    fireEvent.click(versionRow!);
    expect(onViewVersion).toHaveBeenCalledWith(mockVersions[0]);
  });
});
