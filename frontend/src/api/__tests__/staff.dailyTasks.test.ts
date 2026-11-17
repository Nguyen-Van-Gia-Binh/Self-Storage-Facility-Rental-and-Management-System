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

  it('giữ AUTO_CLOSED là đã xong, không đổi thành PENDING', async () => {
    vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
      success: true,
      data: {
        staffId: 77,
        date: '2026-09-26',
        supportTasks: [{
          supportRequestId: 42,
          description: 'cứu cứu cứu',
          status: 'AUTO_CLOSED',
          completed: true,
          storageUnitCode: 'Q1-DRY-103',
        }],
        checkInTasks: [],
        returnTasks: [],
      },
    } as any);

    const result = await getStaffDailyTasks(77, '2026-09-26');

    expect(result.openSupportRequests[0].status).toBe('AUTO_CLOSED');
    expect(result.openSupportRequests[0].completed).toBe(true);
  });

  it('throw lỗi khi backend trả 404 (không silent fallback)', async () => {
    vi.spyOn(clientModule, 'apiClient').mockRejectedValue({ status: 404, message: 'Staff not found' });

    await expect(getStaffDailyTasks(9999, '2026-09-25')).rejects.toMatchObject({ status: 404 });
  });

  it('khi xem ngày tương lai chỉ gọi đúng 1 API cho ngày đó, không tự nhân bản việc tồn đọng của hôm nay sang tương lai', async () => {
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
      success: true,
      data: {
        staffId: 88,
        date: '2099-12-31',
        checkInTasks: [],
        returnTasks: [],
        supportTasks: [],
      },
    } as any);

    const result = await getStaffDailyTasks(88, '2099-12-31');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('/reports/staff/88/daily-tasks?date=2099-12-31');
    expect(result.pendingCheckIns).toEqual([]);
    expect(result.pendingReturns).toEqual([]);
    expect(result.openSupportRequests).toEqual([]);
  });
});
