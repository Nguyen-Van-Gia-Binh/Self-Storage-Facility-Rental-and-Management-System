// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { render, screen, cleanup } from '@testing-library/react';
import { ContractTable } from '../ContractTable';
import type { ManagerContractItem } from '@/types/contractManager';

const makeContract = (overrides: Partial<ManagerContractItem>): ManagerContractItem =>
  ({
    id: 1,
    code: 'CTR-001',
    facilityId: 1,
    facilityName: 'Cơ sở Quận 1 - TP.HCM',
    customerId: 10,
    customerName: 'Nguyễn Phạm Xuân Nhi',
    customerPhone: '0973499377',
    storageUnitId: 11,
    storageUnitCode: 'Q1-A101',
    unitTypeId: 1,
    unitTypeName: 'Kho Tiêu Chuẩn S',
    startDate: '2026-10-12',
    endDateExclusive: '2036-11-16',
    rentalMonths: 3,
    monthlyPrice: 1000000,
    depositAmount: 1000000,
    depositBalance: 1000000,
    status: 'ACTIVE',
    ...overrides,
  }) as ManagerContractItem;

describe('ContractTable, StatusBadge & CreateDirectContractModal — Chuẩn hóa Enterprise SaaS', () => {
  afterEach(() => {
    cleanup();
  });

  it('ContractTable định dạng ngày DD/MM/YYYY, đồng bộ Soft Badges ngữ nghĩa và làm nổi bật nút Duyệt quyết toán màu Mint', () => {
    const contracts: ManagerContractItem[] = [
      makeContract({ id: 1, code: 'CTR-ACT', status: 'ACTIVE', startDate: '2026-10-12', endDateExclusive: '2027-01-10' }),
      makeContract({ id: 2, code: 'CTR-INS', status: 'INSPECTED', startDate: '2026-11-16', endDateExclusive: '2036-11-16' }),
      makeContract({ id: 3, code: 'CTR-RET', status: 'PENDING_RETURN', endDateExclusive: '2026-11-18' }),
      makeContract({ id: 4, code: 'CTR-TRM', status: 'TERMINATED', endDateExclusive: '2026-11-09' }),
      makeContract({ id: 5, code: 'CTR-CLS', status: 'CLOSED', endDateExclusive: '2026-09-27' }),
    ];

    render(
      <ContractTable
        contracts={contracts}
        onSelectContract={vi.fn()}
        onApproveSettlement={vi.fn()}
      />
    );

    // Lỗi 1: Toàn bộ ngày hiển thị DD/MM/YYYY
    expect(screen.getByText('16/11/2036')).toBeInTheDocument();
    expect(screen.getByText('10/01/2027')).toBeInTheDocument();
    expect(screen.getByText('Từ: 16/11/2026')).toBeInTheDocument();
    expect(screen.queryByText('2036-11-16')).not.toBeInTheDocument();

    // Lỗi 2: Semantic Soft Badges
    expect(screen.getByText('Đang hiệu lực').className).toContain('bg-emerald-50');
    expect(screen.getByText('Đã nghiệm thu').className).toContain('bg-emerald-50');
    expect(screen.getByText('Chờ trả kho').className).toContain('bg-amber-50');
    expect(screen.getAllByText('Đã chấm dứt')[0].className).toContain('bg-rose-50');
    expect(screen.getByText('Đã kết thúc').className).toContain('bg-gray-100');

    // Lỗi 3: Nút Duyệt quyết toán dùng màu Xanh Mint đậm (Primary)
    const approveBtns = screen.getAllByRole('button', { name: /Duyệt quyết toán/i });
    expect(approveBtns.length).toBeGreaterThanOrEqual(1);
    expect(approveBtns[0].className).toContain('bg-brand-600');
  });

  it('CreateDirectContractModal: Header trắng sạch, Section đánh số gọn, nút Submit đậm Brand-600 và bỏ mã enum CASH/BANK_TRANSFER', () => {
    const modalPath = path.resolve(
      process.cwd(),
      'src/features/manager/components/CreateDirectContractModal.tsx'
    );
    const content = fs.readFileSync(modalPath, 'utf-8');

    // Lỗi 1: Header nền trắng, không còn nền xanh lá đậm gradient
    expect(content).not.toContain('from-brand-700 via-brand-800 to-teal-800');
    expect(content).toContain('border-b border-gray-200 bg-white');

    // Lỗi 2 & 4: Section gọn, không lộ enum (CASH)/(BANK_TRANSFER), bỏ emoji cảnh báo và định dạng ngày kết thúc DD/MM/YYYY
    expect(content).not.toContain('(CASH)');
    expect(content).not.toContain('(BANK_TRANSFER)');
    expect(content).not.toContain('⚠️');
    expect(content).toContain('formatDateVN');

    // Lỗi 3: Nút Submit dùng bg-brand-600 rõ nét thay vì gradient mờ
    expect(content).not.toContain('from-teal-700 to-brand-700');
    expect(content).toContain('bg-brand-600 hover:bg-brand-700 text-white');
  });
});
