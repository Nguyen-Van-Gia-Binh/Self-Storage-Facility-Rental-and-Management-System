// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SurchargeTable } from '../SurchargeTable';
import type { SurchargeItem } from '@/types';

const mockSurcharges: SurchargeItem[] = [
  {
    id: 1,
    code: 'PHA-NANG',
    name: 'Phạt nặng',
    category: 'DAMAGE',
    type: 'PERCENTAGE',
    amount: 100,
    effectiveDate: '2026-11-09',
    isActive: true,
    facilityId: null,
    facilityName: null,
  },
  {
    id: 2,
    code: 'LOI-NHI',
    name: 'Lợi nhị',
    category: 'KEY_REPLACEMENT',
    type: 'FIXED',
    amount: 100000,
    effectiveDate: '2026-10-22',
    isActive: false,
    facilityId: null,
    facilityName: null,
  },
];

describe('SurchargeTable Enterprise UI', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses primary green CTA, concise search placeholder, right-aligned amounts, and 1-click toggle switches', () => {
    const onOpenModal = vi.fn();
    const onEdit = vi.fn();
    const onToggleStatus = vi.fn();

    const { container } = render(
      <SurchargeTable
        surcharges={mockSurcharges}
        onOpenModal={onOpenModal}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
      />
    );

    // Concise search placeholder without redundant "phụ phí" + valid pl-9 clearance for left search icon
    const searchInput = screen.getByPlaceholderText('Tìm kiếm theo tên hoặc mã...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.className).toContain('pl-9');

    // Primary Green CTA instead of warning Amber
    const addBtn = screen.getByRole('button', { name: /Thêm phụ phí/i });
    expect(addBtn.className).toContain('bg-brand-600');
    expect(addBtn.className).not.toContain('bg-amber-');

    // No font-mono mismatch on code column
    const codeCell = screen.getByText('PHA-NANG').closest('td');
    expect(codeCell?.className).not.toContain('font-mono');

    // Right-aligned tabular-nums on Mức phí column
    const amountHeader = screen.getByText('Mức phí').closest('th');
    expect(amountHeader?.className).toContain('text-right');
    const amountCell = screen.getByText('100.000').closest('td');
    expect(amountCell?.className).toContain('text-right');
    expect(amountCell?.className).toContain('tabular-nums');

    // Clean dash separator instead of dot bullet in sub-text
    expect(container.textContent).not.toContain('•');

    // Accessible Toggle Switches instead of Power icons
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');
    expect(switches[1]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(switches[0]);
    expect(onToggleStatus).toHaveBeenCalledWith(mockSurcharges[0]);
  });

  it('renders light floating Bulk Action Bar with clear Outline vs Primary button hierarchy', () => {
    const onBulkToggleStatus = vi.fn();

    render(
      <SurchargeTable
        surcharges={mockSurcharges}
        onOpenModal={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onBulkToggleStatus={onBulkToggleStatus}
      />
    );

    // Select all rows
    const selectAll = screen.getByTitle('Chọn tất cả để thao tác hàng loạt');
    fireEvent.click(selectAll);

    // Light floating bar (not heavy dark slate-900)
    const selectedLabel = screen.getByText(/Đã chọn/i);
    const bar = selectedLabel.closest('div')?.parentElement;
    expect(bar?.className).toContain('bg-white');
    expect(bar?.className).not.toContain('bg-slate-900');

    // Outline "Tạm ngưng" vs Primary "Kích hoạt"
    const deactivateBtn = screen.getByRole('button', { name: /^Tạm ngưng$/i });
    const activateBtn = screen.getByRole('button', { name: /^Kích hoạt$/i });
    expect(deactivateBtn.className).toContain('bg-white');
    expect(deactivateBtn.className).toContain('border');
    expect(activateBtn.className).toContain('bg-brand-600');

    fireEvent.click(activateBtn);
    expect(onBulkToggleStatus).toHaveBeenCalledWith(mockSurcharges, true);
  });
});
