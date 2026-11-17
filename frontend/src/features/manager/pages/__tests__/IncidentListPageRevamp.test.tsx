// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { IncidentListPage } from '../IncidentListPage';

const mockFetchFacilityById = vi.fn();
const mockGetManagementSupportRequests = vi.fn();

vi.mock('@/api/facility', () => ({
  fetchFacilityById: (...args: unknown[]) => mockFetchFacilityById(...args),
}));

vi.mock('../../api/staffAssignmentApi', () => ({
  getManagementSupportRequests: (...args: unknown[]) => mockGetManagementSupportRequests(...args),
}));

const mockFacility = {
  id: 9,
  code: 'FAC-HP',
  name: 'Cơ sở Cảng Đình Vũ - Hải Phòng',
  address: 'KCN Đình Vũ, Phường Đông Hải 2, Quận Hải An, Hải Phòng',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/manager/incidents/facilities/9']}>
      <Routes>
        <Route path="/manager/incidents/facilities/:facilityId" element={<IncidentListPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('IncidentListPage — Enterprise SaaS Redesign (Bỏ 4 thẻ KPI trùng lặp)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchFacilityById.mockResolvedValue(mockFacility);
    mockGetManagementSupportRequests.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('loại bỏ hoàn toàn 4 thẻ KPI trùng lặp phía trên và gộp số đếm vào Underline Status Tabs', async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cơ sở Cảng Đình Vũ - Hải Phòng' })).toBeInTheDocument();
    });

    // Không còn 4 thẻ KPI lặp lại ("Tổng sự cố hôm nay" / grid 4 cột thẻ KPI)
    expect(screen.queryByText(/Tổng sự cố hôm nay/i)).not.toBeInTheDocument();
    expect(container.querySelector('.md\\:grid-cols-4')).toBeNull();

    // Chỉ có duy nhất 1 bộ Underline Tabs chứa đầy đủ 5 trạng thái
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(screen.getAllByText('Chờ tiếp nhận')).toHaveLength(1);
    expect(screen.getAllByText('Đang xử lý')).toHaveLength(1);
    expect(screen.getAllByText('Đã giải quyết')).toHaveLength(1);
    expect(screen.getAllByText('Đã hủy')).toHaveLength(1);

    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab.className).toContain('border-b-2');
    expect(activeTab.className).toContain('border-brand-600');
  });

  it('Empty State dùng ngôn ngữ B2B chuyên nghiệp (không dùng "Tuyệt vời!") và nút Outline gọn gàng', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Không có sự cố nào phát sinh hôm nay/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Tuyệt vời/i)).not.toBeInTheDocument();

    const last7Btn = screen.getByRole('button', { name: /Xem sự cố 7 ngày qua/i });
    const allHistoryBtn = screen.getByRole('button', { name: /Xem toàn bộ lịch sử/i });
    expect(last7Btn.className).toContain('bg-white');
    expect(last7Btn.className).toContain('border-gray-300');
    expect(allHistoryBtn.className).toContain('bg-white');
    expect(allHistoryBtn.className).toContain('border-gray-300');

    // Click chuyển sang 7 ngày qua hoạt động bình thường
    fireEvent.click(last7Btn);
    await waitFor(() => {
      expect(screen.queryByText(/Không có sự cố nào phát sinh hôm nay/i)).not.toBeInTheDocument();
    });
  });
});
