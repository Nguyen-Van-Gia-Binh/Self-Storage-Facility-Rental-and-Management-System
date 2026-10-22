// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  OccupancyComparisonChart,
} from '../OccupancyComparisonChart';
import type { FacilityOccupancyItem } from '@/types';

afterEach(() => {
  cleanup();
});

const mockOccupancies: FacilityOccupancyItem[] = [
  {
    facilityId: 5,
    facilityName: 'Cơ sở Quận 1 - TP.HCM',
    occupancyRate: 0.2, // 20% -> < 30% Đỏ
    totalUnits: 5,
    occupiedUnits: 1,
    availableUnits: 4,
    reservedUnits: 0,
    maintenanceUnits: 0,
    cleaningUnits: 0,
    outOfServiceUnits: 0,
    overdueContractsCount: 0,
  },
  {
    facilityId: 1,
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    occupancyRate: 0.083, // 8.3% -> < 30% Đỏ
    totalUnits: 12,
    occupiedUnits: 1,
    availableUnits: 10,
    reservedUnits: 1,
    maintenanceUnits: 0,
    cleaningUnits: 0,
    outOfServiceUnits: 0,
    overdueContractsCount: 0,
  },
  {
    facilityId: 7,
    facilityName: 'Cơ sở Bình Thạnh - TP.HCM',
    occupancyRate: 0.0, // 0%
    totalUnits: 1,
    occupiedUnits: 0,
    availableUnits: 1,
    reservedUnits: 0,
    maintenanceUnits: 0,
    cleaningUnits: 0,
    outOfServiceUnits: 0,
    overdueContractsCount: 0,
  },
  {
    facilityId: 2,
    facilityName: 'Cơ sở Quận 7 - TP.HCM',
    occupancyRate: 0.85, // 85% -> >= 80% Đạt chuẩn
    totalUnits: 20,
    occupiedUnits: 17,
    availableUnits: 3,
    reservedUnits: 0,
    maintenanceUnits: 0,
    cleaningUnits: 0,
    outOfServiceUnits: 0,
    overdueContractsCount: 1,
  },
];

describe('OccupancyComparisonChart (Enterprise UX List View)', () => {
  it('renders all facilities in list view with headers, progress bars, and status chips', () => {
    render(<OccupancyComparisonChart data={mockOccupancies} />);

    // Kiểm tra tên cơ sở
    expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeInTheDocument();
    expect(screen.getByText('(ID: #5)')).toBeInTheDocument();
    expect(screen.getByText('Cơ sở Quận 7 - TP.HCM')).toBeInTheDocument();

    // Kiểm tra badge "Đạt chuẩn" cho cơ sở 85%
    expect(screen.getByText('Đạt chuẩn')).toBeInTheDocument();

    // Kiểm tra chips
    expect(screen.getAllByText(/Trống:/).length).toBe(4);
    expect(screen.getAllByText(/Đang thuê:/).length).toBe(4);
  });

  it('filters by search keyword (name or id)', () => {
    render(<OccupancyComparisonChart data={mockOccupancies} />);

    const searchInput = screen.getByPlaceholderText(/Tìm tên hoặc ID cơ sở/i);
    fireEvent.change(searchInput, { target: { value: 'Quận 1' } });

    expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeInTheDocument();
    expect(screen.queryByText('Cơ sở Cầu Giấy - Hà Nội')).not.toBeInTheDocument();
  });

  it('filters by toggle "Ẩn cơ sở 0%"', () => {
    render(<OccupancyComparisonChart data={mockOccupancies} />);

    const toggleHideZero = screen.getByLabelText(/Ẩn cơ sở 0%/i);
    fireEvent.click(toggleHideZero);

    // Bình Thạnh có 0% nên bị ẩn
    expect(screen.queryByText('Cơ sở Bình Thạnh - TP.HCM')).not.toBeInTheDocument();
    // Quận 1 (20%) vẫn hiển thị
    expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeInTheDocument();
  });

  it('filters by quick button "Chỉ xem < 50%"', () => {
    render(<OccupancyComparisonChart data={mockOccupancies} />);

    const underTargetBtn = screen.getByRole('button', { name: /Chỉ xem < 50%/i });
    fireEvent.click(underTargetBtn);

    // Quận 7 (85%) phải bị ẩn
    expect(screen.queryByText('Cơ sở Quận 7 - TP.HCM')).not.toBeInTheDocument();
    // Quận 1 (20%) và Cầu Giấy (8.3%) hiển thị
    expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeInTheDocument();
    expect(screen.getByText('Cơ sở Cầu Giấy - Hà Nội')).toBeInTheDocument();
  });

  it('calls onOpenDetail or onSelectFacility when clicking facility name', () => {
    const handleOpenDetail = vi.fn();
    render(
      <OccupancyComparisonChart
        data={mockOccupancies}
        onOpenDetail={handleOpenDetail}
      />
    );

    const q1Button = screen.getByRole('button', { name: /Cơ sở Quận 1 - TP.HCM/i });
    fireEvent.click(q1Button);

    expect(handleOpenDetail).toHaveBeenCalledWith(
      expect.objectContaining({ facilityId: 5, facilityName: 'Cơ sở Quận 1 - TP.HCM' })
    );
  });

  it('displays empty state with reset button when no results match filter', () => {
    render(<OccupancyComparisonChart data={mockOccupancies} />);

    const searchInput = screen.getByPlaceholderText(/Tìm tên hoặc ID cơ sở/i);
    fireEvent.change(searchInput, { target: { value: 'Không tồn tại 999' } });

    expect(screen.getByText(/Không tìm thấy cơ sở phù hợp với bộ lọc/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Xóa bộ lọc/i });
    fireEvent.click(resetBtn);

    // Sau khi xóa bộ lọc, danh sách phục hồi
    expect(screen.getByText('Cơ sở Quận 1 - TP.HCM')).toBeInTheDocument();
  });
});
