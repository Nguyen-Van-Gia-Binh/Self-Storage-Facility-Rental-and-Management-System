// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomeFooter } from '../HomeFooter';

describe('CustomerFooter — 4-Column Enterprise Footer đồng bộ mọi màn hình Customer', () => {
  afterEach(() => {
    cleanup();
  });

  it('CustomerLayout hiển thị Footer 4 cột đầy đủ trên các màn hình nội bộ (VD: /customer/my-units) với nền xám nhạt, MST pháp lý và không có link chết href="#"', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/customer/my-units']}>
        <CustomerLayout>
          <div>Nội dung Kho của tôi</div>
        </CustomerLayout>
      </MemoryRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer!.className).toContain('bg-[#F8F9FA]');
    expect(footer!.innerHTML).toContain('lg:grid-cols-4');

    // Không còn link chết href="#"
    expect(footer!.querySelector('a[href="#"]')).toBeNull();

    // Đủ 4 cột chuẩn Enterprise B2B2C
    expect(screen.getByText(/VỀ CHÚNG TÔI/i)).toBeInTheDocument();
    expect(screen.getByText(/HỖ TRỢ KHÁCH HÀNG/i)).toBeInTheDocument();
    expect(screen.getByText(/LIÊN HỆ/i)).toBeInTheDocument();

    // Hotline nổi bật, Email, Địa chỉ, CTA và Mã số thuế pháp lý
    expect(screen.getByText('1900 8888')).toBeInTheDocument();
    expect(screen.getByText('support@smartstorage.vn')).toBeInTheDocument();
    expect(screen.getByText(/MST:/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nhận tư vấn ngay/i })).toHaveAttribute(
      'href',
      '/customer/support'
    );

    // Mở nhanh modal Quy định hoàn tiền / Hủy hợp đồng hoạt động bình thường
    fireEvent.click(screen.getByRole('button', { name: /Quy định hoàn tiền \/ Hủy hợp đồng/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Chính sách hủy đặt chỗ & hoàn tiền cọc/i)).toBeInTheDocument();
  });

  it('HomeFooter đồng bộ cùng cấu trúc 4 cột Enterprise + thông tin pháp lý MST trên trang chủ', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <HomeFooter facilities={[]} onScrollToId={() => {}} />
      </MemoryRouter>
    );

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer!.className).toContain('bg-[#F8F9FA]');
    expect(footer!.textContent).toContain('MST:');
    expect(footer!.textContent).toContain('1900 8888');
  });
});
