// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SmartStorageHeroCard } from '../components/SmartStorageHeroCard';

afterEach(() => {
  cleanup();
});

describe('SmartStorageHeroCard', () => {
  it('hiển thị hình ảnh mô hình SmartStorage kèm các huy hiệu trạng thái động', () => {
    const { container } = render(<SmartStorageHeroCard />);

    const img = screen.getByAltText('Mô hình dịch vụ kho tự quản SmartStorage');
    expect(img).toBeInTheDocument();
    expect(img.parentElement).toHaveClass('hero-ken-burns');

    const tiltCard = container.querySelector('[data-testid="smart-storage-hero-tilt"]');
    expect(tiltCard).toHaveClass('hero-steady-tilt');

    expect(screen.getByText('Cơ sở mở cửa 24/7')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống Smart Lock')).toBeInTheDocument();
  });

  it('xử lý tương tác rê chuột 3D parallax mượt mà không gây lỗi', () => {
    const { container } = render(<SmartStorageHeroCard />);
    const card = container.querySelector('[data-testid="smart-storage-hero-tilt"]');
    expect(card).toBeInTheDocument();

    if (card) {
      fireEvent.mouseMove(card, { clientX: 120, clientY: 80 });
      fireEvent.mouseLeave(card);
      expect(card).not.toHaveClass('is-hovering');
    }

    expect(screen.getByAltText('Mô hình dịch vụ kho tự quản SmartStorage')).toBeInTheDocument();
  });
});
