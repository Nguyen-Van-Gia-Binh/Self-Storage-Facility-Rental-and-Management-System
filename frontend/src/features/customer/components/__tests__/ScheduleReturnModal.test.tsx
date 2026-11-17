// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleReturnModal } from '../ScheduleReturnModal';
import type { RentedContract } from '../../types';

vi.mock('@/hooks/useActivePolicy', () => ({
  useActivePolicy: () => ({ returnNoticeDays: 30 }),
}));

vi.mock('@/api/customerRentals', () => ({
  scheduleContractReturn: vi.fn().mockResolvedValue({}),
}));

describe('ScheduleReturnModal — Chuẩn hóa UI Enterprise SaaS (Bỏ lạm dụng xanh lá, Header trắng & Nút Submit rõ trạng thái)', () => {
  const modalPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/ScheduleReturnModal.tsx'
  );

  it('Lỗi 1, 2 & 3 (Code): Header trắng bỏ gradient xanh đậm, checklist phẳng bỏ nền xanh lá, thông báo quá hạn màu xanh dương Info', () => {
    const content = fs.readFileSync(modalPath, 'utf-8');
    expect(content).not.toContain('from-[#0d6050] to-[#14937a]');
    expect(content).not.toContain('bg-emerald-50/70');
    expect(content).toContain('bg-blue-50 border border-blue-100');
    expect(content).toContain('bg-brand-600 hover:bg-brand-700');
    expect(content).toContain('disabled:bg-gray-200');
    expect(content).toContain('7 ngày làm việc');
  });

  it('Render & UX: hiển thị thông tin trả kho quá hạn màu xanh dương, nút Submit bị vô hiệu hóa màu xám cho tới khi tích đủ 2 cam kết', () => {
    const overdueContract = {
      id: '12',
      contractNumber: 'CTR-TEST-012',
      unitNumber: 'Q1-C102',
      unitTypeName: 'Máy Lạnh S',
      facilityName: 'Cơ sở Quận 1 - TP.HCM',
      startDate: '2026-08-14',
      endDate: '2026-11-14',
      status: 'OVERDUE',
      overdueDays: 3,
      monthlyRent: 1500000,
      depositHeld: 1500000,
    } as RentedContract;

    render(
      <ScheduleReturnModal
        isOpen={true}
        onClose={vi.fn()}
        contract={overdueContract}
      />
    );

    expect(screen.getByText('Xác Nhận Đã Dọn Đồ & Báo Trả Kho')).toBeInTheDocument();
    expect(screen.getByText(/Thông tin trả kho quá hạn \(D\+3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Quyết toán \(7 ngày làm việc\)/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Báo trả kho/i });
    expect(submitBtn).toBeDisabled();

    // Tích đủ 2 checkbox cam kết -> nút mở khóa sáng màu Brand Mint
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    expect(submitBtn).not.toBeDisabled();
    expect(submitBtn.className).toContain('bg-brand-600');
  });
});
