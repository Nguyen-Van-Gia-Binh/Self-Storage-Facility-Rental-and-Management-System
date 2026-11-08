/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * BUG-WS2-07 & BR-RET-06: Kiểm thử chính sách trả sớm Win-Win trên UI ScheduleReturnModal.tsx
 * Tác giả: Nguyễn Văn Gia Bình (WS2 Lead)
 */
describe('BUG-WS2-07 & BR-RET-06: ScheduleReturnModal Policy Audit', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/ScheduleReturnModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  it('Không chứa bất kỳ câu chữ đảo ngược chính sách ("không được hoàn trả tiền thuê")', () => {
    expect(content).not.toMatch(/không được hoàn trả/i);
    expect(content).not.toMatch(/không hoàn cước thuê/i);
    expect(content).not.toMatch(/chưa sử dụng sẽ không/i);
  });

  it('Đồng bộ chính xác chính sách Win-Win BR-RET-06: hoàn 100% tiền thuê ngày chưa dùng và khấu trừ 100% tiền cọc', () => {
    // Hoàn 100% tiền thuê chưa dùng
    expect(content).toMatch(/hoàn lại 100% tiền thuê của các ngày\/tháng chưa sử dụng/i);
    // Khấu trừ 100% tiền cọc
    expect(content).toMatch(/khấu trừ 100% tiền cọc/i);
    // Luận giải kinh tế bù đắp chi phí phòng trống
    expect(content).toMatch(/bồi thường vi phạm thời hạn hợp đồng để bù đắp chi phí phòng trống/i);
  });

  it('Có tính toán ước tính số tiền thuê ngày chưa dùng (earlyRefundEstimate)', () => {
    expect(content).toMatch(/earlyRefundEstimate/);
    expect(content).toMatch(/Chính sách quyết toán khi trả kho sớm/);
  });

  it('Quy trình 3 bước hiển thị đúng hạn quyết toán hoàn tiền trong 7 ngày làm việc', () => {
    expect(content).toMatch(/Hoàn tiền trong 7 ngày làm việc/);
    expect(content).toMatch(/Hoàn cọc trong 7 ngày làm việc/);
  });
});
