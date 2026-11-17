import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * Kiểm thử hồi quy giao diện chuẩn Enterprise SaaS (Anti AI Slop)
 * - Triệt tiêu Colorful Badges ở cột Vấn đề hỗ trợ (chuyển sang text thuần).
 * - Sử dụng Semantic Colors tương phản cao và Chấm tròn trạng thái cho cột Trạng thái.
 * - Thay nút text "Chi tiết ->" bằng icon mũi tên ChevronRight.
 * - Tinh giản Tabs gạch chân (Underline Tabs) và số lượng đếm tinh tế tại SupportPage.
 */
describe('Support Ticket UI/UX Enterprise Revamp (Anti AI Slop)', () => {
  const tableFilePath = path.resolve(
    process.cwd(),
    'src/features/customer/components/SupportTicketTable.tsx'
  );
  const pageFilePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/SupportPage.tsx'
  );

  it('SupportTicketTable hiển thị Cột Vấn đề hỗ trợ dưới dạng text thuần, không dùng khung viền sặc sỡ', () => {
    const content = fs.readFileSync(tableFilePath, 'utf-8');
    // Không còn bọc catMeta.color làm border badge nhiều màu trong bảng
    expect(content).not.toMatch(/catMeta\.color/);
    expect(content).toMatch(/catMeta\.label/);
  });

  it('SupportTicketTable áp dụng Semantic Colors (Vàng/Cam, Xanh dương, Xám, Xanh lá) kèm dot indicator cho Cột Trạng thái', () => {
    const content = fs.readFileSync(tableFilePath, 'utf-8');
    // Trạng thái Đang xử lý: Amber / Warning
    expect(content).toMatch(/bg-amber-50.*text-amber-700/);
    // Trạng thái Đã phân công: Blue / Info
    expect(content).toMatch(/bg-blue-50.*text-blue-700/);
    // Trạng thái Đã đóng: Slate / Neutral
    expect(content).toMatch(/bg-slate-100.*text-slate-600/);
    // Dot indicator w-1.5 h-1.5 rounded-full
    expect(content).toMatch(/w-1\.5\s+h-1\.5\s+rounded-full/);
  });

  it('SupportTicketTable thay thế nút chữ "Chi tiết" bằng icon điều hướng ChevronRight tinh gọn', () => {
    const content = fs.readFileSync(tableFilePath, 'utf-8');
    expect(content).toMatch(/<ChevronRight/);
    expect(content).not.toMatch(/<span>Chi tiết<\/span>/);
  });

  it('SupportPage sử dụng Underline Tabs (gạch chân -mb-px) thay cho Pills nhiều màu', () => {
    const content = fs.readFileSync(pageFilePath, 'utf-8');
    expect(content).toMatch(/border-b-2/);
    expect(content).toMatch(/-mb-px/);
  });

  describe('SupportTicketDetailModal UI Revamp (Anti Box Soup & Flat Design)', () => {
    const modalFilePath = path.resolve(
      process.cwd(),
      'src/features/customer/components/SupportTicketDetailModal.tsx'
    );

    it('Header hiển thị "Chi tiết Yêu cầu Hỗ trợ" làm H2 và đưa Badge trạng thái sang góc phải', () => {
      const content = fs.readFileSync(modalFilePath, 'utf-8');
      expect(content).toMatch(/<h2[^>]*>\s*Chi tiết Yêu cầu Hỗ trợ\s*<\/h2>/);
      expect(content).toMatch(/flex items-center gap-2 mt-1 text-sm text-slate-500/);
    });

    it('Loại bỏ Hội chứng Hộp lồng Hộp (Box Soup), làm phẳng các khối thông tin bằng đường kẻ mỏng border-b', () => {
      const content = fs.readFileSync(modalFilePath, 'utf-8');
      expect(content).toMatch(/border-b\s+border-slate-100/);
      expect(content).toMatch(/Cơ sở & Ô kho/);
      expect(content).toMatch(/Hợp đồng & Khách hàng/);
      expect(content).toMatch(/Mô tả chi tiết sự cố/);
    });

    it('Nhân viên phụ trách hiển thị dạng text thông thường với avatar nhỏ 24px thay vì alert box màu mè', () => {
      const content = fs.readFileSync(modalFilePath, 'utf-8');
      expect(content).not.toMatch(/bg-sky-50\/70\s+border\s+border-sky-200\/80/);
      expect(content).toMatch(/w-6\s+h-6\s+rounded-full/);
    });

    it('Biên bản nghiệm thu & Khắc phục dùng nền xám nhẹ nhàng bg-slate-50 thay cho viền xanh mint lồng nhau', () => {
      const content = fs.readFileSync(modalFilePath, 'utf-8');
      expect(content).not.toMatch(/from-emerald-50\/70\s+to-white/);
      expect(content).toMatch(/bg-slate-50\s+rounded-lg\s+p-4\s+border\s+border-slate-200/);
    });
  });
});
