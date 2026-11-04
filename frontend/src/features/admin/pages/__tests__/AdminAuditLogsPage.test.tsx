// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AdminAuditLogsPage } from '../AdminAuditLogsPage';
import * as auditApi from '../../api/auditApi';

vi.mock('../../api/auditApi', () => ({
  getAuditStats: vi.fn(),
  getAuditActivities: vi.fn(),
  getLoginHistories: vi.fn(),
  exportAuditLogsCsv: vi.fn(),
}));

describe('AdminAuditLogsPage Component', () => {
  beforeEach(() => {
    vi.mocked(auditApi.getAuditStats).mockResolvedValue({
      totalActivities: 120,
      roleOrStatusChanges: 15,
      failedLoginsToday: 2,
      totalLoginsToday: 48,
    });

    vi.mocked(auditApi.getAuditActivities).mockResolvedValue({
      content: [
        {
          id: 1,
          action: 'UPDATE_ROLE',
          entityType: 'USER',
          entityId: '10',
          userId: 1,
          userEmail: 'admin@smartstorage.vn',
          userFullName: 'Lê Thanh Tùng',
          createdAt: '2026-10-30T10:00:00Z',
          ipAddress: '127.0.0.1',
          afterValue: '{"role": "STAFF"}',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });

    vi.mocked(auditApi.getLoginHistories).mockResolvedValue({
      content: [
        {
          id: 1,
          userId: 1,
          email: 'admin@smartstorage.vn',
          userFullName: 'Lê Thanh Tùng',
          loginTime: '2026-10-30T09:00:00Z',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome 120',
          isSuccess: true,
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
      last: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders page header, security stats cards and activities tab by default', async () => {
    render(<AdminAuditLogsPage />);

    // Header
    expect(screen.getByText('Nhật ký kiểm toán & Lịch sử đăng nhập')).toBeInTheDocument();

    // Stats cards
    await waitFor(() => {
      expect(screen.getByText('Tổng thao tác ghi nhận')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('Đăng nhập thất bại')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Content in activity table
    await waitFor(() => {
      expect(screen.getByText('admin@smartstorage.vn')).toBeInTheDocument();
      expect(screen.getByText('Vai trò mới: STAFF')).toBeInTheDocument();
    });
  });

  it('switches to Login History tab and displays login records', async () => {
    render(<AdminAuditLogsPage />);

    // Click tab Lịch sử đăng nhập hệ thống
    const loginTab = screen.getByText('Lịch sử đăng nhập hệ thống');
    fireEvent.click(loginTab);

    // Should fetch and display login record
    await waitFor(() => {
      expect(auditApi.getLoginHistories).toHaveBeenCalled();
      expect(screen.getByText('Chrome 120')).toBeInTheDocument();
    });
  });
});
