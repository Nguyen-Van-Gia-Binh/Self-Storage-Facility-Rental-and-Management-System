

/**
 * Câu hỏi thường gặp dành cho khách hàng (Khớp Wireframe SCR-SC-06 & Business Rules)
 */
export interface SupportFaq {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export const mockSupportFaqs: SupportFaq[] = [
  {
    id: 1,
    question: 'Khi nào tôi được hoàn tiền đặt cọc sau khi trả kho?',
    answer: 'Tiền cọc sẽ được hoàn trả tự động vào tài khoản ngân hàng của bạn trong vòng tối đa 07 ngày làm việc sau khi hai bên ký biên bản nghiệm thu trả kho không phát sinh hư hại.',
    category: 'Hoàn tiền & Đặt cọc',
  },
  {
    id: 2,
    question: 'Nếu tôi bị kẹt khóa hoặc quên mã PIN thì xử lý mất bao lâu?',
    answer: 'Theo tiêu chuẩn dịch vụ khẩn cấp, các sự cố về kẹt khóa cơ, hỏng khóa số, quên mã PIN hoặc mất chìa khóa cơ sẽ được nhân viên trực quầy xử lý tận nơi trong vòng tối đa 02 giờ.',
    category: 'Khóa & Truy cập',
  },
  {
    id: 3,
    question: 'Chi phí sửa chữa hư hại trong ô kho được tính như thế nào?',
    answer: 'Đối với sự cố do hạ tầng cơ sở (thấm dột, hệ thống điện), cơ sở chịu 100% chi phí khắc phục. Nếu sự cố do tác động chủ quan từ khách hàng, chi phí sửa chữa sẽ căn cứ theo biên bản kiểm tra và thỏa thuận thực tế.',
    category: 'Chi phí & Bồi thường',
  },
  {
    id: 4,
    question: 'Quy trình nghiệm thu sau khi nhân viên xử lý xong sự cố?',
    answer: 'Nhân viên bắt buộc cập nhật ghi chú và ảnh hiện trường sau khi xử lý. Bạn có thể bấm "Xác nhận hài lòng" để đóng ticket. Nếu sau 07 ngày làm việc bạn không phản hồi, hệ thống sẽ tự động đóng ticket.',
    category: 'Nghiệm thu & Đóng vé',
  },
];

