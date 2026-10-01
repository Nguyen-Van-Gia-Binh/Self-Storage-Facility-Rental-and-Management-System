/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-79: Đồng bộ hóa Modal thông báo Tạo vé thành công & Modal xác nhận Hủy vé hỗ trợ
 * Người thực hiện: Nhi
 */
describe('ISS-79: Support Ticket Success Modal & Cancel Confirmation Modal', () => {
  const supportPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/SupportPage.tsx'
  );
  const supportTicketCardPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/SupportTicketCard.tsx'
  );

  it('SupportPage định nghĩa state createdSuccessTicket và hiển thị Modal thông báo tạo vé thành công', () => {
    const content = fs.readFileSync(supportPagePath, 'utf-8');
    expect(content).toMatch(/createdSuccessTicket/);
    expect(content).toMatch(/setCreatedSuccessTicket/);
    expect(content).toMatch(/Gửi yêu cầu hỗ trợ thành công!/);
    expect(content).toMatch(/Mã vé:\s*\{createdSuccessTicket\?\.ticketCode\}/);
    expect(content).toMatch(/Xem chi tiết & Tiến trình/);
  });

  it('SupportPage định nghĩa state cancellingTicket và hiển thị Modal xác nhận hủy vé trước khi gọi API', () => {
    const content = fs.readFileSync(supportPagePath, 'utf-8');
    expect(content).toMatch(/cancellingTicket/);
    expect(content).toMatch(/setCancellingTicket/);
    expect(content).toMatch(/handleConfirmCancelTicket/);
    expect(content).toMatch(/Xác nhận hủy yêu cầu hỗ trợ/);
    expect(content).toMatch(/Quay lại \(Giữ vé\)/);
    expect(content).toMatch(/Xác nhận hủy vé/);
  });

  it('SupportTicketCard truyền ticket vào callback onCancel khi nhấn Hủy yêu cầu', () => {
    const content = fs.readFileSync(supportTicketCardPath, 'utf-8');
    expect(content).toMatch(/onCancel\(ticket\)/);
    expect(content).toMatch(/Hủy yêu cầu/);
  });

  it('SupportTicketDetailModal không còn dùng window.confirm và tích hợp Modal xác nhận hủy vé', () => {
    const detailModalPath = path.resolve(
      process.cwd(),
      'src/features/customer/components/SupportTicketDetailModal.tsx'
    );
    const content = fs.readFileSync(detailModalPath, 'utf-8');
    expect(content).not.toMatch(/window\.confirm/);
    expect(content).toMatch(/showCancelConfirm/);
    expect(content).toMatch(/handleConfirmCancel/);
    expect(content).toMatch(/Xác nhận hủy yêu cầu hỗ trợ/);
  });
});
