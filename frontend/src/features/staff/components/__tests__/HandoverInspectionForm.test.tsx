/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-84: Khắc phục lỗi thanh thao tác bàn giao Check-in bị sticky ghim dính che nội dung
 * Người thực hiện: Bình (WS2 - Cơ sở & Vận hành)
 */
describe('ISS-84: HandoverInspectionForm Action Footer Clean Scroll Fix', () => {
  const handoverInspectionFormPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/HandoverInspectionForm.tsx'
  );

  it('HandoverInspectionForm không còn sử dụng sticky bottom-0 hoặc backdrop-blur gây dính màn hình', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).not.toMatch(/sticky bottom-0/);
    expect(content).not.toMatch(/backdrop-blur/);
    expect(content).not.toMatch(/z-20 shadow-lg/);
  });

  it('Thanh thao tác bàn giao được định dạng tự nhiên ở chân thẻ form với viền trên và nền phân tách rõ ràng', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).toMatch(/bg-gray-50\s+border-t\s+border-gray-200/);
    expect(content).not.toMatch(/sticky bottom-0/);
  });

  it('Giữ nguyên đầy đủ 2 nhánh hành động trên cùng 1 hàng ngang cân đối, loại bỏ nhãn vàng gây rớt dòng', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).toMatch(/Báo hỏng \/ Khách từ chối nhận/);
    expect(content).toMatch(/XÁC NHẬN BÀN GIAO & KÍCH HOẠT MÃ PIN/);
    expect(content).toMatch(/onOpenRejectionModal/);
    expect(content).not.toMatch(/Cần có chữ ký xác nhận của khách/);
    expect(content).toMatch(/sm:flex-row items-stretch sm:items-center justify-between/);
  });

  it('Khi ô kho có sự cố và chờ đổi (relocationEligible / isAwaitingRelocation), hiển thị banner cảnh báo và khóa bàn giao', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).toMatch(/Ô kho phát sinh sự cố — Tạm dừng thủ tục bàn giao/);
    expect(content).toMatch(/Đã ghi nhận sự cố & chờ Quản lý đổi ô kho/);
    expect(content).toMatch(/!isAwaitingRelocation/);
  });

  it('Chuẩn hóa UI phẳng Enterprise SaaS: banner sự cố viền trái amber-500, badge chờ đổi kho màu xanh Info (blue-50) và phân tách 4 mục bằng đường kẻ ngang', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).toContain('border-l-4 border-amber-500 bg-amber-50');
    expect(content).toContain('bg-blue-50 text-blue-700 border border-blue-100');
    expect(content).not.toContain('bg-amber-100/70');
    expect(content).toMatch(/3\. Ảnh chụp hiện trạng bàn giao kho/i);
    expect(content).toMatch(/4\. Chữ ký xác nhận của khách hàng/i);
  });

  it('Hoàn thiện 4 điểm Design Lead: Text link chọn nhanh, nút Báo hỏng Outline Red, Checkbox pháp lý nằm trong Footer và làm phẳng cột trái', () => {
    const formContent = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    const cardPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/CustomerVerificationCard.tsx'
    );
    const cardContent = fs.readFileSync(cardPath, 'utf-8');

    // Lỗi 2: "Chọn tất cả đạt chuẩn" là text link gọn, không bọc nền/viền xanh
    expect(formContent).not.toContain('Sparkles');
    expect(formContent).toContain('hover:underline');

    // Lỗi 3: Nút Báo hỏng dùng Outline Red (bg-white text-rose-600 border-rose-300), không dùng nền hồng bg-rose-50
    expect(formContent).toContain('text-rose-600 bg-white border border-rose-300');
    expect(formContent).not.toContain('text-rose-600 bg-rose-50');

    // Lỗi 4: Checkbox pháp lý đặt trong Footer (sau marker Footer) ngay cạnh/trên nút Submit
    const footerIndex = formContent.indexOf('bg-gray-50 border-t border-gray-200');
    const legalCheckboxIndex = formContent.indexOf('xác nhận đồng ý nhận bàn giao ô kho');
    expect(footerIndex).toBeGreaterThan(-1);
    expect(legalCheckboxIndex).toBeGreaterThan(footerIndex);

    // Lỗi 1 (cột trái): bỏ hộp viền bao mã ô kho và chuẩn hóa hiển thị ngày DD/MM/YYYY
    expect(cardContent).not.toContain('bg-brand-50 border border-brand-200 px-2.5');
    expect(cardContent).toContain('formatDateVN');
  });
});
