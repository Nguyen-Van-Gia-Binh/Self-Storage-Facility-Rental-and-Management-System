// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RenewalExpiryBanner } from '../../components/RenewalExpiryBanner';
import type { RentedContract } from '../../types';

describe('RenewalPage & RenewalExpiryBanner — Chuẩn hóa luồng Gia hạn 3 bước Enterprise Fintech', () => {
  const renewalPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/RenewalPage.tsx'
  );
  const bannerPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/RenewalExpiryBanner.tsx'
  );

  it('Lỗi 1 & 2 (Bước 3 Thanh toán): xóa công cụ Giả lập/VnpayPayLinks, bỏ nút Tôi đã hoàn tất chuyển khoản và dùng nút chủ động Thanh toán an toàn qua VNPay', () => {
    const content = fs.readFileSync(renewalPagePath, 'utf-8');
    expect(content).not.toContain('<VnpayPayLinks');
    expect(content).not.toContain('Tôi đã hoàn tất chuyển khoản');
    expect(content).not.toContain('Giả lập');
    expect(content).not.toContain('Thẻ test');
    expect(content).toContain('Thanh toán an toàn qua VNPay');
    expect(content).toContain('vnpayPayHref');
  });

  it('Lỗi 3 (Banner nhắc nhở): ẩn ở Bước 3 và thu gọn thành 1 dòng ngắn gọn ở Bước 1-2', () => {
    const pageContent = fs.readFileSync(renewalPagePath, 'utf-8');
    const bannerContent = fs.readFileSync(bannerPath, 'utf-8');

    expect(pageContent).toMatch(/currentStep !== 3[\s\S]*<RenewalExpiryBanner/);
    expect(bannerContent).not.toContain('Hãy gia hạn sớm để giữ vị trí ô kho');

    const in20Days = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
    render(
      <MemoryRouter>
        <RenewalExpiryBanner
          contract={{
            id: '16',
            contractNumber: 'CTR-TEST-016',
            unitNumber: 'Q1-C201',
            unitTypeName: 'Kho Máy Lạnh S',
            facilityName: 'Cơ sở Quận 1 - TP.HCM',
            startDate: '2026-09-07',
            endDate: in20Days,
            status: 'ACTIVE',
            monthlyRent: 1500000,
            depositHeld: 1500000,
          } as RentedContract}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Nhắc nhở:/i)).toBeInTheDocument();
    expect(screen.getByText(/Q1-C201/)).toBeInTheDocument();
  });

  it('Lỗi 4 (Bước 1): Radio Card kỳ hạn gọn với Badge góc trên phải (Amber/Emerald), Input Group tùy chỉnh liền mạch và Stepper bỏ số trùng lặp', () => {
    const content = fs.readFileSync(renewalPagePath, 'utf-8');

    // Stepper không lặp số ở phần text ("1. Chọn kỳ hạn..." -> "Chọn kỳ hạn...")
    expect(content).not.toContain('<span>1. Chọn kỳ hạn & Kiểm tra</span>');
    expect(content).not.toContain('<span>2. Bảng kê tài chính</span>');
    expect(content).not.toContain('<span>3. Thanh toán VNPay</span>');
    expect(content).toContain('<span>Chọn kỳ hạn & Kiểm tra</span>');
    expect(content).toContain('<span>Bảng kê tài chính</span>');
    expect(content).toContain('<span>Thanh toán VNPay</span>');

    // Radio Card kỳ hạn gọn với Badge góc trên phải (Amber cho Phổ biến, Emerald cho Giảm giá)
    expect(content).toContain('absolute -top-2.5 -right-2');
    expect(content).toContain('bg-amber-100 text-amber-700 border-amber-200');
    expect(content).toContain('bg-emerald-100 text-emerald-700 border-emerald-200');

    // Ô nhập số tháng tùy chỉnh dạng Input Group liền mạch
    expect(content).toContain('border border-gray-300 rounded-lg overflow-hidden focus-within:border-brand-500');
  });

  it('Bước 3 (Countdown & Hủy lệnh thanh toán): khung đếm ngược phẳng 1 lớp viền và nút Hủy mở Modal xác nhận giữa màn hình không xô lệch Footer', () => {
    const content = fs.readFileSync(renewalPagePath, 'utf-8');

    // Khung đếm ngược 1 lớp viền duy nhất (không còn khung lồng bg-amber-100/80 border-amber-300/60)
    expect(content).not.toContain('border-amber-300/60');
    expect(content).toContain('inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg');

    // Không còn khối hồng chèn ngang phá vỡ layout footer; dùng Ghost button + Modal xác nhận
    expect(content).not.toContain('flex flex-wrap items-center gap-2 p-3 bg-rose-50 border border-rose-200');
    expect(content).toContain('Hủy thanh toán?');
    expect(content).toContain('Quay lại');
    expect(content).toContain('Xác nhận hủy');
  });
});
