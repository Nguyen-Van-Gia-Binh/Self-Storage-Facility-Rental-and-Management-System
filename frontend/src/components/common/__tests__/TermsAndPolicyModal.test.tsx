// @vitest-environment jsdom
import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TermsAndPolicyModal } from '../TermsAndPolicyModal';
import { BookingCustomerForm } from '@/features/customer/components/BookingCustomerForm';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';

afterEach(() => {
  cleanup();
});

describe('TermsAndPolicyModal — Pop-up Điều khoản & Chính sách sử dụng cho Khách hàng', () => {
  it('hiển thị đầy đủ 4 tab chính sách và tuyệt đối không chứa mã kỹ thuật BR-* hay checkin.grace_days', () => {
    const onClose = vi.fn();
    render(
      <TermsAndPolicyModal
        isOpen={true}
        onClose={onClose}
        initialTab="booking"
        holdHours={48}
        depositMultiplierLabel="1"
      />
    );

    // 4 tab tiêu đề
    expect(screen.getByRole('button', { name: /Đặt chỗ, Tiền cọc & Hủy lịch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nhận kho, Gia hạn & Trả kho/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nội quy, PCCC & Bảo hiểm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tài khoản & Bảo mật/i })).toBeInTheDocument();

    // Nội dung Tab 1 (Đặt chỗ, Tiền cọc & Hủy lịch)
    expect(screen.getByText(/Tối đa 30 ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ 7 ngày trở lên/i)).toBeInTheDocument();
    expect(screen.getByText(/Từ 2 đến 6 ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/Dưới 48 giờ/i)).toBeInTheDocument();

    // Kiểm tra không có mã BR-* hay checkin.grace_days trên giao diện
    const dialogText = document.body.textContent || '';
    expect(dialogText).not.toMatch(/BR-[A-Z]+-\d+/);
    expect(dialogText).not.toMatch(/checkin\.grace_days/i);

    // Chuyển sang Tab 2 (Nhận kho, Gia hạn & Trả kho)
    fireEvent.click(screen.getByRole('button', { name: /Nhận kho, Gia hạn & Trả kho/i }));
    expect(screen.getByText(/Trước hạn chót 20 ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/5% tiền cọc\/ngày/i)).toBeInTheDocument();
    expect(screen.getByText(/10% tiền cọc\/ngày/i)).toBeInTheDocument();

    const tab2Text = document.body.textContent || '';
    expect(tab2Text).not.toMatch(/BR-[A-Z]+-\d+/);
    expect(tab2Text).not.toMatch(/checkin\.grace_days/i);
    expect(tab2Text).not.toMatch(/10 ngày lịch/i);

    // Chuyển sang Tab 3 (Nội quy, PCCC & Bảo hiểm)
    fireEvent.click(screen.getByRole('button', { name: /Nội quy, PCCC & Bảo hiểm/i }));
    expect(screen.getByText(/10\.000\.000 ₫/i)).toBeInTheDocument();
    expect(screen.getByText(/50\.000\.000 ₫/i)).toBeInTheDocument();

    // Chuyển sang Tab 4 (Tài khoản & Bảo mật)
    fireEvent.click(screen.getByRole('button', { name: /Tài khoản & Bảo mật/i }));
    expect(screen.getByText(/Mục đích thu thập & Bảo mật CCCD \/ Hộ chiếu/i)).toBeInTheDocument();
  });

  it('bấm nút đồng ý trong modal sẽ kích hoạt onAccept và đóng modal', () => {
    const onClose = vi.fn();
    const onAccept = vi.fn();

    render(
      <TermsAndPolicyModal
        isOpen={true}
        onClose={onClose}
        onAccept={onAccept}
        initialTab="booking"
      />
    );

    const acceptBtn = screen.getByRole('button', { name: /Tôi đã đọc hiểu & Đồng ý điều khoản/i });
    fireEvent.click(acceptBtn);

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('BookingCustomerForm mở pop-up khi bấm vào link điều khoản/chính sách cọc và tự động tích chọn khi bấm Đồng ý', () => {
    const Wrapper = () => {
      const [agreeTerms, setAgreeTerms] = useState(false);
      return (
        <BookingCustomerForm
          customerName="Nguyễn Văn A"
          setCustomerName={vi.fn()}
          customerPhone="0901234567"
          setCustomerPhone={vi.fn()}
          customerEmail="a@example.com"
          setCustomerEmail={vi.fn()}
          customerIdCard="079199001234"
          setCustomerIdCard={vi.fn()}
          agreeTerms={agreeTerms}
          setAgreeTerms={setAgreeTerms}
          formErrors={{}}
          holdHours={48}
          depositMultiplierLabel="1"
          bookingError={null}
          isSubmitting={false}
          isCheckingAvailability={false}
          isButtonDisabled={false}
          onSubmit={vi.fn()}
        />
      );
    };

    render(<Wrapper />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    // Bấm vào link "Điều khoản sử dụng" trên form đặt kho
    const termsTrigger = screen.getByRole('button', { name: /Điều khoản sử dụng/i });
    fireEvent.click(termsTrigger);

    // Modal hiện lên
    expect(screen.getByText(/Điều khoản sử dụng & Chính sách khách hàng/i)).toBeInTheDocument();

    // Bấm nút Đồng ý trong modal -> tự động tích chọn checkbox
    fireEvent.click(screen.getByRole('button', { name: /Tôi đã đọc hiểu & Đồng ý điều khoản/i }));
    expect(checkbox).toBeChecked();
  });

  it('RegisterPage mở pop-up khi bấm vào Điều khoản dịch vụ hoặc Chính sách bảo vệ quyền riêng tư', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const privacyTriggers = screen.getAllByRole('button', { name: /Chính sách bảo vệ quyền riêng tư|Chính sách bảo mật/i });
    fireEvent.click(privacyTriggers[0]);

    expect(screen.getByText(/Điều khoản sử dụng & Chính sách khách hàng/i)).toBeInTheDocument();
  });

  it('LoginPage mở pop-up khi bấm vào Chính sách bảo mật hoặc Điều khoản dịch vụ', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const termsTrigger = screen.getByRole('button', { name: /Điều khoản dịch vụ/i });
    fireEvent.click(termsTrigger);

    expect(screen.getByText(/Điều khoản sử dụng & Chính sách khách hàng/i)).toBeInTheDocument();
  });
});
