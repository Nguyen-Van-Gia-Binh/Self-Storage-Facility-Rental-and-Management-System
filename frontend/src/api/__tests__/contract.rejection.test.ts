import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientModule from '../client';
import { rejectHandoverContract } from '../contract';

describe('rejectHandoverContract (real API mode)', () => {
  beforeEach(() => {
    vi.spyOn(clientModule, 'isMockEnabled').mockReturnValue(false);
  });

  it('gọi đúng endpoint với POST body và X-Staff-Id header', async () => {
    const fakeResponse = {
      success: true,
      data: {
        contractId: 3,
        status: 'TERMINATED',
        storageUnitStatus: 'MAINTENANCE',
        message: 'Đã ghi nhận từ chối',
      }
    };
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(fakeResponse as any);

    const result = await rejectHandoverContract(
      3,
      { rejectionReason: 'Kho bị ẩm', reportedDefects: 'Tường ẩm mốc' },
      12
    );

    expect(spy).toHaveBeenCalledWith(
      '/contracts/3/handover-rejection',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Staff-Id': '12' }),
        body: expect.stringContaining('Kho bị ẩm'),
      })
    );
    expect(result.status).toBe('TERMINATED');
    expect(result.storageUnitStatus).toBe('MAINTENANCE');
  });

  it('throw lỗi nếu backend trả lỗi (không có silent fallback)', async () => {
    vi.spyOn(clientModule, 'apiClient').mockRejectedValue({ status: 400, message: 'Contract not found' });

    await expect(
      rejectHandoverContract(999, { rejectionReason: 'test', reportedDefects: '' }, 12)
    ).rejects.toMatchObject({ status: 400 });
  });
});
