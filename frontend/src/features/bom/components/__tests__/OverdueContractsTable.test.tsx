// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { OverdueContractsTable } from '../OverdueContractsTable';
import type { OverdueContractItem } from '@/types';

function row(partial: Partial<OverdueContractItem> & Pick<OverdueContractItem, 'contractId' | 'accruedOverdueFee' | 'overdueDays'>): OverdueContractItem {
  return {
    contractCode: `CTR-${partial.contractId}`,
    facilityId: 1,
    facilityName: 'Cơ sở Quận 1 - TP.HCM',
    customerName: 'Nguyễn Phạm Xuân Nhi',
    customerPhone: '0967890123',
    unitCode: 'Q1-XS101',
    endDateExclusive: '2026-11-06',
    monthlyRentalPrice: 800000,
    status: 'OVERDUE',
    ...partial,
  };
}

describe('OverdueContractsTable', () => {
  it('xếp khoản phạt lớn lên trước và gạch khi phạt bằng 0', () => {
    render(
      <OverdueContractsTable
        items={[
          row({ contractId: 12, contractCode: 'CTR-012', accruedOverdueFee: 0, overdueDays: 8 }),
          row({ contractId: 6, contractCode: 'CTR-006', accruedOverdueFee: 350000, overdueDays: 10 }),
        ]}
      />
    );

    const codes = screen.getAllByText(/CTR-/).map((node) => node.textContent);
    expect(codes.indexOf('CTR-006')).toBeLessThan(codes.indexOf('CTR-012'));
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getAllByText('Cưỡng chế niêm phong')).toHaveLength(2);
    expect(screen.queryByText('Nợ nhiều nhất')).not.toBeInTheDocument();
  });
});
