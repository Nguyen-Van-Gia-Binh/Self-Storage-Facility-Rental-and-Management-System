/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * BUG-WS2-07 & BR-RET-06: Kiểm thử chính sách trả sớm trên UI ScheduleReturnModal.tsx
 * Tác giả: Nguyễn Văn Gia Bình (WS2 Lead) & Frontend Lead
 */
describe('BUG-WS2-07 & BR-RET-06: ScheduleReturnModal Policy Audit', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/ScheduleReturnModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  it('Không chứa bất kỳ câu chữ đảo ngược chính sách ("không được hoàn trả cước thuê")', () => {
    expect(content).not.toMatch(/không hoàn cước thuê/i);
    expect(content).not.toMatch(/chưa sử dụng sẽ không được hoàn trả/i);
  });

  it('Đồng bộ chính xác chính sách BR-RET-06: hoàn 100% tiền thuê ngày chưa dùng và phạt 100% tiền cọc', () => {
    // Hoàn 100% tiền thuê chưa dùng
    expect(content).toMatch(/Hoàn tiền thuê chưa dùng/i);
    expect(content).toMatch(/Được hoàn trả 100%/i);
    // Mất 100% tiền cọc
    expect(content).toMatch(/Phạt trả sớm \(100% cọc\)/i);
    expect(content).toMatch(/Không được hoàn lại khi trả trước hạn/i);
  });

  it('Có tính toán ước tính số tiền thuê ngày chưa dùng (estimatedUnusedRent)', () => {
    expect(content).toMatch(/estimatedUnusedRent/);
    expect(content).toMatch(/Dự kiến hoàn trả/);
  });

  it('Quy trình 3 bước hiển thị đúng hạn quyết toán hoàn tiền trong 7 ngày làm việc', () => {
    expect(content).toMatch(/Quyết toán \(7 ngày làm việc\)/);
  });
});
