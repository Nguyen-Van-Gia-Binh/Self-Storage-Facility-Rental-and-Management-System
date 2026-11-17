// @vitest-environment jsdom
/// <reference types="node" />
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ContractFinancialModal } from '../ContractFinancialModal';
import * as contractApi from '@/api/contract';

vi.mock('@/api/contract', () => ({
  getContractFinancialDetail: vi.fn(),
}));

describe('ContractFinancialModal — Chuẩn hóa Sổ cái Tài chính Enterprise (Ledger Style)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('hiển thị đúng dữ liệu tài chính theo cấu trúc Sổ cái (Ledger), giải thích phí phạt dễ hiểu và Empty State gọn gàng', async () => {
    vi.mocked(contractApi.getContractFinancialDetail).mockResolvedValue({
      contractId: 7,
      contractCode: 'CTR-TEST-007',
      depositAmount: 2500000,
      depositBalance: 0,
      totalRentalFee: 7500000,
      overdueFeeAccrued: 1375000,
      totalOutstandingDebt: 1375000,
      extraCharges: [],
    });

    render(<ContractFinancialModal isOpen={true} contractId={7} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Chi tiết tài chính & Công nợ')).toBeInTheDocument();
      expect(screen.getByText(/CTR-TEST-007/)).toBeInTheDocument();
    });

    expect(screen.getByText('THÔNG TIN THANH TOÁN')).toBeInTheDocument();
    expect(screen.getByText('PHÁT SINH & CÔNG NỢ')).toBeInTheDocument();
    expect(screen.getByText('TỔNG CÔNG NỢ CẦN THU')).toBeInTheDocument();

    expect(screen.getByText('7.500.000 đ')).toBeInTheDocument();
    expect(screen.getByText('2.500.000 đ')).toBeInTheDocument();
    expect(screen.getAllByText('1.375.000 đ').length).toBeGreaterThanOrEqual(2);

    // Copy giải thích phí phạt tự nhiên, không hiển thị phương trình D+1..3 • D+4..6
    expect(
      screen.getByText(/Áp dụng phạt 5%\/ngày \(Ngày 1–3\) và 10%\/ngày \(từ ngày 4\)/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/D\+1\.\.3/)).not.toBeInTheDocument();

    // Empty state gọn gàng cho danh mục phụ phí
    expect(screen.getByText(/Không có phụ phí phát sinh nào khác\./i)).toBeInTheDocument();
  });

  it('loại bỏ hoàn toàn Header nền đen, Bento Box 4 màu pastel và icon khiên, dùng tabular-nums căn phải', () => {
    const content = fs.readFileSync(
      path.resolve(process.cwd(), 'src/features/manager/components/ContractFinancialModal.tsx'),
      'utf-8'
    );

    expect(content).not.toContain('from-slate-900 to-slate-800');
    expect(content).not.toContain('bg-emerald-50/70');
    expect(content).not.toContain('bg-blue-50/70');
    expect(content).not.toContain('bg-amber-50/70');
    expect(content).not.toContain('bg-rose-50/70');
    expect(content).not.toContain('ShieldCheck');
    expect(content).not.toContain('D+1..3');
    expect(content).toContain('tabular-nums');
    expect(content).toContain('text-right');
  });
});
