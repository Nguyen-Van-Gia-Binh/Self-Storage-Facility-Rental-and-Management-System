/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const unitPickerPage = path.resolve(
  process.cwd(),
  'src/features/customer/pages/UnitPickerPage.tsx'
);
const accordionList = path.resolve(
  process.cwd(),
  'src/features/customer/components/UnitTypeAccordionList.tsx'
);
const catalogHook = path.resolve(
  process.cwd(),
  'src/features/customer/hooks/useUnitPickerCatalog.ts'
);
const getUnitPickerContent = () => {
  let content = fs.readFileSync(unitPickerPage, 'utf-8');
  if (fs.existsSync(accordionList)) {
    content += '\n' + fs.readFileSync(accordionList, 'utf-8');
  }
  if (fs.existsSync(catalogHook)) {
    content += '\n' + fs.readFileSync(catalogHook, 'utf-8');
  }
  return content;
};

/**
 * ISS-80: Chặn đặt chỗ & khóa chọn loại ô kho chưa niêm yết giá (US-BM-03.1 AC-5)
 * Người thực hiện: Nhi (WS1 - Khách hàng & Đặt chỗ)
 */
describe('ISS-80: Chặn Đặt Chỗ & Khóa Chọn Loại Ô Kho Chưa Niêm Yết Giá (US-BM-03.1 AC-5)', () => {

  const bookingPage = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
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
    const content = getUnitPickerContent();
    expect(content).toMatch(/const isUnlisted = !type\.baseMonthlyPrice \|\| type\.baseMonthlyPrice <= 0 \|\| type\.priceStatus === 'UNLISTED' \|\| type\.priceStatus === 'Chưa niêm yết';/);
    expect(content).toMatch(/Chưa niêm yết giá/);
    expect(content).toMatch(/Tạm chưa mở đặt/);
    expect(content).toMatch(/disabled=\{isUnlisted\}/);
    expect(content).toMatch(/if \(!isUnlisted\)/);
  });

  it('UnitPickerPage ưu tiên chọn loại kho đã niêm yết giá và chặn click chọn thẻ unlisted', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/firstListed = mappedUTs\.find\(\(ut\) => ut\.baseMonthlyPrice > 0/);
    expect(content).toMatch(/isUnlisted\s*\?\s*'opacity-70 cursor-not-allowed/);
  });

  it('UnitPickerPage hiển thị unitUnavailableModal khi đơn giá chưa niêm yết', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/if \(listedPrice <= 0\)\s*\{\s*setUnitUnavailableModal\(\{/);
    expect(content).toMatch(/Loại ô kho chưa niêm yết giá/);
  });

  it('BookingPage có guard chặn truy cập URL trực tiếp loại kho chưa niêm yết giá', () => {
    const content = fs.readFileSync(bookingPage, 'utf-8');
    expect(content).toMatch(/const isUnlisted = !foundUT\.monthlyPrice \|\| foundUT\.monthlyPrice <= 0 \|\| foundUT\.priceStatus === 'UNLISTED' \|\| foundUT\.priceStatus === 'Chưa niêm yết';/);
    expect(content).toMatch(/title:\s*'Loại ô kho chưa niêm yết giá'/);
  });

  it('UnitPickerPage chọn loại kho theo selectedTypeId duy nhất, không bị chọn đồng thời 2 thẻ cùng sizeCategory', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/selectedTypeId/);
    expect(content).toMatch(/isSelected = /);
    expect(content).toMatch(/handleSelectType\(type\)|onSelectType\(type\)/);
    expect(content).toMatch(/filterUnitTypeId=\{selectedTypeId\}/);
  });
});

/**
 * ISS-113: Ẩn Kho Chưa Niêm Yết Giá Phía Khách Hàng & Hiển Thị Thể Tích m³ Trên Thẻ Kho
 * Người thực hiện: Xuân Nhi (WS1 - Khách hàng & Đặt chỗ)
 */
describe('ISS-113: Ẩn Kho Chưa Niêm Yết Giá Phía Khách Hàng & Hiển Thị Thể Tích m³ Trên Thẻ Kho', () => {
  it('UnitPickerPage lọc availableTypes chỉ chứa loại kho đã niêm yết giá, ẩn kho chưa niêm yết khỏi Customer', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/availableTypes = useMemo\(\s*\(\) =>[\s\S]*?baseMonthlyPrice > 0/);
    expect(content).toMatch(/standardTypesCount = useMemo\(\s*\(\) =>[\s\S]*?baseMonthlyPrice > 0/);
    expect(content).toMatch(/climateTypesCount = useMemo\(\s*\(\) =>[\s\S]*?baseMonthlyPrice > 0/);
  });

  it('UnitPickerPage hiển thị thể tích m³ trên thẻ kho thay vì diện tích m²', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/\{type\.volumeM3\}\s*m³/);
  });

  it('UnitPickerPage lọc bỏ ô kho con thuộc loại kho chưa niêm yết giá trên sơ đồ mặt bằng', () => {
    const content = getUnitPickerContent();
    expect(content).toMatch(/listedUTIds/);
  });
});

