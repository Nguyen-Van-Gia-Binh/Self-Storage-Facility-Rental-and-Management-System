import { describe, it, expect } from 'vitest';
import {
  filterTicketsByTimeRange,
  formatRelativeTime,
  type TimeFilterPreset,
} from '../utils/incidentTimeFilter';
import type { ManagementSupportTicket } from '../types/staffAssignment';

describe('incidentTimeFilter — Bộ lọc thời gian và cơ chế gom sự cố tồn đọng', () => {
  const now = new Date();
  const todayIso = now.toISOString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayIso = yesterday.toISOString();

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  const threeDaysAgoIso = threeDaysAgo.toISOString();

  const mockTickets: ManagementSupportTicket[] = [
    {
      id: 1,
      code: 'SC-001',
      customerId: 1,
      customerName: 'Khách Hôm Nay 1',
      contractId: 1,
      storageUnitId: 1,
      storageUnitCode: 'S-101',
      facilityId: 1,
      facilityName: 'Cầu Giấy',
      category: 'ACCESS_ISSUE',
      categoryDisplayName: 'Khóa cửa',
      description: 'Kẹt khóa hôm nay',
      status: 'NEW',
      statusDisplayName: 'Chờ nhận',
      createdAt: todayIso,
    },
    {
      id: 2,
      code: 'SC-002',
      customerId: 2,
      customerName: 'Khách Hôm Nay Đã Xong',
      contractId: 2,
      storageUnitId: 2,
      storageUnitCode: 'S-102',
      facilityId: 1,
      facilityName: 'Cầu Giấy',
      category: 'CLEANLINESS',
      categoryDisplayName: 'Vệ sinh',
      description: 'Vệ sinh hành lang hôm nay',
      status: 'RESOLVED',
      statusDisplayName: 'Đã giải quyết',
      createdAt: todayIso,
    },
    {
      id: 3,
      code: 'SC-003',
      customerId: 3,
      customerName: 'Khách Hôm Qua Tồn Đọng',
      contractId: 3,
      storageUnitId: 3,
      storageUnitCode: 'S-103',
      facilityId: 1,
      facilityName: 'Cầu Giấy',
      category: 'POWER_ISSUE',
      categoryDisplayName: 'Điện chiếu sáng',
      description: 'Mất điện từ hôm qua chưa sửa',
      status: 'IN_PROGRESS',
      statusDisplayName: 'Đang xử lý',
      createdAt: yesterdayIso,
    },
    {
      id: 4,
      code: 'SC-004',
      customerId: 4,
      customerName: 'Khách Hôm Qua Đã Đóng',
      contractId: 4,
      storageUnitId: 4,
      storageUnitCode: 'S-104',
      facilityId: 1,
      facilityName: 'Cầu Giấy',
      category: 'LOST_KEY',
      categoryDisplayName: 'Mất chìa',
      description: 'Đã cấp chìa hôm qua',
      status: 'CLOSED',
      statusDisplayName: 'Đã đóng',
      createdAt: yesterdayIso,
    },
    {
      id: 5,
      code: 'SC-005',
      customerId: 5,
      customerName: 'Khách 3 Ngày Trước Tồn Đọng',
      contractId: 5,
      storageUnitId: 5,
      storageUnitCode: 'S-105',
      facilityId: 1,
      facilityName: 'Cầu Giấy',
      category: 'FACILITY_LEAK',
      categoryDisplayName: 'Thấm dột',
      description: 'Dột nước 3 ngày trước chưa ai tiếp nhận',
      status: 'NEW',
      statusDisplayName: 'Chờ nhận',
      createdAt: threeDaysAgoIso,
    },
  ];

  it('1. Lọc theo TODAY không bao gồm backlog: Chỉ trả về ticket phát sinh hôm nay', () => {
    const res = filterTicketsByTimeRange(mockTickets, 'TODAY', undefined, false);
    expect(res.tickets.map((t) => t.id)).toEqual([1, 2]);
    expect(res.backlogCount).toBe(2); // Có 2 ticket tồn đọng (SC-003 và SC-005)
  });

  it('2. Lọc theo TODAY kèm includeBacklog: Giữ lại ticket hôm nay và cả ticket chưa xử lý từ trước', () => {
    const res = filterTicketsByTimeRange(mockTickets, 'TODAY', undefined, true);
    // Ticket hôm qua đã CLOSED (SC-004) không được bao gồm, nhưng SC-003 (IN_PROGRESS) và SC-005 (NEW) được giữ lại
    const ids = res.tickets.map((t) => t.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).toContain(3);
    expect(ids).toContain(5);
    expect(ids).not.toContain(4);
  });

  it('3. Lọc theo YESTERDAY: Chỉ trả về các ticket tạo ngày hôm qua', () => {
    const res = filterTicketsByTimeRange(mockTickets, 'YESTERDAY', undefined, false);
    expect(res.tickets.map((t) => t.id)).toEqual([3, 4]);
  });

  it('4. Lọc theo ALL: Trả về tất cả 5 ticket', () => {
    const res = filterTicketsByTimeRange(mockTickets, 'ALL', undefined, false);
    expect(res.tickets.length).toBe(5);
  });

  it('5. formatRelativeTime: Hiển thị thời gian tương đối dễ hiểu', () => {
    expect(formatRelativeTime(todayIso)).toMatch(/phút trước|Vừa xong|giờ trước/);
    expect(formatRelativeTime(yesterdayIso)).toContain('Hôm qua');
    expect(formatRelativeTime(threeDaysAgoIso)).toMatch(/\d{2}\/\d{2}/);
  });
});

