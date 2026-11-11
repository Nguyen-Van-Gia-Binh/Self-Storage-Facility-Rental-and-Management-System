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
        name: 'Cơ sở Cầu Giấy - Hà Nội',
        address: 'Số 19 Duy Tân, Cầu Giấy, Hà Nội',
        city: 'Hà Nội',
        startingPrice: 500000,
        openingHours: '06:00–22:00',
        image: '/assets/landing/hero-green.jpg',
      },
      {
        id: 5,
        name: 'Cơ sở Quận 1 - TP.HCM',
        address: 'Số 12 Nguyễn Huệ, Quận 1, TP.HCM',
        city: 'TP. Hồ Chí Minh',
        startingPrice: 650000,
        openingHours: '24/7',
        image: '/assets/landing/facility.jpg',
      },
    ],
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomePage Redesign (3D Sizing, Real Data & Section Order)', () => {
  it('nút Đặt kho ngay trên Hero cuộn tới chọn chi nhánh (không nhảy thẳng vào facility mặc định), các thẻ cơ sở gắn ?facility= hợp lệ', () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const hero = container.querySelector('section') as HTMLElement;
    const bookNowBtn = within(hero).getByRole('button', { name: /Đặt kho ngay/i });
    expect(bookNowBtn).toBeInTheDocument();
    expect(bookNowBtn).toHaveClass('btn-tactile');
    expect(within(hero).queryByRole('link', { name: /Đặt kho ngay/i })).not.toBeInTheDocument();

    fireEvent.click(bookNowBtn);
    expect(scrollSpy).toHaveBeenCalled();

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

  it('mô hình 3D ước lượng kích thước thật (V16) giữ nguyên size người dùng chọn khi thêm/giảm đồ, nút Đặt lại làm trống kho 100%', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const hero = container.querySelector('section') as HTMLElement;
    expect(within(hero).queryByText(/Xe máy/i)).not.toBeInTheDocument();
    expect(within(hero).queryByRole('link', { name: /Tìm ô kho cỡ/i })).not.toBeInTheDocument();
    expect(hero.querySelector('[data-testid="hero-text-scrim"]')).toBeInTheDocument();
    expect(hero.querySelector('[data-testid="hero-ambient-motion"]')).toBeInTheDocument();

    // Mặc định đang ở cỡ M (6 m²); giảm đồ đạc không được tự thu nhỏ sang S hoặc XS
    fireEvent.click(within(hero).getByRole('button', { name: 'Giảm Sofa / Nệm' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Giảm Tủ lạnh / Giặt' }));
    expect(within(hero).getByRole('button', { name: /M\s*6 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Khi mới tải có bộ đồ mẫu đồng bộ với bộ đếm, bấm Đặt lại hàng hóa -> kho trống hoàn toàn (0 đồ), vẫn giữ cỡ M
    fireEvent.click(within(hero).getByRole('button', { name: /Đặt lại hàng hóa/i }));
    const emptySvg = within(hero).getByRole('img', { name: /Mô hình 3D kho cỡ M/i });
    expect(emptySvg).toHaveAttribute('data-item-count', '0');
    expect(within(hero).queryByText(/Lấp đầy ~/i)).not.toBeInTheDocument();

    // Chuyển sang XL (3.0m x 5.0m x 3.0m) và thêm 3 cỡ thùng S/M/L -> vẫn giữ nguyên XL (không tự thu nhỏ về XS)
    fireEvent.click(within(hero).getByRole('button', { name: /XL\s*15 m²/i }));
    const xlSvg = within(hero).getByRole('img', {
      name: /Mô hình 3D kho cỡ XL kích thước 5m x 3m x 3m/i,
    });
    expect(xlSvg).toHaveAttribute('data-item-count', '0');

    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng nhỏ (S)' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng vừa (M)' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Thùng lớn (L)' }));
    expect(within(hero).getByRole('button', { name: /XL\s*15 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(hero).getByTestId('xp-capacity-bar')).toBeInTheDocument();
    expect(within(hero).getByText(/Lấp đầy/i)).toBeInTheDocument();

    // Chọn XS rồi thêm Sofa & Tủ lạnh -> vẫn giữ nguyên XS và báo Chưa vừa hết + nút gợi ý thủ công
    fireEvent.click(within(hero).getByRole('button', { name: /XS\s*1 m²/i }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Sofa / Nệm' }));
    fireEvent.click(within(hero).getByRole('button', { name: 'Tăng Tủ lạnh / Giặt' }));
    expect(within(hero).getByRole('button', { name: /XS\s*1 m²/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(hero).getByText(/Chưa vừa hết/i)).toBeInTheDocument();
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

  it('thẻ chi nhánh hiển thị gọn thông tin, link bản đồ, bỏ nút Gọi và bỏ số lượng ô trống lặp', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const branches = container.querySelector('#branches') as HTMLElement;
    expect(branches.innerHTML).not.toContain('Tình trạng ô kho hiện tại');
    expect(branches.innerHTML).not.toContain('hạng kho đang mở');
    expect(branches.innerHTML).not.toMatch(/\b(XS|S|M|L|XL):\s*\d+\s*trống/i);
    expect(within(branches).queryByRole('link', { name: /Gọi/i })).not.toBeInTheDocument();
    expect(branches.innerHTML).not.toContain('tel:');
    const mapLinks = within(branches)
      .getAllByRole('link', { name: /Bản đồ/i })
      .map((a) => a.getAttribute('href'));
    expect(mapLinks.length).toBeGreaterThan(0);
    expect(mapLinks[0]).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });

  it('bỏ hình người 1.7m, bỏ section cam kết chính sách riêng, giữ modal footer và dọn chữ thừa', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(container.querySelector('#rent-now')).not.toBeInTheDocument();
    expect(screen.queryByText('1.7m')).not.toBeInTheDocument();
    expect(screen.queryByText(/Hỗ trợ xe đẩy miễn phí/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chọn kho Máy lạnh/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Xem ô kho Tiêu chuẩn/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Xem các ô kho phù hợp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mã PIN 6 số riêng tư/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cơ sở tại Hà Nội/i)).not.toBeInTheDocument();
    const headingTexts = Array.from(container.querySelectorAll('h2')).map((h) => h.textContent ?? '');
    for (const txt of headingTexts) {
      expect(txt).not.toMatch(/0[1-6]\s*·/);
    }
    expect(container.innerHTML).not.toMatch(/BƯỚC\s*0[1-3]/i);
    expect(container.innerHTML).not.toMatch(/NHU CẦU\s*0[1-3]/i);
    expect(container.innerHTML).not.toContain('lh3.googleusercontent.com');
    expect(container.innerHTML).not.toContain('SMARTVN40');
    expect(container.innerHTML).not.toContain('1900 8899');
    expect(container.innerHTML).not.toContain('/assets/landing/unit-lanh.jpg');
    expect(container.innerHTML).not.toMatch(/xe máy/i);
    expect(container.innerHTML).not.toContain('Shop Online &amp; B2B');
    expect(container.innerHTML).not.toContain('Chọn cỡ kho hoặc thêm đồ đạc để xem sức chứa thực');
    expect(container.innerHTML).not.toContain(
      'Dữ liệu chi nhánh, giá thuê và số lượng ô trống được cập nhật trực tiếp từ hệ thống.'
    );
    expect(screen.getByText(/Kinh doanh & Lưu hồ sơ/i)).toBeInTheDocument();
    expect(screen.getByText(/Tại sao chọn SmartStorage/i)).toBeInTheDocument();
    expect(screen.getByText(/MÀN 01 · CHỌN KHO/i)).toHaveClass('font-pixel');
    expect(screen.getByText(/MÀN 02 · THANH TOÁN/i)).toHaveClass('font-pixel');
    expect(screen.getByText(/MÀN 03 · NHẬN KHO/i)).toHaveClass('font-pixel');
    expect(screen.getByText(/500\.000\s*₫\/tháng/i)).not.toHaveClass('font-pixel');
    expect(screen.getByText(/06:00–22:00/i)).not.toHaveClass('font-pixel');
    expect(screen.getByText(/Gọn hơn thuê kho lẻ bên ngoài/i)).toBeInTheDocument();
    expect(screen.queryByText(/Tiện gọn hơn tự thuê nhà kho rời bên ngoài/i)).not.toBeInTheDocument();
    expect(
      screen.getByAltText(/Không gian lưu trữ tự quản SmartStorage tại công viên xanh/i)
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(/Không gian giải đáp câu hỏi thường gặp SmartStorage/i)
    ).toBeInTheDocument();
    const standardUnitImg = screen.getByAltText(/Minh họa kho tiêu chuẩn SmartStorage/i);
    expect(standardUnitImg).toHaveClass('object-contain');
    expect(standardUnitImg).not.toHaveClass('object-cover');
    expect(standardUnitImg).not.toHaveClass('max-h-[144px]');
    expect(screen.queryByText(/Tích hợp sẵn gói bảo vệ cơ bản 10 triệu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tùy chọn bảo vệ tài sản tới 50 triệu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bảo vệ cơ bản 10 triệu \(miễn phí\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/50\.000đ\/tháng/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bảo vệ hàng hóa 10tr/i)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Trách nhiệm bảo quản hàng hóa và quy định an toàn ra sao\?/i })
    );
    expect(screen.getByText(/lỗi kỹ thuật hạ tầng cơ sở/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bảo vệ cơ bản 10 triệu \(miễn phí\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/50\.000đ\/tháng/i)).not.toBeInTheDocument();
    expect(screen.getByAltText(/Minh họa Chuyển nhà & Sửa nhà/i)).toBeInTheDocument();

    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;
    const closingCta = container.querySelector('#closing-cta') as HTMLElement;
    expect(closingCta).toBeInTheDocument();
    expect(within(closingCta).getByText(/Bắt đầu lưu trữ hôm nay/i)).toBeInTheDocument();
    const closingBtn = within(closingCta).getByRole('button', { name: /Chọn cơ sở & Đặt kho/i });
    expect(closingBtn).toHaveClass('btn-tactile');
    fireEvent.click(closingBtn);
    expect(scrollSpy).toHaveBeenCalled();
    expect(screen.getByAltText(/Minh họa Kinh doanh & Lưu hồ sơ/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Minh họa Đồ giá trị, nhạy ẩm/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chị Minh Thư/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Anh Quốc Bảo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bạn Hoàng Nam/i)).not.toBeInTheDocument();
    expect(screen.queryByAltText(/Ảnh đại diện/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chính sách hủy & hoàn tiền cọc' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/hoàn 100% tiền thuê và 100% tiền cọc/i)).toBeInTheDocument();
  });
});
