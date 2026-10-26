/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getStatusMeta } from '../SupportTicketCard';

/**
 * Kiểm thử hồi quy tự động cho các lỗi ISS-125, ISS-126, ISS-127
 * Người thực hiện: Xuân Nhi
 */
describe('Customer Bug Fixes: ISS-125, ISS-126, ISS-127', () => {
  const myUnitsPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/MyUnitsPage.tsx'
  );
  const myUnitsModalsPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/MyUnitsModals.tsx'
  );
  const bookingPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/BookingPage.tsx'
  );

  describe('ISS-125: Hủy yêu cầu trả kho trên MyUnitsTable & MyUnitsModals', () => {
    it('MyUnitsPage import cancelContractReturn và định nghĩa state selectedCancelReturnContract', () => {
      const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
      expect(content).toMatch(/import \{.*cancelContractReturn.*\} from '@\/api\/customerRentals'/);
      expect(content).toMatch(/selectedCancelReturnContract/);
      expect(content).toMatch(/setSelectedCancelReturnContract/);
      expect(content).toMatch(/isCancellingReturn/);
      expect(content).toMatch(/handleConfirmCancelReturn/);
      expect(content).toMatch(/await cancelContractReturn\(selectedCancelReturnContract\.id\)/);
    });

    it('MyUnitsTable nhận callback onCancelReturn kích hoạt mở modal xác nhận', () => {
      const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
      expect(content).toMatch(/onCancelReturn=\{\(c\)\s*=>\s*\{/);
      expect(content).toMatch(/setSelectedCancelReturnContract\(c\)/);
    });

    it('MyUnitsModals định nghĩa và hiển thị modal xác nhận hủy yêu cầu trả kho chuẩn design system', () => {
      const content = fs.readFileSync(myUnitsModalsPath, 'utf-8');
      expect(content).toMatch(/selectedCancelReturnContract/);
      expect(content).toMatch(/Xác nhận hủy yêu cầu trả kho/);
      expect(content).toMatch(/Sau khi hủy, hợp đồng sẽ tiếp tục được duy trì hoạt động bình thường/);
      expect(content).toMatch(/onConfirmCancelReturn/);
    });
  });

  describe('ISS-126: Thống nhất nhãn trạng thái vé hỗ trợ RESOLVED, CLOSED, AUTO_CLOSED', () => {
    it('getStatusMeta trả về nhãn "Đã đóng" và variant "default" cho RESOLVED, CLOSED và AUTO_CLOSED', () => {
      expect(getStatusMeta('RESOLVED')).toEqual({
        label: 'Đã đóng',
        variant: 'default',
      });
      expect(getStatusMeta('CLOSED')).toEqual({
        label: 'Đã đóng',
        variant: 'default',
      });
      expect(getStatusMeta('AUTO_CLOSED')).toEqual({
        label: 'Đã đóng',
        variant: 'default',
      });
    });

    it('getStatusMeta vẫn duy trì nhãn chính xác cho các trạng thái đang hoạt động', () => {
      expect(getStatusMeta('NEW')).toEqual({
        label: 'Mới gửi',
        variant: 'default',
      });
      expect(getStatusMeta('ASSIGNED')).toEqual({
        label: 'Đã phân công',
        variant: 'info',
      });
      expect(getStatusMeta('IN_PROGRESS')).toEqual({
        label: 'Đang xử lý',
        variant: 'warning',
      });
    });
  });

  describe('ISS-127: Xử lý ngoại lệ UNIT_NOT_AVAILABLE bằng unavailableModal tại BookingPage', () => {
    it('BookingPage xử lý UNIT_NOT_AVAILABLE bằng unavailableModal kèm actionType NAVIGATE_UNITS', () => {
      const content = fs.readFileSync(bookingPagePath, 'utf-8');
      expect(content).toMatch(/err\?\.errorCode === 'UNIT_NOT_AVAILABLE'/);
      expect(content).toMatch(/setUnavailableModal\(\{/);
      expect(content).toMatch(/title:\s*'Ô kho không còn khả dụng'/);
      expect(content).toMatch(/actionType:\s*'NAVIGATE_UNITS'/);
    });
  });
});
