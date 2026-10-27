// frontend/src/features/manager/utils/incidentTimeFilter.ts
import type { ManagementSupportTicket } from '../types/staffAssignment';

export type TimeFilterPreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'ALL'
  | 'CUSTOM';

export interface CustomDateRange {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface FilteredTicketsResult {
  tickets: (ManagementSupportTicket & { isBacklog?: boolean })[];
  backlogCount: number;
}

/**
 * Kiểm tra xem ticket có phải là sự cố chưa giải quyết (Chờ nhận hoặc Đang xử lý) không
 */
export function isPendingOrInProgress(status?: string): boolean {
  if (!status) return false;
  return status === 'NEW' || status === 'OPEN' || status === 'ASSIGNED' || status === 'IN_PROGRESS';
}

/**
 * Lấy mốc thời gian bắt đầu và kết thúc của một ngày (00:00:00 -> 23:59:59.999)
 */
function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Lọc danh sách sự cố theo mốc thời gian kèm cơ chế giữ lại sự cố tồn đọng
 */
export function filterTicketsByTimeRange(
  tickets: ManagementSupportTicket[],
  preset: TimeFilterPreset,
  customRange?: CustomDateRange,
  includeBacklog = true
): FilteredTicketsResult {
  const now = new Date();
  const todayBounds = getDayBounds(now);

  // Tính toán tổng số sự cố tồn đọng phát sinh trước ngày hôm nay
  const backlogTickets = tickets.filter((t) => {
    if (!t.createdAt) return false;
    const createdDate = new Date(t.createdAt);
    return createdDate < todayBounds.start && isPendingOrInProgress(t.status as string);
  });
  const backlogCount = backlogTickets.length;

  if (preset === 'ALL') {
    return {
      tickets: tickets.map((t) => ({ ...t, isBacklog: false })),
      backlogCount,
    };
  }

  let rangeStart: Date;
  let rangeEnd: Date;

  if (preset === 'TODAY') {
    rangeStart = todayBounds.start;
    rangeEnd = todayBounds.end;
  } else if (preset === 'YESTERDAY') {
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestBounds = getDayBounds(yest);
    rangeStart = yestBounds.start;
    rangeEnd = yestBounds.end;
  } else if (preset === 'LAST_7_DAYS') {
    const past7 = new Date(now);
    past7.setDate(now.getDate() - 6);
    rangeStart = getDayBounds(past7).start;
    rangeEnd = todayBounds.end;
  } else if (preset === 'LAST_30_DAYS') {
    const past30 = new Date(now);
    past30.setDate(now.getDate() - 29);
    rangeStart = getDayBounds(past30).start;
    rangeEnd = todayBounds.end;
  } else if (preset === 'CUSTOM') {
    rangeStart = customRange?.startDate ? new Date(`${customRange.startDate}T00:00:00`) : new Date(0);
    rangeEnd = customRange?.endDate ? new Date(`${customRange.endDate}T23:59:59.999`) : new Date();
  } else {
    rangeStart = todayBounds.start;
    rangeEnd = todayBounds.end;
  }

  const result: (ManagementSupportTicket & { isBacklog?: boolean })[] = [];
  const addedIds = new Set<number>();

  // 1. Nếu includeBacklog và preset là TODAY, ưu tiên gom các sự cố tồn đọng lên đầu
  if (includeBacklog && preset === 'TODAY') {
    backlogTickets.forEach((bt) => {
      result.push({ ...bt, isBacklog: true });
      addedIds.add(bt.id);
    });
  }

  // 2. Lọc các ticket rơi vào khoảng thời gian được chọn
  tickets.forEach((t) => {
    if (addedIds.has(t.id)) return;
    if (!t.createdAt) return;
    const createdDate = new Date(t.createdAt);
    if (createdDate >= rangeStart && createdDate <= rangeEnd) {
      result.push({ ...t, isBacklog: false });
      addedIds.add(t.id);
    }
  });

  return {
    tickets: result,
    backlogCount,
  };
}

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * Định dạng thời gian tương đối trực quan (vd: Vừa xong, 15 phút trước, Hôm qua lúc 14:00)
 */
export function formatRelativeTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const created = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Dưới 1 phút
    if (diffMins < 1) return 'Vừa xong';

    // Dưới 60 phút
    if (diffMins < 60) return `${diffMins} phút trước`;

    // Cùng ngày (dưới 24h và trùng ngày)
    const isSameDay =
      created.getDate() === now.getDate() &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return `${diffHours} giờ trước`;
    }

    // Hôm qua
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      created.getDate() === yesterday.getDate() &&
      created.getMonth() === yesterday.getMonth() &&
      created.getFullYear() === yesterday.getFullYear();

    const timeStr = `${pad(created.getHours())}:${pad(created.getMinutes())}`;
    if (isYesterday) {
      return `Hôm qua ${timeStr}`;
    }

    // Cũ hơn: DD/MM HH:mm
    const dateStr = `${pad(created.getDate())}/${pad(created.getMonth() + 1)}`;
    return `${dateStr} ${timeStr}`;
  } catch {
    return isoStr;
  }
}

