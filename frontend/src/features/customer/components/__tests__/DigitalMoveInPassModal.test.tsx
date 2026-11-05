// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DigitalMoveInPassModal } from '../DigitalMoveInPassModal';
import type { MoveInPassData } from '@/types';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('DigitalMoveInPassModal — IoT Telemetry & E-Handover Ký số', () => {
  afterEach(() => {
    cleanup();
  });
  const mockPassData: MoveInPassData = {
    passCode: 'PASS-12345',
    reservationId: 101,
    unitNumber: 'Q7-C102',
    facilityId: 1,
    facilityName: 'Cơ sở Quận 7',
    facilityAddress: '123 Đường Nguyễn Hữu Thọ, Q.7, TP.HCM',
    facilityPhone: '0901234567',
    customerName: 'Nguyễn Phạm Xuân Nhi',
    customerPhone: '0987654321',
    customerIdentity: '079199001234',
    startDate: '2026-11-15',
    checkInWindow: '10 ngày',
    status: 'PENDING_CHECKIN',
    totalPaid: 3200000,
  };

  it('hiển thị đầy đủ 3 thẻ thông số cảm biến IoT thời gian thực (Nhiệt độ, Độ ẩm, Pin khóa)', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockPassData}
      />
    );

    // Kiểm tra hiển thị IoT telemetry
    expect(screen.getByText(/24.5°C/)).toBeInTheDocument();
    expect(screen.getByText(/52% RH/)).toBeInTheDocument();
    expect(screen.getByText(/98% Pin/)).toBeInTheDocument();
    expect(screen.getByText(/Dữ liệu Cảm biến IoT/)).toBeInTheDocument();
  });

  it('hiển thị form Ký số điện tử và không cho kích hoạt nếu chưa nhập tên hoặc chưa đồng ý nội quy', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockPassData}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Ký số & Kích hoạt mã PIN/i });
    fireEvent.click(submitBtn);

    // Báo lỗi do chưa nhập họ tên
    expect(screen.getByText(/Vui lòng nhập họ và tên/)).toBeInTheDocument();
  });

  it('cho phép nhập họ tên ký số, đồng ý nội quy và kích hoạt thành công mã PIN Smart Lock', () => {
    const onConfirmSignature = vi.fn();
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockPassData}
        onConfirmSignature={onConfirmSignature}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Ví dụ: Nguyễn Phạm Xuân Nhi/i);
    fireEvent.change(nameInput, { target: { value: 'Nguyễn Phạm Xuân Nhi' } });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Ký số & Kích hoạt mã PIN/i });
    fireEvent.click(submitBtn);

    // Ký số thành công
    expect(onConfirmSignature).toHaveBeenCalledWith('Nguyễn Phạm Xuân Nhi');
    expect(screen.getByText(/Đã Ký Số Thành Công/)).toBeInTheDocument();
    expect(screen.getByText(/Người ký: Nguyễn Phạm Xuân Nhi/)).toBeInTheDocument();
    expect(screen.getByText(/Mã PIN Smart Lock ô kho của bạn:/)).toBeInTheDocument();
  });
});
