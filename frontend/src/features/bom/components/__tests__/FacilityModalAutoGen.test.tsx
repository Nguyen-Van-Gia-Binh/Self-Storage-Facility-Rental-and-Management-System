// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FacilityModal } from '../FacilityModal';

describe('FacilityModal: Auto-generate Facility Code', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnClose = vi.fn();

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('tự động sinh mã FAC-Q1 khi người dùng nhập địa chỉ Quận 1', async () => {
    render(
      <FacilityModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCodes={['FAC-CG', 'FAC-Q7']}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Kho Quận 1 — 123 Lê Lợi/i);
    const addressInput = screen.getByPlaceholderText(/123 Lê Lợi, Phường Bến Nghé/i);
    const codeInput = screen.getByPlaceholderText(/VD: FAC-Q7, FAC-CG/i) as HTMLInputElement;

    // Nhập Tên cơ sở và Địa chỉ
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Kho Quận 1' } });
      fireEvent.change(addressInput, { target: { value: '123 Lê Lợi, Quận 1, TP.HCM' } });
    });

    // Mã cơ sở phải được tự động điền FAC-Q1
    expect(codeInput.value).toBe('FAC-Q1');
    expect(screen.getByText(/Tự động nhận diện từ Quận 1/i)).toBeInTheDocument();
  });

  it('tự động sinh mã FAC-CG2 khi mã FAC-CG đã có trong existingCodes', async () => {
    render(
      <FacilityModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCodes={['FAC-CG', 'FAC-Q7']}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Kho Quận 1 — 123 Lê Lợi/i);
    const addressInput = screen.getByPlaceholderText(/123 Lê Lợi, Phường Bến Nghé/i);
    const codeInput = screen.getByPlaceholderText(/VD: FAC-Q7, FAC-CG/i) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Cơ sở Cầu Giấy Mới' } });
      fireEvent.change(addressInput, { target: { value: '19 Duy Tân, Cầu Giấy, Hà Nội' } });
    });

    expect(codeInput.value).toBe('FAC-CG2');
    expect(screen.getByText(/Nhận diện từ Cầu Giấy \(trùng mã gốc, tự tăng số 2\)/i)).toBeInTheDocument();
  });

  it('cho phép người dùng tự sửa tay mã cơ sở và không bị ghi đè lại', async () => {
    render(
      <FacilityModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingCodes={[]}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Kho Quận 1 — 123 Lê Lợi/i);
    const addressInput = screen.getByPlaceholderText(/123 Lê Lợi, Phường Bến Nghé/i);
    const codeInput = screen.getByPlaceholderText(/VD: FAC-Q7, FAC-CG/i) as HTMLInputElement;

    // Tự sinh FAC-Q1
    await act(async () => {
      fireEvent.change(addressInput, { target: { value: 'Quận 1, TP.HCM' } });
    });
    expect(codeInput.value).toBe('FAC-Q1');

    // Người dùng tự sửa tay thành FAC-VIP
    await act(async () => {
      fireEvent.change(codeInput, { target: { value: 'FAC-VIP' } });
    });
    expect(codeInput.value).toBe('FAC-VIP');

    // Thay đổi tiếp tên cơ sở -> mã không bị tự đè lại vì đã tự sửa tay
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Cơ sở Quận 7' } });
    });
    expect(codeInput.value).toBe('FAC-VIP');

    // Bấm nút "Tự tạo" -> tính lại mã theo tên & địa chỉ
    const regenBtn = screen.getByRole('button', { name: /Tự tạo/i });
    await act(async () => {
      fireEvent.click(regenBtn);
    });
    expect(codeInput.value).toBe('FAC-Q1');
  });

  it('ở chế độ chỉnh sửa (isEdit) mã cơ sở là cố định và không hiển thị ô tự tạo', () => {
    const existingFacility = {
      id: 1,
      code: 'FAC-CG',
      name: 'Cơ sở Cầu Giấy',
      address: '19 Duy Tân, Cầu Giấy',
      status: 'ACTIVE' as const,
      storageUnitCount: 16,
      phone: '0901234567',
      openingHours: '06:00–22:00',
    };

    render(
      <FacilityModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        initialData={existingFacility}
      />
    );

    expect(screen.getByText('FAC-CG')).toBeInTheDocument();
    expect(screen.getByText('(Mã cố định không thể sửa)')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/VD: FAC-Q7, FAC-CG/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tự tạo/i })).not.toBeInTheDocument();
  });
});
