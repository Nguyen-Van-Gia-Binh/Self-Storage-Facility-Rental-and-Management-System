/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-85: Xác thực Email khách hàng qua mã OTP 5 phút khi đăng ký tài khoản mới (Chống email spam)
 * Khác biệt với mã OTP đặt lại mật khẩu (60 giây), OTP đăng ký tài khoản có hiệu lực 5 phút theo chuẩn thị trường.
 */
describe('ISS-85: Quy trình Đăng ký tài khoản xác thực qua Email OTP (5 phút)', () => {
  const authApiPath = path.resolve(process.cwd(), 'src/api/auth.ts');
  const registerPagePath = path.resolve(process.cwd(), 'src/features/auth/pages/RegisterPage.tsx');

  it('API client auth.ts định nghĩa sendRegisterOtp và bổ sung trường otp vào RegisterPayload', () => {
    const content = fs.readFileSync(authApiPath, 'utf-8');
    expect(content).toMatch(/otp:\s*string;/);
    expect(content).toMatch(/export\s+async\s+function\s+sendRegisterOtp/);
    expect(content).toMatch(/\/auth\/send-register-otp/);
    expect(content).toMatch(/sendRegisterOtp,/);
  });

  it('RegisterPage.tsx triển khai Stepper 2 bước: Nhập thông tin -> Xác thực Email OTP', () => {
    const content = fs.readFileSync(registerPagePath, 'utf-8');
    expect(content).toMatch(/const \[step, setStep\] = useState<'form' \| 'otp'>\('form'\);/);
    expect(content).toMatch(/const \[otp, setOtp\] = useState\(''\);/);
    expect(content).toMatch(/const \[resendCooldown, setResendCooldown\] = useState\(0\);/);
  });

  it('RegisterPage.tsx thông báo rõ ràng thời hạn OTP đăng ký 5 phút và áp dụng cooldown gửi lại 60 giây', () => {
    const content = fs.readFileSync(registerPagePath, 'utf-8');
    expect(content).toMatch(/5 phút/);
    expect(content).toMatch(/setResendCooldown\(60\)/);
    expect(content).toMatch(/Chưa nhận được mã\? Gửi lại/);
  });

  it('RegisterPage.tsx gọi sendRegisterOtp trước khi chuyển sang bước OTP và truyền mã OTP khi submit registerUser', () => {
    const content = fs.readFileSync(registerPagePath, 'utf-8');
    expect(content).toMatch(/await sendRegisterOtp\(/);
    expect(content).toMatch(/await registerUser\(\{[\s\S]*otp:\s*otp\.trim\(\)/);
  });
});
