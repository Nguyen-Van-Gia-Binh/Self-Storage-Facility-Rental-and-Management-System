/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-79 & BR-RET-12: Hủy yêu cầu trả kho với Modal xác nhận tùy chỉnh chuẩn Design System
 * Người thực hiện: Nhi
 */
describe('ISS-79: Custom Modal Confirmation for Cancel Return Flow (BR-RET-12)', () => {
  const rentedUnitCardPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/RentedUnitCard.tsx'
  );

  it('RentedUnitCard không còn sử dụng window.confirm native của trình duyệt', () => {
    const content = fs.readFileSync(rentedUnitCardPath, 'utf-8');
    expect(content).not.toMatch(/window\.confirm/);
  });

  it('RentedUnitCard định nghĩa state showCancelReturnModal và handler handleConfirmCancelReturn', () => {
    const content = fs.readFileSync(rentedUnitCardPath, 'utf-8');
    expect(content).toMatch(/showCancelReturnModal/);
    expect(content).toMatch(/setShowCancelReturnModal\(true\)/);
    expect(content).toMatch(/handleConfirmCancelReturn/);
    expect(content).toMatch(/cancelContractReturn\(contract\.id\)/);
  });

  it('RentedUnitCard tích hợp Modal xác nhận hủy trả kho với tiêu đề, cảnh báo và 2 nút hành động', () => {
    const content = fs.readFileSync(rentedUnitCardPath, 'utf-8');
    expect(content).toMatch(/Xác nhận hủy yêu cầu trả kho/);
    expect(content).toMatch(/Lịch hẹn nghiệm thu bàn giao ô kho sẽ được bãi bỏ/);
    expect(content).toMatch(/Quay lại \(Giữ lịch trả\)/);
    expect(content).toMatch(/Xác nhận hủy trả kho/);
  });

  it('Nút Hủy yêu cầu trả kho chỉ hiển thị khi PENDING_RETURN và chưa nghiệm thu', () => {
    const content = fs.readFileSync(rentedUnitCardPath, 'utf-8');
    expect(content).toMatch(/contract\.status === 'PENDING_RETURN'/);
    expect(content).toMatch(/contract\.inspectionDone/);
    expect(content).toMatch(/Hủy yêu cầu trả kho/);
  });
});
