import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { getPendingContracts } from '../contract';

describe('getPendingContracts (real API mode)', () => {
  beforeEach(() => {
    // Tắt mock: isMockEnabled('WS2') trả về false
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('trả về mảng content khi backend trả PageResponse', async () => {
    const fakePageResponse = {
      success: true,
      data: {
        content: [
          { id: 1, code: 'CTR-001', status: 'PENDING_CHECK_IN', facilityId: 1 }
        ],
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      }
    };
    vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakePageResponse as any);

    const result = await getPendingContracts(1);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
    expect(result[0].status).toBe('PENDING_CHECK_IN');
  });

  it('không throw khi content rỗng', async () => {
    const emptyPage = {
      success: true,
      data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }
    };
    vi.spyOn(clientModule, 'apiClient').mockResolvedValue(emptyPage as any);

    const result = await getPendingContracts();
    expect(result).toEqual([]);
  });
});
