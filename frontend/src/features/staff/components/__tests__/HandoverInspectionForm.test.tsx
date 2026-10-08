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
    expect(content).toMatch(/bg-slate-50\/80\s+-mx-5\s+-mb-5\s+p-4\s+rounded-b-2xl\s+border-t\s+border-slate-200/);
  });

  it('Giữ nguyên đầy đủ 2 nhánh hành động: Báo hỏng / Từ chối nhận và Xác nhận bàn giao & Kích hoạt mã PIN', () => {
    const content = fs.readFileSync(handoverInspectionFormPath, 'utf-8');
    expect(content).toMatch(/Báo hỏng \/ Khách từ chối nhận/);
    expect(content).toMatch(/XÁC NHẬN BÀN GIAO & KÍCH HOẠT MÃ PIN/);
    expect(content).toMatch(/onOpenRejectionModal/);
  });
});
