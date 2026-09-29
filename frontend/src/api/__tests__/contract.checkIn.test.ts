import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { checkInContract } from '../contract';

describe('checkInContract (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('gọi apiClient với URL đúng và gắn X-Staff-Id header', async () => {
    const fakeResponse = {
      success: true,
      data: {
        contractId: 5,
        status: 'ACTIVE',
        checkinDate: '2026-09-25',
        accessCode: '482019',
      }
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await checkInContract(
      5,
      { checkinDate: '2026-09-25', conditionNote: 'Tốt', customerConfirmed: true, notes: 'OK', accessCardCode: 'CARD-001' },
      42 // staffId
    );

    expect(spy).toHaveBeenCalledWith(
      '/contracts/5/check-in',
      expect.objectContaining({
        method: 'POST',
      })
    );
    const callArgs = spy.mock.calls[0][1];
    expect(callArgs?.headers?.['X-Staff-Id']).toBeUndefined();
    expect(result.accessCode).toBe('482019');
    expect(result.status).toBe('ACTIVE');
  });

  it('vẫn hoạt động khi không truyền staffId', async () => {
    const fakeResponse = {
      success: true,
      data: { contractId: 6, status: 'ACTIVE', checkinDate: '2026-09-25', accessCode: '123456' }
    };
    vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await checkInContract(6, { checkinDate: '2026-09-25', conditionNote: 'Tốt', customerConfirmed: true });
    expect(result.accessCode).toHaveLength(6);
  });
});
