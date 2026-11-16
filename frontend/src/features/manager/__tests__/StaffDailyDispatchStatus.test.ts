// @vitest-environment jsdom
// frontend/src/features/manager/__tests__/StaffDailyDispatchStatus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as contractApi from '@/api/contract';
import * as pricingApi from '@/api/pricing';
import { apiClient } from '@/api/client';
import { getDailyDispatchTasks } from '../api/staffAssignmentApi';

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/api/contract', () => ({
  getPendingContracts: vi.fn(),
  getManagerContracts: vi.fn(),
  assignReturnStaff: vi.fn(),
  assignCheckInStaff: vi.fn(),
}));

vi.mock('@/api/pricing', () => ({
  fetchActivePolicy: vi.fn(),
}));

describe('getDailyDispatchTasks - Kiểm tra nhận diện trạng thái nhiệm vụ thực địa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(pricingApi.fetchActivePolicy).mockResolvedValue({ checkinGraceDays: 3 } as any);
    vi.mocked(apiClient).mockResolvedValue({ data: [] } as any);
    vi.mocked(contractApi.getPendingContracts).mockResolvedValue([]);
    vi.mocked(contractApi.getManagerContracts).mockResolvedValue([]);
  });

  it('RETURN task: Đánh dấu COMPLETED khi contract có cờ isInspected = true (dù status là PENDING_RETURN)', async () => {
    vi.mocked(contractApi.getManagerContracts).mockImplementation(async (filter?: any) => {
      if (filter?.status === 'PENDING_RETURN') {
        return [
          {
            id: 3171,
            code: 'CTR-20261116-3171',
            facilityId: 2,
            facilityName: 'Cơ sở Quận 7 - TP.HCM',
            storageUnitCode: 'Q7-STD-501',
            customerName: 'Lê Thanh Tùng',
            customerPhone: '0868268970',
            status: 'PENDING_RETURN',
            isInspected: true,
            assignedStaffId: 10,
            assignedStaffName: 'Trần Văn Hùng',
            createdAt: '2026-11-16T08:00:00Z',
          } as any,
        ];
      }
      return [];
    });

    const tasks = await getDailyDispatchTasks(2, '2026-11-16');
    const returnTask = tasks.find((t) => t.referenceCode === 'CTR-20261116-3171');

    expect(returnTask).toBeDefined();
    expect(returnTask?.status).toBe('COMPLETED');
    expect(returnTask?.assignedStaffName).toBe('Trần Văn Hùng');
  });

  it('RETURN task: Không bị ghi đè thành ASSIGNED khi có task override trong localStorage', async () => {
    // Giả lập Quản lý cơ sở đã phân công Trần Văn Hùng qua giao diện
    const taskId = 200000 + 3171;
    localStorage.setItem(
      'smartstorage_dispatch_task_overrides',
      JSON.stringify({
        [String(taskId)]: {
          staffId: 10,
          staffName: 'Trần Văn Hùng',
          notes: 'Ưu tiên kiểm tra trước 11h',
        },
      })
    );

    vi.mocked(contractApi.getManagerContracts).mockImplementation(async (filter?: any) => {
      if (filter?.status === 'PENDING_RETURN') {
        return [
          {
            id: 3171,
            code: 'CTR-20261116-3171',
            facilityId: 2,
            facilityName: 'Cơ sở Quận 7 - TP.HCM',
            storageUnitCode: 'Q7-STD-501',
            customerName: 'Lê Thanh Tùng',
            customerPhone: '0868268970',
            status: 'PENDING_RETURN',
            isInspected: true,
            assignedStaffId: 10,
            assignedStaffName: 'Trần Văn Hùng',
            createdAt: '2026-11-16T08:00:00Z',
          } as any,
        ];
      }
      return [];
    });

    const tasks = await getDailyDispatchTasks(2, '2026-11-16');
    const returnTask = tasks.find((t) => t.referenceCode === 'CTR-20261116-3171');

    expect(returnTask).toBeDefined();
    expect(returnTask?.status).toBe('COMPLETED');
    expect(returnTask?.notes).toBe('Ưu tiên kiểm tra trước 11h');
  });

  it('RETURN task: Đánh dấu COMPLETED khi hợp đồng đã quyết toán xong (CLOSED)', async () => {
    vi.mocked(contractApi.getManagerContracts).mockImplementation(async (filter?: any) => {
      if (filter?.status === 'CLOSED') {
        return [
          {
            id: 3171,
            code: 'CTR-20261116-3171',
            facilityId: 2,
            facilityName: 'Cơ sở Quận 7 - TP.HCM',
            storageUnitCode: 'Q7-STD-501',
            customerName: 'Lê Thanh Tùng',
            customerPhone: '0868268970',
            status: 'CLOSED',
            isInspected: true,
            assignedStaffId: 10,
            assignedStaffName: 'Trần Văn Hùng',
            createdAt: '2026-11-16T08:00:00Z',
          } as any,
        ];
      }
      return [];
    });

    const tasks = await getDailyDispatchTasks(2, '2026-11-16');
    const returnTask = tasks.find((t) => t.referenceCode === 'CTR-20261116-3171');

    expect(returnTask).toBeDefined();
    expect(returnTask?.status).toBe('COMPLETED');
  });

  it('CHECK_IN task: Đánh dấu COMPLETED khi hợp đồng đã check-in thành công (ACTIVE)', async () => {
    vi.mocked(contractApi.getPendingContracts).mockResolvedValue([
      {
        id: 101,
        code: 'CTR-20261116-1010',
        facilityId: 2,
        facilityName: 'Cơ sở Quận 7 - TP.HCM',
        storageUnitCode: 'Q7-S101',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0912345678',
        status: 'ACTIVE',
        assignedStaffId: 10,
        assignedStaffName: 'Trần Văn Hùng',
        createdAt: '2026-11-16T08:00:00Z',
      } as any,
    ]);

    const tasks = await getDailyDispatchTasks(2, '2026-11-16');
    const checkInTask = tasks.find((t) => t.referenceCode === 'CTR-20261116-1010');

    expect(checkInTask).toBeDefined();
    expect(checkInTask?.status).toBe('COMPLETED');
  });
});
