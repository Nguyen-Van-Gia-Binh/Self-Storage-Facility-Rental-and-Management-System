package com.swp391.selfstorage.common.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otpCode, int expirationSeconds) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@smartstorage.vn";
            log.info("Bắt đầu gửi email OTP: từ sender={}, tới recipient={}", sender, toEmail);
            helper.setFrom(sender, "SmartStorage System");
            helper.setTo(toEmail);
            helper.setSubject("[SmartStorage] Mã xác thực đặt lại mật khẩu: " + otpCode);

            String htmlContent = buildOtpHtmlContent(otpCode, expirationSeconds);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi mã OTP đặt lại mật khẩu tới email: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email OTP tới {}: {}", toEmail, e.getMessage(), e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }

    public void sendRegistrationOtpEmail(String toEmail, String otpCode, int expirationMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@smartstorage.vn";
            log.info("Bắt đầu gửi email OTP đăng ký: từ sender={}, tới recipient={}", sender, toEmail);
            helper.setFrom(sender, "SmartStorage System");
            helper.setTo(toEmail);
            helper.setSubject("[SmartStorage] Mã xác thực đăng ký tài khoản: " + otpCode);

            String htmlContent = buildRegistrationOtpHtmlContent(otpCode, expirationMinutes);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi mã OTP đăng ký tới email: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Lỗi khi gửi email OTP đăng ký tới {}: {}", toEmail, e.getMessage(), e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể gửi email xác thực. Vui lòng thử lại sau.");
        }
    }

    private String buildRegistrationOtpHtmlContent(String otpCode, int expirationMinutes) {
        return "<!DOCTYPE html>"
                + "<html lang=\"vi\">"
                + "<head><meta charset=\"UTF-8\"><title>Xác thực đăng ký tài khoản</title></head>"
                + "<body style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 30px;\">"
                + "  <div style=\"max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);\">"
                + "    <div style=\"background: linear-gradient(135deg, #10b981, #059669); padding: 28px 24px; text-align: center;\">"
                + "      <h1 style=\"color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;\">SmartStorage</h1>"
                + "      <p style=\"color: #d1fae5; margin: 6px 0 0; font-size: 13px;\">Hệ thống Quản lý & Cho thuê Kho Tự Quản</p>"
                + "    </div>"
                + "    <div style=\"padding: 32px 28px;\">"
                + "      <h2 style=\"color: #1e293b; font-size: 18px; margin-top: 0; font-weight: 600;\">Xác thực Tạo Tài khoản Mới</h2>"
                + "      <p style=\"color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;\">"
                + "        Chào mừng bạn đến với <strong>SmartStorage</strong>! Để hoàn tất quy trình tạo tài khoản khách hàng, vui lòng nhập mã OTP dưới đây để xác minh địa chỉ email của bạn:"
                + "      </p>"
                + "      <div style=\"background: #f0fdf4; border: 2px dashed #86efac; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0;\">"
                + "        <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #059669; font-family: monospace;\">"
                + otpCode
                + "</span>"
                + "      </div>"
                + "      <p style=\"color: #059669; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 24px;\">"
                + "        ⏰ Mã OTP này có hiệu lực trong vòng <strong>" + expirationMinutes + " phút</strong>."
                + "      </p>"
                + "      <div style=\"background-color: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; border-radius: 4px;\">"
                + "        <p style=\"color: #475569; font-size: 12px; margin: 0; line-height: 1.5;\">"
                + "          <strong>Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho người khác. Nếu bạn không yêu cầu đăng ký tài khoản tại SmartStorage, vui lòng bỏ qua email này."
                + "        </p>"
                + "      </div>"
                + "    </div>"
                + "    <div style=\"background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;\">"
                + "      <p style=\"color: #94a3b8; font-size: 11px; margin: 0;\">© 2026 SmartStorage Facility Rental System · SWP391</p>"
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }

    private String buildOtpHtmlContent(String otpCode, int expirationSeconds) {
        return "<!DOCTYPE html>"
                + "<html lang=\"vi\">"
                + "<head><meta charset=\"UTF-8\"><title>Mã xác thực OTP</title></head>"
                + "<body style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 30px;\">"
                + "  <div style=\"max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);\">"
                + "    <div style=\"background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 28px 24px; text-align: center;\">"
                + "      <h1 style=\"color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;\">SmartStorage</h1>"
                + "      <p style=\"color: #bfdbfe; margin: 6px 0 0; font-size: 13px;\">Hệ thống Quản lý & Cho thuê Kho Tự Quản</p>"
                + "    </div>"
                + "    <div style=\"padding: 32px 28px;\">"
                + "      <h2 style=\"color: #1e293b; font-size: 18px; margin-top: 0; font-weight: 600;\">Yêu cầu Đặt lại Mật khẩu</h2>"
                + "      <p style=\"color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;\">"
                + "        Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>SmartStorage</strong>. Vui lòng sử dụng mã xác thực OTP dưới đây để hoàn tất việc đổi mật khẩu:"
                + "      </p>"
                + "      <div style=\"background: #f1f5f9; border: 2px dashed #94a3b8; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0;\">"
                + "        <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;\">"
                + otpCode
                + "</span>"
                + "      </div>"
                + "      <p style=\"color: #dc2626; font-size: 13px; font-weight: 500; text-align: center; margin-bottom: 24px;\">"
                + "        ⏰ Mã OTP này chỉ có hiệu lực trong vòng <strong>" + expirationSeconds + " giây</strong>."
                + "      </p>"
                + "      <div style=\"background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px;\">"
                + "        <p style=\"color: #991b1b; font-size: 12px; margin: 0; line-height: 1.5;\">"
                + "          <strong>Cảnh báo an toàn:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên SmartStorage. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email."
                + "        </p>"
                + "      </div>"
                + "    </div>"
                + "    <div style=\"background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;\">"
                + "      <p style=\"color: #94a3b8; font-size: 11px; margin: 0;\">© 2026 SmartStorage Facility Rental System · SWP391</p>"
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }
}
