import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type { RentedContract } from '../../types';

/**
 * ISS-106: Tách rành rọt các Tab nghiệp vụ trên Customer Portal (Phương án A)
 * 1. Đang hoạt động (ACTIVE): Gồm kho bình thường và sắp hết hạn (có badge đếm ngược + nút gia hạn)
 * 2. Quá hạn (OVERDUE): Gồm các kho quá hạn nợ phạt D+1..D+9
 * 3. Chờ trả kho (PENDING_RETURN): Gồm các kho đang chờ nhân viên kiểm tra nghiệm thu
 * 4. Chờ nhận kho (PENDING_CHECKIN): Các kho đã cọc, chờ check-in
 * 5. Giữ chỗ 48h (PENDING_PAYMENT): Đơn giữ chỗ chờ thanh toán
 * 6. Đã kết thúc (CLOSED): Các hợp đồng đã thanh lý hoàn tất
 */
describe('ISS-106: Customer MyUnits Separate Lifecycle Tabs (Option A)', () => {
  const myUnitsPagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/MyUnitsPage.tsx'
  );

  it('MyUnitsPage.tsx hiển thị đầy đủ 6 Tab trạng thái riêng biệt, rành rọt', () => {
    const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
    expect(content).toMatch(/<span>Đang hoạt động<\/span>/);
    expect(content).toMatch(/<span>Quá hạn<\/span>/);
    expect(content).toMatch(/<span>Chờ trả kho<\/span>/);
    expect(content).toMatch(/<span>Chờ nhận kho<\/span>/);
    expect(content).toMatch(/<span>Giữ chỗ 48h<\/span>/);
    expect(content).toMatch(/<span>Đã kết thúc<\/span>/);
    // Không còn tab gom "Cần gia hạn" mơ hồ
    expect(content).not.toMatch(/<span>Cần gia hạn<\/span>/);
  });

  it('MyUnitsPage.tsx định nghĩa các bộ đếm độc lập cho từng tab', () => {
    const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
    expect(content).toMatch(/activeCount/);
    expect(content).toMatch(/expiringCount/);
    expect(content).toMatch(/overdueCount/);
    expect(content).toMatch(/pendingReturnCount/);
    expect(content).toMatch(/pendingCheckinCount/);
    expect(content).toMatch(/closedCount/);
  });

  it('MyUnitsPage.tsx lọc chính xác theo từng tab nghiệp vụ', () => {
    const content = fs.readFileSync(myUnitsPagePath, 'utf-8');
    expect(content).toMatch(/activeTab === 'ACTIVE' && contract\.status !== 'ACTIVE'/);
    expect(content).toMatch(/activeTab === 'OVERDUE' && contract\.status !== 'OVERDUE'/);
    expect(content).toMatch(/activeTab === 'PENDING_RETURN' && contract\.status !== 'PENDING_RETURN'/);
    expect(content).toMatch(/activeTab === 'PENDING_CHECKIN'/);
    expect(content).toMatch(/activeTab === 'CLOSED'/);
  });

  describe('Filter Simulation: Kiểm tra phân nhóm hợp đồng chuẩn xác', () => {
    const filterByTab = (contracts: Partial<RentedContract>[], tab: string) => {
      return contracts.filter((c) => {
        if (tab === 'ACTIVE') return c.status === 'ACTIVE';
        if (tab === 'OVERDUE') return c.status === 'OVERDUE';
        if (tab === 'PENDING_RETURN') return c.status === 'PENDING_RETURN';
        if (tab === 'PENDING_CHECKIN') return c.status === 'PENDING_CHECKIN' || (c.status as any) === 'PENDING_CHECK_IN';
        if (tab === 'CLOSED') return c.status === 'CLOSED' || c.status === 'TERMINATED';
        return true;
      });
    };

    const mockContracts: Partial<RentedContract>[] = [
      { id: '1', status: 'ACTIVE', contractNumber: 'CTR-ACTIVE-NORMAL' },
      { id: '2', status: 'ACTIVE', contractNumber: 'CTR-ACTIVE-EXPIRING' },
      { id: '3', status: 'OVERDUE', contractNumber: 'CTR-OVERDUE-D2' },
      { id: '4', status: 'OVERDUE', contractNumber: 'CTR-OVERDUE-D5' },
      { id: '5', status: 'PENDING_RETURN', contractNumber: 'CTR-RETURN-INSPECT' },
      { id: '6', status: 'PENDING_CHECKIN', contractNumber: 'CTR-CHECKIN' },
      { id: '7', status: 'CLOSED', contractNumber: 'CTR-CLOSED' },
    ];

    it('Tab ACTIVE chỉ chứa hợp đồng ACTIVE (cả bình thường và sắp hết hạn)', () => {
      const result = filterByTab(mockContracts, 'ACTIVE');
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.contractNumber)).toEqual([
        'CTR-ACTIVE-NORMAL',
        'CTR-ACTIVE-EXPIRING',
      ]);
    });

    it('Tab OVERDUE chỉ chứa các hợp đồng OVERDUE (quá hạn)', () => {
      const result = filterByTab(mockContracts, 'OVERDUE');
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.contractNumber)).toEqual([
        'CTR-OVERDUE-D2',
        'CTR-OVERDUE-D5',
      ]);
    });

    it('Tab PENDING_RETURN chỉ chứa hợp đồng chờ nghiệm thu trả kho', () => {
      const result = filterByTab(mockContracts, 'PENDING_RETURN');
      expect(result).toHaveLength(1);
      expect(result[0].contractNumber).toBe('CTR-RETURN-INSPECT');
    });

    it('Tab PENDING_CHECKIN chỉ chứa hợp đồng chờ nhận kho', () => {
      const result = filterByTab(mockContracts, 'PENDING_CHECKIN');
      expect(result).toHaveLength(1);
      expect(result[0].contractNumber).toBe('CTR-CHECKIN');
    });

    it('Tab CLOSED chỉ chứa hợp đồng đã kết thúc', () => {
      const result = filterByTab(mockContracts, 'CLOSED');
      expect(result).toHaveLength(1);
      expect(result[0].contractNumber).toBe('CTR-CLOSED');
    });
  });
});
