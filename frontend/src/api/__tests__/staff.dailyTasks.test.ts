import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { getStaffDailyTasks } from '../staff';

describe('getStaffDailyTasks (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('gọi API với staffId được truyền vào (không phải 8)', async () => {
    const fakeResponse = {
      success: true,
      data: {
        staffId: 42,
        facilityName: 'District 7',
        date: '2026-09-25',
        pendingCheckIns: [],
        pendingReturns: [],
        openSupportRequests: [],
      },
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    await getStaffDailyTasks(42, '2026-09-25');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/42/')
    );
  });

  it('throw lỗi khi backend trả 404 (không silent fallback)', async () => {
    vi.spyOn(clientModule, 'apiClient').mockRejectedValue({ status: 404, message: 'Staff not found' });

    await expect(getStaffDailyTasks(9999, '2026-09-25')).rejects.toMatchObject({ status: 404 });
  });
});
