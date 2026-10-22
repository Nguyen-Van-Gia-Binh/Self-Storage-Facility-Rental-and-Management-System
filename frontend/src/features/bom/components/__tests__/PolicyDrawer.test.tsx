// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PolicyDrawer } from '../PolicyDrawer';

const mockActivePolicy: any = {
  version: '1',
  effectiveDate: '2026-01-01',
  depositMultiplier: 1,
  reservationHoldHours: 48,
  rentalBufferDays: 15,
  rentalDailyDivisor: 30,
  checkinGraceDays: 10,
  cancelFullRefundHours: 48,
  cancelLateRefundRate: 0.5,
  cancelNoShowRefundRate: 0,
  renewalReminderDays: '60,7,3,1',
  renewalMinMonths: 1,
  renewalMaxMonths: 12,
  overdueGraceDays: 3,
  overdueDailyRate: 0.1,
  overdueCapRate: 0.7,
  overdueLockAccessDays: 7,
  overdueTerminationDays: 10,
  returnNoticeDays: 30,
  returnRefundWorkingDays: 7,
  returnEarlyRefundRate: 0,
  accessPinLength: 6,
  supportUrgentSlaHours: 2,
  supportAutoCloseWorkingDays: 7,
};

describe('PolicyDrawer', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders correctly in view mode with read-only fields and version badge', () => {
    const mockVersion: any = {
      id: 1,
      versionNo: 1,
      effectiveDate: '01/01/2026',
      status: 'Đang hiệu lực',
      publishedBy: 4,
      rawPolicy: mockActivePolicy,
    };

    render(
      <PolicyDrawer
        isOpen={true}
        onClose={vi.fn()}
        mode="view"
        activePolicy={mockActivePolicy}
        viewingVersion={mockVersion}
        onPublishSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Chi tiết phiên bản v1/i)).toBeInTheDocument();
    expect(screen.getByText('Đang hiệu lực')).toBeInTheDocument();
    // In view mode, publish button should NOT exist
    expect(screen.queryByRole('button', { name: /Ban hành chính sách/i })).not.toBeInTheDocument();
  });

  it('renders correctly in publish mode and displays diff preview when a field changes', async () => {
    render(
      <PolicyDrawer
        isOpen={true}
        onClose={vi.fn()}
        mode="publish"
        activePolicy={mockActivePolicy}
        viewingVersion={null}
        onPublishSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Tạo phiên bản chính sách mới/i)).toBeInTheDocument();
    const depositInput = screen.getByLabelText(/Hệ số tiền cọc/i) as HTMLInputElement;
    expect(depositInput.value).toBe('1');

    await act(async () => {
      fireEvent.change(depositInput, { target: { value: '2' } });
    });
    expect(depositInput.value).toBe('2');

    // Diff preview box should show the change
    expect(screen.getByText(/Xem trước thay đổi/i)).toBeInTheDocument();
    expect(screen.getByText(/Hệ số cọc:/i)).toBeInTheDocument();
  });

  it('validates confirmation checkbox before submitting', async () => {
    const onPublishSuccess = vi.fn();
    render(
      <PolicyDrawer
        isOpen={true}
        onClose={vi.fn()}
        mode="publish"
        activePolicy={mockActivePolicy}
        viewingVersion={null}
        onPublishSuccess={onPublishSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Ban hành chính sách/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(
      screen.getByText(/Cần đánh dấu xác nhận ban hành trước khi lưu phiên bản mới/i)
    ).toBeInTheDocument();
    expect(onPublishSuccess).not.toHaveBeenCalled();
  });
});
