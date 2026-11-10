// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../pages/HomePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useFacilityDirectory', () => ({
  useFacilityDirectory: () => ({
    isLoading: false,
    facilities: [
      {
        id: 1,
        code: 'FAC-CG',
        name: 'Cơ sở Cầu Giấy - Hà Nội',
        address: 'Số 19 Duy Tân, Cầu Giấy, Hà Nội',
        district: 'Cầu Giấy',
        city: 'Hà Nội',
        startingPrice: 500000,
        openingHours: '06:00–22:00',
        image: '/assets/landing/hero-green.jpg',
        phone: '024-3795-8888',
        activeUnitTypeCount: 10,
      },
      {
        id: 5,
        code: 'FAC-Q1',
        name: 'Cơ sở Quận 1 - TP.HCM',
        address: 'Số 12 Nguyễn Huệ, Quận 1, TP.HCM',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        startingPrice: 650000,
        openingHours: '24/7',
        image: '/assets/landing/facility.jpg',
        phone: '028-3822-9999',
        activeUnitTypeCount: 10,
      },
    ],
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomePage Redesign (Customer UX & Real Flow Verification)', () => {
  it('mọi nút CTA đặt kho đều gắn kèm ?facility= hợp lệ, không bị đá ngược về trang chủ', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    const unitLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/customer/units'));
    expect(unitLinks.length).toBeGreaterThan(0);

    for (const link of unitLinks) {
      expect(link.getAttribute('href')).toMatch(/\/customer\/units\?facility=\d+/);
    }
  });

  it('thẻ Ước lượng nhanh chuyển đổi kích thước XS..XL và cập nhật link đặt kho', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /L\s*10 m²/i }));
    const link = screen.getByRole('link', { name: /Tìm ô kho cỡ L \(10 m²\)/i });
    expect(link).toHaveAttribute('href', '/customer/units?facility=1&size=L');
  });

  it('bộ lọc Hero kết nối thật: chọn Hà Nội + Máy lạnh + Vừa (6m²) điều hướng thẳng tới UnitPickerPage', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Mở custom dropdown chọn Hà Nội
    const trigger = container.querySelector('#city-dropdown-trigger');
    expect(trigger).toBeInTheDocument();
    if (trigger) fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: /Hà Nội/i }));

    // Chọn Máy lạnh & Vừa (6m²)
    fireEvent.click(screen.getByRole('button', { name: 'Máy lạnh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vừa (6m²)' }));

    // Bấm tìm kho trống
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kho trống' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/customer/units?facility=1&storageType=climate&size=M'
    );
  });

  it('mở modal chính sách từ Footer và không chứa thông tin ảo cũ', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(container.innerHTML).not.toContain('lh3.googleusercontent.com');
    expect(container.innerHTML).not.toContain('SMARTVN40');
    expect(container.innerHTML).not.toContain('1900 8899');

    fireEvent.click(screen.getByRole('button', { name: 'Chính sách hủy & hoàn tiền cọc' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/hoàn 100% tiền thuê và 100% tiền cọc/i)).toBeInTheDocument();
  });
});
