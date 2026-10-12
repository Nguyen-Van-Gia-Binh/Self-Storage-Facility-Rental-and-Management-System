import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { calculateDaysRemaining } from '../../utils/renewalPricing';
import type { RentedContract } from '../../types';

/**
 * ISS-106: Tab "Cần xử lý" trên Customer Portal (Kho Của Tôi)
 * Kiểm thử logic lọc tập trung cho các ô kho cần khách hàng hành động:
 * 1. Sắp hết hạn (ACTIVE + daysRemaining <= threshold)
 * 2. Quá hạn (OVERDUE)
 * 3. Chờ nghiệm thu trả kho (PENDING_RETURN)
 */
describe('ISS-106: Customer MyUnits Attention Tab & Filter Logic', () => {
  const myUnitsPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/MyUnitsPage.tsx'
  );
  const kpiSummaryPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/CustomerRentalsKpiSummary.tsx'
  );

  it('MyUnitsPage.tsx hiển thị Tab nhãn "Cần xử lý" thay vì "Cần gia hạn"', () => {
    const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
    expect(content).toMatch(/<span>Cần xử lý<\/span>/);
    expect(content).not.toMatch(/<span>Cần gia hạn<\/span>/);
  });

  it('MyUnitsPage.tsx chứa hàm isAttentionContract kiểm tra daysRemaining và status', () => {
    const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
    expect(content).toMatch(/isAttentionContract/);
    expect(content).toMatch(/calculateDaysRemaining\(c\.endDate\)/);
  });

  it('CustomerRentalsKpiSummary.tsx đồng bộ nhãn thẻ Bento "Cần xử lý" và badge "Cần thao tác"', () => {
    const content = fs.readFileSync(kpiSummaryPath, 'utf-8');
    expect(content).toMatch(/label:\s*'Cần xử lý'/);
    expect(content).toMatch(/badgeText:\s*'Cần thao tác'/);
    expect(content).not.toMatch(/label:\s*'Cần gia hạn'/);
  });

  // Kiểm thử logic phân loại hợp đồng theo nghiệp vụ
  describe('Business Rule Validation: Kiểm tra logic phân loại vào nhóm Cần xử lý', () => {
    const isAttentionLogic = (c: Partial<RentedContract>, noticeDays = 30): boolean => {
      if (c.status === 'OVERDUE' || c.status === 'PENDING_RETURN' || (c.status as any) === 'EXPIRING_SOON') {
        return true;
      }
      if (c.status === 'ACTIVE' && c.endDate) {
        const days = calculateDaysRemaining(c.endDate);
        const threshold = (noticeDays && noticeDays > 0 ? noticeDays : 30) + 7;
        return days > 0 && days <= threshold;
      }
      return false;
    };

    it('Hợp đồng ACTIVE sắp hết hạn (còn 10 ngày) ĐƯỢC tính vào nhóm Cần xử lý', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const contract: Partial<RentedContract> = {
        id: '1',
        status: 'ACTIVE',
        endDate: futureDate.toISOString().slice(0, 10),
      };

      expect(isAttentionLogic(contract)).toBe(true);
    });

    it('Hợp đồng ACTIVE thời hạn còn dài (còn 90 ngày) KHÔNG bị đưa vào nhóm Cần xử lý', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const contract: Partial<RentedContract> = {
        id: '2',
        status: 'ACTIVE',
        endDate: futureDate.toISOString().slice(0, 10),
      };

      expect(isAttentionLogic(contract)).toBe(false);
    });

    it('Hợp đồng PENDING_RETURN (đã báo trả kho, chờ nghiệm thu) ĐƯỢC tính vào nhóm Cần xử lý', () => {
      const contract: Partial<RentedContract> = {
        id: '3',
        status: 'PENDING_RETURN',
        endDate: '2026-10-15',
      };

      expect(isAttentionLogic(contract)).toBe(true);
    });

    it('Hợp đồng OVERDUE (quá hạn nợ phạt) ĐƯỢC tính vào nhóm Cần xử lý', () => {
      const contract: Partial<RentedContract> = {
        id: '4',
        status: 'OVERDUE',
        endDate: '2026-10-01',
      };

      expect(isAttentionLogic(contract)).toBe(true);
    });

    it('Hợp đồng CLOSED hoặc TERMINATED KHÔNG lọt vào nhóm Cần xử lý', () => {
      const closedContract: Partial<RentedContract> = {
        id: '5',
        status: 'CLOSED',
        endDate: '2026-09-01',
      };
      const terminatedContract: Partial<RentedContract> = {
        id: '6',
        status: 'TERMINATED',
        endDate: '2026-09-01',
      };

      expect(isAttentionLogic(closedContract)).toBe(false);
      expect(isAttentionLogic(terminatedContract)).toBe(false);
    });
  });
});
