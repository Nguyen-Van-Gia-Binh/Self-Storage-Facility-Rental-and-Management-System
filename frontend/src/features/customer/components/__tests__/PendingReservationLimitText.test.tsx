// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { UnitPickerModals } from '../UnitPickerModals';

describe('UnitPickerModals — Hiển thị tên loại kho khi chưa chọn số ô', () => {
  afterEach(() => {
    cleanup();
  });

  it('khi storageUnitCode là "Chua chon o", hiển thị tên loại kho thay thế', () => {
    render(
      <UnitPickerModals
        facilityInactiveModalOpen={false}
        onCloseFacilityInactive={vi.fn()}
        unitUnavailableModal={{ isOpen: false, title: '', message: '' }}
        onCloseUnitUnavailable={vi.fn()}
        pendingLimitModal={{
          isOpen: true,
          pendingReservation: {
            id: 101,
            code: 'RSV-2026-101',
            storageUnitCode: 'Chua chon o',
            unitTypeName: 'Kho Tiêu Chuẩn S',
            facilityName: 'Cơ sở Hai Bà Trưng - Hà Nội',
          },
        }}
        onClosePendingLimit={vi.fn()}
        onPayPendingReservation={vi.fn()}
      />
    );

    // Xác nhận KHÔNG hiển thị chuỗi thô 'Chua chon o'
    expect(screen.queryByText(/Chua chon o/i)).not.toBeInTheDocument();

    // Xác nhận hiển thị tên loại kho 'Kho Tiêu Chuẩn S'
    expect(screen.getByText(/Kho Tiêu Chuẩn S/i)).toBeInTheDocument();
    expect(screen.getByText(/Cơ sở Hai Bà Trưng - Hà Nội/i)).toBeInTheDocument();
  });

  it('khi storageUnitCode là mã ô cụ thể (Q7-S101), hiển thị đúng mã ô', () => {
    render(
      <UnitPickerModals
        facilityInactiveModalOpen={false}
        onCloseFacilityInactive={vi.fn()}
        unitUnavailableModal={{ isOpen: false, title: '', message: '' }}
        onCloseUnitUnavailable={vi.fn()}
        pendingLimitModal={{
          isOpen: true,
          pendingReservation: {
            id: 102,
            code: 'RSV-2026-102',
            storageUnitCode: 'Q7-S101',
            unitTypeName: 'Kho Tiêu Chuẩn S',
            facilityName: 'Cơ sở Quận 7 - TP.HCM',
          },
        }}
        onClosePendingLimit={vi.fn()}
        onPayPendingReservation={vi.fn()}
      />
    );

    expect(screen.getByText(/Q7-S101/i)).toBeInTheDocument();
    expect(screen.getByText(/Cơ sở Quận 7 - TP.HCM/i)).toBeInTheDocument();
  });
});

