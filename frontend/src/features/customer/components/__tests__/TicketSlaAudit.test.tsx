// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateSupportTicketModal } from '../CreateSupportTicketModal';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const mockRentals = [
  {
    id: '1',
    contractId: '1',
    unitId: '101',
    unitNumber: 'U-101',
    facilityId: '1',
    facilityName: 'Cầu Giấy',
    unitTypeName: 'Kho Cỡ S',
  },
];

const mockFacilities = [
  { id: '1', name: 'Cầu Giấy' }
];

describe('CreateSupportTicketModal - SLA Audit', () => {
  it('should not show SLA 2h checkbox and should submit isUrgent as false', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    
    render(
      <BrowserRouter>
        <CreateSupportTicketModal
          isOpen={true}
          onClose={vi.fn()}
          rentals={mockRentals as any}
          facilities={mockFacilities as any}
          onSubmit={onSubmitMock}
        />
      </BrowserRouter>
    );

    // Should not have the old SLA 2h text
    expect(screen.queryByText(/Cam kết SLA xử lý tại chỗ trong vòng 2 giờ/i)).not.toBeInTheDocument();

    // Select LOCK_ACCESS
    const lockAccessOption = screen.getByText('Khóa & Mã PIN');
    fireEvent.click(lockAccessOption);

    // Fill the description (no placeholder per UI streamline)
    const textboxes = screen.getAllByRole('textbox');
    const descInput = textboxes[textboxes.length - 1];
    fireEvent.change(descInput, { target: { value: 'Cửa kho không mở được bằng mã PIN' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu hỗ trợ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
        category: 'LOCK_ACCESS',
        isUrgent: false,
        description: 'Cửa kho không mở được bằng mã PIN'
      }));
    });
  });
});
