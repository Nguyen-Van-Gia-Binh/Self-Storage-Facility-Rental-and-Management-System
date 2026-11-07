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

describe('DigitalMoveInPassModal — Tách biệt Vé nhận kho và Check-in online', () => {
  afterEach(() => {
    cleanup();
  });

  const mockAssignedPassData: MoveInPassData = {
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

  const mockUnassignedPassData: MoveInPassData = {
    passCode: 'PASS-99999',
    reservationId: 102,
    unitNumber: 'Chưa gán ô',
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
    totalPaid: 1500000,
  };

  it('ở chế độ pass: hiển thị vé nhận kho QR cổng và nút chuyển sang Check-in online khi ô đã gán', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockAssignedPassData}
        initialMode="pass"
      />
    );

    // Hiển thị thông tin vé nhận kho
    expect(screen.getByText(/Thẻ Nhận Kho Điện Tử/i)).toBeInTheDocument();
    expect(screen.getByText(/Mã quét tại cổng/i)).toBeInTheDocument();
    expect(screen.getByText(/Ô Q7-C102/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã giữ chỗ/i)).toBeInTheDocument();
    expect(screen.getByText(/Cơ sở Quận 7/i)).toBeInTheDocument();

    // Có nút gợi ý check-in online
    expect(screen.getByRole('button', { name: /Check-in online ngay/i })).toBeInTheDocument();

    // Không nhồi nhét form ký số trong màn hình pass
    expect(screen.queryByPlaceholderText(/Ví dụ: Nguyễn Phạm Xuân Nhi/i)).not.toBeInTheDocument();
  });

  it('cho phép bấm chuyển từ màn hình Vé nhận kho sang Check-in online và hiển thị IoT telemetry', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockAssignedPassData}
        initialMode="pass"
      />
    );

    // Nhấn chuyển sang Check-in online ngay
    const checkInBtn = screen.getByRole('button', { name: /Check-in online ngay/i });
    fireEvent.click(checkInBtn);

    // Xác nhận đã sang màn hình Check-in Online & Telemetry
    expect(screen.getByText(/Check-in Online & Bàn Giao 24\/7/i)).toBeInTheDocument();
    expect(screen.getByText(/24.5°C/)).toBeInTheDocument();
    expect(screen.getByText(/52% RH/)).toBeInTheDocument();
    expect(screen.getByText(/98% Pin/)).toBeInTheDocument();
    expect(screen.getByText(/Dữ liệu Cảm biến IoT/)).toBeInTheDocument();
  });

  it('ở chế độ checkin trực tiếp: kiểm tra form Ký số điện tử và không cho kích hoạt nếu thiếu họ tên', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockAssignedPassData}
        initialMode="checkin"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Ký số & Kích hoạt mã PIN/i });
    fireEvent.click(submitBtn);

    // Báo lỗi do chưa nhập họ tên
    expect(screen.getByText(/Vui lòng nhập họ và tên/)).toBeInTheDocument();
  });

  it('hoàn thành ký số nhận bàn giao điện tử và hiển thị mã PIN Smart Lock', () => {
    const onConfirmSignature = vi.fn();
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockAssignedPassData}
        initialMode="checkin"
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

  it('khi ô kho CHƯA ĐƯỢC GÁN: không hiển thị tab hay nút Check-in online, chỉ hiển thị vé QR và hướng dẫn quầy', () => {
    render(
      <DigitalMoveInPassModal
        isOpen={true}
        onClose={vi.fn()}
        passData={mockUnassignedPassData}
        initialMode="pass"
      />
    );

    // Hiển thị trạng thái Chưa gán số ô
    expect(screen.getByText(/Chưa gán số ô/i)).toBeInTheDocument();
    expect(screen.getByText(/Chờ quầy phân bổ/i)).toBeInTheDocument();
    expect(screen.getByText(/Ô kho đang được nhân viên cơ sở điều phối/i)).toBeInTheDocument();

    // Tuyệt đối KHÔNG hiển thị nút hay tab Check-in online
    expect(screen.queryByRole('button', { name: /Check-in online/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Check-in online ngay/i)).not.toBeInTheDocument();
  });
});
