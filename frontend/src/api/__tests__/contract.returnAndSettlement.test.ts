import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { submitReturnInspection, getSettlementPreview, approveSettlementRefund } from '../contract';

describe('submitReturnInspection (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('gọi đúng endpoint với X-Staff-Id và body chuẩn', async () => {
    const fakeResponse = {
      success: true,
      data: {
        id: 7, status: 'PENDING_RETURN', returnDate: '2026-09-25',
        estimatedDepositRefund: 800000, overdueFee: 0, damageCost: 200000,
      }
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await submitReturnInspection(
      7,
      { returnDate: '2026-09-25', condition: 'MINOR_DAMAGE', damageNotes: 'Sàn trầy', damageCost: 200000, customerConfirmed: true },
      15
    );

    expect(spy).toHaveBeenCalledWith(
      '/contracts/7/return-inspections',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('MINOR_DAMAGE'),
      })
    );
    const callArgs = spy.mock.calls[0][1];
    expect(callArgs?.headers?.['X-Staff-Id']).toBeUndefined();
    expect(result.estimatedDepositRefund).toBe(800000);
  });
});

describe('getSettlementPreview (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('trả về data từ API không fallback mock', async () => {
    const fakeResponse = {
      success: true,
      data: {
        contractId: 4, depositAmount: 1000000, damageCost: 150000,
        overdueFee: 0, unpaidExtraCharges: 0, depositRefundAmount: 850000, payableAmount: 0,
      }
    };
    vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await getSettlementPreview(4);
    expect(result.depositRefundAmount).toBe(850000);
    expect(result.damageCost).toBe(150000);
  });
});

describe('approveSettlementRefund (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('không gắn X-Manager-Id header mà sử dụng JWT bearer từ apiClient', async () => {
    const fakeResponse = {
      success: true,
      data: { contractId: 4, status: 'CLOSED', message: 'Đã phê duyệt' }
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    await approveSettlementRefund(
      { contractId: 4, depositRefundAmount: 850000, damageCost: 150000 },
      99
    );

    expect(spy).toHaveBeenCalledWith(
      '/contracts/4/settlement-approval',
      expect.objectContaining({
        method: 'POST',
      })
    );
    const callArgs = spy.mock.calls[0][1];
    expect(callArgs?.headers?.['X-Manager-Id']).toBeUndefined();
  });
});
