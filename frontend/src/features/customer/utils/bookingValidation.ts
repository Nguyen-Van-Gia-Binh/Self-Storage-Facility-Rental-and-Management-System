export interface BookingCustomerFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerIdCard: string;
  agreeTerms: boolean;
}

export type BookingFormErrors = Record<string, string>;

/**
 * Kiểm tra tính hợp lệ của thông tin khách hàng đặt chỗ
 * - Họ tên: Không được để trống
 * - Số điện thoại: Định dạng Việt Nam (10 số, đầu số hợp lệ)
 * - Email: Định dạng email chuẩn
 * - CCCD / Hộ chiếu: 9 đến 12 chữ số
 * - Điều khoản: Bắt buộc tick chọn đồng ý
 */
export function validateBookingCustomerForm(data: BookingCustomerFormData): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!data.customerName.trim()) {
    errors.customerName = 'Vui lòng nhập họ và tên';
  }

  if (!data.customerPhone.trim()) {
    errors.customerPhone = 'Vui lòng nhập số điện thoại';
  } else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(data.customerPhone.replace(/\s+/g, ''))) {
    errors.customerPhone = 'Số điện thoại không hợp lệ (ví dụ: 0901234567)';
  }

  if (!data.customerEmail.trim()) {
    errors.customerEmail = 'Vui lòng nhập email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
    errors.customerEmail = 'Email không hợp lệ';
  }

  if (!data.customerIdCard.trim()) {
    errors.customerIdCard = 'Vui lòng nhập số CCCD / Hộ chiếu (12 số)';
  } else if (!/^\d{9,12}$/.test(data.customerIdCard.replace(/\s+/g, ''))) {
    errors.customerIdCard = 'Số CCCD phải gồm 9 đến 12 chữ số';
  }

  if (!data.agreeTerms) {
    errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách cọc để tiếp tục';
  }

  return errors;
}
