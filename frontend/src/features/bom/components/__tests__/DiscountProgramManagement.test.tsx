// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
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

      // Kiểm tra phạm vi
      expect(screen.getByText('Toàn hệ thống')).toBeInTheDocument();
      expect(screen.getByText('Cơ sở Cầu Giấy')).toBeInTheDocument();

      // Kiểm tra trạng thái
      expect(screen.getByText('Đang áp dụng')).toBeInTheDocument();
      expect(screen.getByText('Tạm dừng')).toBeInTheDocument();
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
