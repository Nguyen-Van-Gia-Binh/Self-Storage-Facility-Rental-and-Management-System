/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-80: Chặn đặt chỗ & khóa chọn loại ô kho chưa niêm yết giá (US-BM-03.1 AC-5)
 * Người thực hiện: Nhi (WS1 - Khách hàng & Đặt chỗ)
 */
describe('ISS-80: Chặn Đặt Chỗ & Khóa Chọn Loại Ô Kho Chưa Niêm Yết Giá (US-BM-03.1 AC-5)', () => {
  const unitPickerPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/UnitPickerPage.tsx'
  );
  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );
  const unitGrid = path.resolve(
    process.cwd(),
    'src/features/customer/components/UnitGrid.tsx'
  );
  const customerTypes = path.resolve(
    process.cwd(),
    'src/features/customer/types.ts'
  );

  it('UnitType domain interface hỗ trợ trường priceStatus', () => {
    const content = fs.readFileSync(customerTypes, 'utf-8');
    expect(content).toMatch(/priceStatus\?: string \| null;/);
  });

  it('UnitPickerPage nhận diện isUnlisted, gắn badge Chưa niêm yết giá và đổi nút thành Tạm chưa mở đặt', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).toMatch(/const isUnlisted = !type\.baseMonthlyPrice \|\| type\.baseMonthlyPrice <= 0 \|\| type\.priceStatus === 'UNLISTED' \|\| type\.priceStatus === 'Chưa niêm yết';/);
    expect(content).toMatch(/Chưa niêm yết giá/);
    expect(content).toMatch(/Tạm chưa mở đặt/);
    expect(content).toMatch(/disabled=\{isUnlisted\}/);
    expect(content).toMatch(/if \(!isUnlisted\)/);
  });

  it('UnitPickerPage ưu tiên chọn loại kho đã niêm yết giá và chặn click chọn thẻ unlisted', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).toMatch(/firstListed = mappedUTs\.find\(\(ut\) => ut\.baseMonthlyPrice > 0/);
    expect(content).toMatch(/isUnlisted\s*\?\s*'opacity-70 cursor-not-allowed/);
  });

  it('UnitPickerPage hiển thị unitUnavailableModal khi đơn giá chưa niêm yết', () => {
    const content = fs.readFileSync(unitPickerPage, 'utf-8');
    expect(content).toMatch(/if \(listedPrice <= 0\)\s*\{\s*setUnitUnavailableModal\(\{/);
    expect(content).toMatch(/Loại ô kho chưa niêm yết giá/);
  });

  it('BookingPage có guard chặn truy cập URL trực tiếp loại kho chưa niêm yết giá', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/const isUnlisted = !foundUT\.monthlyPrice \|\| foundUT\.monthlyPrice <= 0 \|\| foundUT\.priceStatus === 'UNLISTED' \|\| foundUT\.priceStatus === 'Chưa niêm yết';/);
    expect(content).toMatch(/title:\s*'Loại ô kho chưa niêm yết giá'/);
  });

  it('UnitGrid vô hiệu hóa nút xác nhận ô kho và hiển thị Chưa niêm yết giá khi ô kho chưa có giá', () => {
    const content = fs.readFileSync(unitGrid, 'utf-8');
    expect(content).toMatch(/disabled=\{!activeSelectedUnit\.monthlyPrice \|\| activeSelectedUnit\.monthlyPrice <= 0 \|\| isConfirming\}/);
    expect(content).toMatch(/Chưa niêm yết giá — Tạm chưa mở đặt/);
  });
});
