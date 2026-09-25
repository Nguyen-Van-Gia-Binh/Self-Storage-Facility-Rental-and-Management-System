import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { getContracts, approveSettlement } from '../contract';

describe('getContracts & approveSettlement (WS2 Contract APIs)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getContracts: gọi đúng endpoint phân trang với status, keyword và facilityIds', async () => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
    const fakePageResponse = {
      success: true,
      data: {
        content: [
          {
            id: 1,
            code: 'CTR-001',
            customerId: 10,
            facilityId: 1,
            status: 'ACTIVE',
            monthlyPrice: 500000,
            depositAmount: 1000000,
          },
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      },
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakePageResponse as any);

    const result = await getContracts({ status: 'ACTIVE', keyword: 'CTR', facilityId: 1, page: 0, size: 10 });

    expect(spy).toHaveBeenCalledWith('/contracts?status=ACTIVE&keyword=CTR&facilityIds=1&page=0&size=10');
    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
  });

  it('getContracts: trả về dữ liệu mock khi bật isMockEnabled(WS2)', async () => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(true);

    const result = await getContracts({ page: 0, size: 5 });

    expect(result).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.page).toBe(0);
    expect(result.size).toBe(5);
  });

  it('approveSettlement: gửi X-Manager-Id và body điều chỉnh thiệt hại', async () => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
    const fakeResponse = { success: true, data: { status: 'CLOSED' } };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await approveSettlement(12, { adjustedDamageCost: 150000, approvedNotes: 'Duyệt' }, 99);

    expect(spy).toHaveBeenCalledWith(
      '/contracts/12/settlement-approval',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Manager-Id': '99' }),
        body: JSON.stringify({ adjustedDamageCost: 150000, approvedNotes: 'Duyệt' }),
      })
    );
    expect(result).toEqual({ status: 'CLOSED' });
  });
});
