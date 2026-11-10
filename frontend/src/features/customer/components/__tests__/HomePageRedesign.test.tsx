// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
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

vi.mock('@/api/unit', () => ({
  fetchUnitTypes: vi.fn().mockResolvedValue({ content: [] }),
}));

vi.mock('@/hooks/useActivePolicy', () => ({
  useActivePolicy: () => null,
}));

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

describe('HomePage Redesign (3D Sizing, Real Data & Section Order)', () => {
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

  it('sắp xếp đúng thứ tự: Hero -> Mạng lưới Chi nhánh (#branches) -> So sánh 2 dòng kho (#unit-types)', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const branchesSection = container.querySelector('#branches');
    const unitTypesSection = container.querySelector('#unit-types');
    expect(branchesSection).toBeInTheDocument();
    expect(unitTypesSection).toBeInTheDocument();

    if (branchesSection && unitTypesSection) {
      const relation = branchesSection.compareDocumentPosition(unitTypesSection);
      // DOCUMENT_POSITION_FOLLOWING = 4 -> unitTypesSection nằm SAU branchesSection
      expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('mô hình 3D ước lượng kích thước thật (V16) hỗ trợ nhiều cỡ thùng, nút Đặt lại làm trống kho 100% và bỏ thanh giá/CTA dưới card', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const hero = container.querySelector('section') as HTMLElement;
    expect(within(hero).queryByText(/Xe máy/i)).not.toBeInTheDocument();
    expect(within(hero).queryByRole('link', { name: /Tìm ô kho cỡ/i })).not.toBeInTheDocument();

    // Khi mới tải có bộ đồ mẫu đồng bộ với bộ đếm, bấm Đặt lại hàng hóa -> kho trống hoàn toàn (0 đồ)
    fireEvent.click(within(hero).getByRole('button', { name: /Đặt lại hàng hóa/i }));
    const emptySvg = within(hero).getByRole('img', { name: /Mô hình 3D kho cỡ M/i });
    expect(emptySvg).toHaveAttribute('data-item-count', '0');
    expect(within(hero).queryByText(/Lấp đầy ~/i)).not.toBeInTheDocument();

    // Chuyển sang XL (3.0m x 5.0m x 3.0m) -> kiểm tra nhãn SVG vẫn trống
    fireEvent.click(within(hero).getByRole('button', { name: /XL\s*15 m²/i }));
    const xlSvg = within(hero).getByRole('img', {
      name: /Mô hình 3D kho cỡ XL kích thước 5m x 3m x 3m/i,
    });
    expect(xlSvg).toHaveAttribute('data-item-count', '0');

    // Chọn 3 cỡ thùng khác nhau S/M/L -> vừa gọn cỡ XS (1 m²)
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng nhỏ (S)' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng vừa (M)' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng lớn (L)' }));
    expect(within(hero).getByRole('button', { name: /XS\s*1 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Thêm Sofa & Tủ lạnh -> tự nâng lên S rồi M khi thêm đồ lớn
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Sofa / Nệm' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Tủ lạnh / Giặt' }));
    expect(within(hero).getByRole('button', { name: /S\s*3 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Sofa / Nệm' }));
    expect(within(hero).getByRole('button', { name: /M\s*6 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(hero).getByText(/Lấp đầy ~/i)).toBeInTheDocument();
  });

  it('ô tìm kiếm chỉ giữ khu vực tìm kho nằm dưới tiêu đề Hệ thống chi nhánh (bỏ Loại kho và Kích thước dự kiến)', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const branchesSection = container.querySelector('#branches') as HTMLElement;
    const filterBar = container.querySelector('#filter-bar') as HTMLElement;
    expect(branchesSection).toBeInTheDocument();
    expect(filterBar).toBeInTheDocument();
    expect(branchesSection.contains(filterBar)).toBe(true);
    expect(within(filterBar).queryByText('Loại kho')).not.toBeInTheDocument();
    expect(within(filterBar).queryByText('Kích thước dự kiến')).not.toBeInTheDocument();

    const trigger = within(filterBar).getByRole('button', { name: /Tất cả thành phố/i });
    fireEvent.click(trigger);
    fireEvent.click(within(filterBar).getByRole('option', { name: /Hà Nội/i }));
    fireEvent.click(within(filterBar).getByRole('button', { name: 'Tìm kho trống' }));

    expect(mockNavigate).toHaveBeenCalledWith('/customer/units?facility=1');
  });

  it('mở modal chính sách từ Footer và lược bỏ các đoạn chữ/ảnh thừa theo yêu cầu', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(container.innerHTML).not.toContain('lh3.googleusercontent.com');
    expect(container.innerHTML).not.toContain('SMARTVN40');
    expect(container.innerHTML).not.toContain('1900 8899');
    expect(container.innerHTML).not.toContain('/assets/landing/unit-lanh.jpg');
    expect(container.innerHTML).not.toMatch(/xe máy/i);
    expect(container.innerHTML).not.toContain('Chọn cỡ kho hoặc thêm đồ đạc để xem sức chứa thực');
    expect(container.innerHTML).not.toContain(
      'Dữ liệu chi nhánh, giá thuê và số lượng ô trống được cập nhật trực tiếp từ hệ thống.'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Chính sách hủy & hoàn tiền cọc' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/hoàn 100% tiền thuê và 100% tiền cọc/i)).toBeInTheDocument();
  });
});
