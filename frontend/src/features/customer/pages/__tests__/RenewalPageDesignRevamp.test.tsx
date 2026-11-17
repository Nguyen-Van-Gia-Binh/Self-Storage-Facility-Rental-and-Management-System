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

  it('Lỗi 4 (Nút chọn kỳ hạn Bước 1): badge nằm gọn bên trong nút flex-col, không dùng absolute đè lên viền trên', () => {
    const content = fs.readFileSync(renewalPagePath, 'utf-8');
    expect(content).not.toContain('-top-2.5 -right-2');
    expect(content).toContain('flex flex-col items-center justify-center');
  });
});
