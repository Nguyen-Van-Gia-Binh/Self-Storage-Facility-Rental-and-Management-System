// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DiscountProgramTable } from '../DiscountProgramTable';
import { DiscountProgramModal } from '../DiscountProgramModal';
import type { DiscountProgramItem } from '@/api/discount';

describe('BOM Discount Program Management Components', () => {
  const mockPrograms: DiscountProgramItem[] = [
    {
      id: 1,
      name: 'Ưu đãi thuê từ 6 tháng (5%)',
      discountType: 'PERCENT',
      discountValue: 5.0,
      minRentalMonths: 6,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      scopeType: 'SYSTEM',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Ưu đãi cơ sở Cầu Giấy (10%)',
      discountType: 'PERCENT',
      discountValue: 10.0,
      minRentalMonths: 12,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      scopeType: 'FACILITY',
      facilityId: 1,
      facilityName: 'Cơ sở Cầu Giấy',
      isActive: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  describe('DiscountProgramTable', () => {
    it('hiển thị danh sách chương trình khuyến mãi với đúng thông tin', () => {
      const onOpenModal = vi.fn();
      const onEdit = vi.fn();
      const onToggleStatus = vi.fn();

      render(
        <DiscountProgramTable
          programs={mockPrograms}
          onOpenModal={onOpenModal}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      );

      // Kiểm tra tiêu đề bảng
      expect(screen.getByText('Chương trình khuyến mãi & Chiết khấu')).toBeInTheDocument();

      // Kiểm tra tên các chương trình
      expect(screen.getByText('Ưu đãi thuê từ 6 tháng (5%)')).toBeInTheDocument();
      expect(screen.getByText('Ưu đãi cơ sở Cầu Giấy (10%)')).toBeInTheDocument();

      // Kiểm tra mức giảm
      expect(screen.getByText('Giảm 5%')).toBeInTheDocument();
      expect(screen.getByText('Giảm 10%')).toBeInTheDocument();

      // Kiểm tra số tháng thuê tối thiểu
      expect(screen.getByText('≥ 6 tháng')).toBeInTheDocument();
      expect(screen.getByText('≥ 12 tháng')).toBeInTheDocument();

      const table = within(screen.getByRole('table'));

      // Kiểm tra phạm vi
      expect(table.getByText('Toàn hệ thống')).toBeInTheDocument();
      expect(table.getByText('Cơ sở Cầu Giấy')).toBeInTheDocument();

      // Kiểm tra trạng thái
      expect(table.getByText('Đang áp dụng')).toBeInTheDocument();
      expect(table.getByText('Tạm dừng')).toBeInTheDocument();
    });

    it('gọi onOpenModal khi bấm nút thêm chương trình', () => {
      const onOpenModal = vi.fn();
      render(
        <DiscountProgramTable
          programs={[]}
          onOpenModal={onOpenModal}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
        />
      );

      const addBtn = screen.getByRole('button', { name: /\+ Thêm chương trình/i });
      fireEvent.click(addBtn);

      expect(onOpenModal).toHaveBeenCalledTimes(1);
    });

    it('chuẩn Enterprise: bỏ banner icon màu cam, bỏ pill ở Mức giảm, thêm Toolbar tìm kiếm/lọc và Toggle Switch 1-click ở Trạng thái', () => {
      const onToggleStatus = vi.fn();
      const onEdit = vi.fn();
      const { container } = render(
        <DiscountProgramTable
          programs={mockPrograms}
          onOpenModal={vi.fn()}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      );

      // Không còn banner icon màu cam và không còn nút Power thừa
      expect(container.innerHTML).not.toContain('bg-amber-50');
      expect(container.innerHTML).not.toContain('lucide-power');

      // Mức giảm hiển thị dạng giá trị in đậm, không dùng pill xanh lá như Status
      const discountCell = screen.getByText('Giảm 5%');
      expect(discountCell.className).not.toContain('rounded-full');
      expect(discountCell.className).not.toContain('bg-emerald-50');

      // Cột Trạng thái dùng Toggle Switch (role="switch") gọi onToggleStatus 1-click
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(2);
      expect(switches[0]).toHaveAttribute('aria-checked', 'true');
      expect(switches[1]).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(switches[1]);
      expect(onToggleStatus).toHaveBeenCalledWith(mockPrograms[1]);

      // Toolbar tìm kiếm & bộ lọc hoạt động trực tiếp trên bảng
      const searchInput = screen.getByPlaceholderText(/Tìm kiếm chương trình/i);
      fireEvent.change(searchInput, { target: { value: 'Cầu Giấy' } });
      expect(screen.getByText('Ưu đãi cơ sở Cầu Giấy (10%)')).toBeInTheDocument();
      expect(screen.queryByText('Ưu đãi thuê từ 6 tháng (5%)')).not.toBeInTheDocument();
    });

    it('hiển thị trạng thái gạt xem trước (optimistic) khi pendingToggleId trùng khớp và tự động hoàn lại khi hủy', () => {
      const { rerender } = render(
        <DiscountProgramTable
          programs={mockPrograms}
          onOpenModal={vi.fn()}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          pendingToggleId={2}
        />
      );

      // Chương trình #2 vốn đang Tạm dừng (false), khi đang chờ xác nhận sẽ gạt sang bật (true)
      const switches = screen.getAllByRole('switch');
      expect(switches[1]).toHaveAttribute('aria-checked', 'true');

      // Khi người dùng bấm Hủy bỏ -> pendingToggleId về null -> công tắc gạt ngược lại về false
      rerender(
        <DiscountProgramTable
          programs={mockPrograms}
          onOpenModal={vi.fn()}
          onEdit={vi.fn()}
          onToggleStatus={vi.fn()}
          pendingToggleId={null}
        />
      );
      expect(screen.getAllByRole('switch')[1]).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('DiscountProgramModal', () => {
    const mockFacilities = [
      {
        id: 1,
        code: 'FAC-CG',
        name: 'Cơ sở Cầu Giấy',
        address: '19 Duy Tân, Cầu Giấy',
        status: 'ACTIVE' as const,
        storageUnitCount: 20,
      },
    ];

    it('validate form khi submit trống', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <DiscountProgramModal
          isOpen={true}
          onClose={onClose}
          facilities={mockFacilities}
          onSubmit={onSubmit}
        />
      );

      // Bấm submit ngay khi tên chưa nhập
      const submitBtn = screen.getByRole('button', { name: /Tạo chương trình/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(screen.getByText('Vui lòng nhập tên chương trình')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submit thành công khi nhập đầy đủ dữ liệu hợp lệ', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <DiscountProgramModal
          isOpen={true}
          onClose={onClose}
          facilities={mockFacilities}
          onSubmit={onSubmit}
        />
      );

      const nameInput = screen.getByPlaceholderText(/VD: Ưu đãi thuê từ 6 tháng \(5%\)/i);
      const endDateInput = screen.getByLabelText(/Ngày kết thúc/i);

      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'Chương trình tri ân 2026' } });
        fireEvent.change(endDateInput, { target: { value: '2026-12-31' } });
      });

      const submitBtn = screen.getByRole('button', { name: /Tạo chương trình/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Chương trình tri ân 2026',
          discountType: 'PERCENT',
          discountValue: 5,
          minRentalMonths: 6,
          scopeType: 'SYSTEM',
        })
      );
    });
  });
});
