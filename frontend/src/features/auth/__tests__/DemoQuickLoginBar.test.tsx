// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DemoQuickLoginBar, DEMO_ACCOUNTS } from '../components/DemoQuickLoginBar';

afterEach(() => {
  cleanup();
});

describe('DemoQuickLoginBar', () => {
  it('hiển thị đầy đủ tài khoản demo gồm cả 2 nhân viên Hùng & Viên và gọi onSelectAccount khi bấm', () => {
    const onSelect = vi.fn();
    render(<DemoQuickLoginBar selectedEmail="" onSelectAccount={onSelect} />);

    expect(screen.getByText('Điền nhanh tài khoản Demo')).toBeInTheDocument();

    for (const acc of DEMO_ACCOUNTS) {
      expect(screen.getByRole('button', { name: acc.label })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: 'Nhân viên Hùng' }));
    expect(onSelect).toHaveBeenCalledWith('staff.q1@smartstorage.vn', 'password123');

    fireEvent.click(screen.getByRole('button', { name: 'Nhân viên Viên' }));
    expect(onSelect).toHaveBeenCalledWith('staff@storage.vn', 'password123');

    fireEvent.click(screen.getByRole('button', { name: 'Quản lý FM' }));
    expect(onSelect).toHaveBeenCalledWith('fm.q1@smartstorage.vn', 'password123');
  });

  it('cho phép thu gọn và mở lại thanh điền nhanh', () => {
    const onSelect = vi.fn();
    render(<DemoQuickLoginBar selectedEmail="nhi.customer@gmail.com" onSelectAccount={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn' }));
    expect(screen.queryByRole('button', { name: 'Khách hàng' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Demo nhanh' }));
    expect(screen.getByRole('button', { name: 'Khách hàng' })).toBeInTheDocument();
  });
});
