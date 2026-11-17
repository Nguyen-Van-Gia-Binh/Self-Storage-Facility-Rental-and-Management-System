// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog Enterprise Modal', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders Enterprise Header with close X button, rich contextual body, note, and Outline vs Primary action buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Kích hoạt chương trình khuyến mãi"
        description={
          <>
            Bạn có chắc chắn muốn kích hoạt lại chương trình{' '}
            <strong>"Ưu đãi thuê từ 6 tháng (5%)"</strong> không?
          </>
        }
        note="Chương trình sẽ ngay lập tức được áp dụng cho các hợp đồng đủ điều kiện."
        confirmLabel="Xác nhận kích hoạt"
        cancelLabel="Hủy bỏ"
        variant="success"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Kích hoạt chương trình khuyến mãi')).toBeInTheDocument();
    expect(screen.getByText('"Ưu đãi thuê từ 6 tháng (5%)"')).toBeInTheDocument();
    expect(
      screen.getByText(/Chương trình sẽ ngay lập tức được áp dụng/i)
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Đóng hộp thoại/i });
    fireEvent.click(closeBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' });
    expect(cancelBtn.className).toContain('bg-white');
    expect(cancelBtn.className).toContain('border');
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(2);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận kích hoạt' });
    expect(confirmBtn.className).toContain('bg-brand-600');
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('locks Cancel, Close, and Confirm buttons with loading indicator while submitting', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Kích hoạt chương trình khuyến mãi"
        confirmLabel="Xác nhận kích hoạt"
        cancelLabel="Hủy bỏ"
        variant="success"
        isLoading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: /Đang xử lý/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hủy bỏ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Đóng hộp thoại/i })).toBeDisabled();
  });
});
