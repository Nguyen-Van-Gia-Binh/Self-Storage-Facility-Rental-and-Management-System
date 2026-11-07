/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

describe('HandoverRejectionModal & StaffCheckInPage 2-Branch Defect Flow', () => {
  const resolveSource = (relativePath: string) => {
    const p1 = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(p1)) return p1;
    return path.resolve(process.cwd(), 'frontend', relativePath);
  };
  const modalPath = resolveSource('src/features/staff/components/HandoverRejectionModal.tsx');
  const checkInPagePath = resolveSource('src/features/staff/pages/StaffCheckInPage.tsx');

  it('HandoverRejectionModal định nghĩa đầy đủ 2 nhánh xử lý: RELOCATE và TERMINATE_REFUND', () => {
    const content = fs.readFileSync(modalPath, 'utf-8');
    expect(content).toMatch(/HandoverRejectionAction\s*=\s*'RELOCATE'\s*\|\s*'TERMINATE_REFUND'/);
    expect(content).toMatch(/Đổi ô kho mới/);
    expect(content).toMatch(/Hủy & Hoàn 100%/);
    expect(content).toMatch(/action === 'RELOCATE'\s*\?\s*'Xác nhận gửi FM đổi ô mới'\s*:\s*'Xác nhận hủy & Hoàn cọc 100%'/);
  });

  it('StaffCheckInPage tích hợp chế độ đợi FM đổi ô kho với đồng bộ tự động và nút F5', () => {
    const content = fs.readFileSync(checkInPagePath, 'utf-8');
    expect(content).toMatch(/isAwaitingRelocation/);
    expect(content).toMatch(/ĐANG CHỜ QUẢN LÝ \(FM\) ĐỔI Ô KHO/);
    expect(content).toMatch(/Kiểm tra & Làm mới ngay \(F5\)/);
    expect(content).toMatch(/rejectionAction:\s*action/);
  });
});
