/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-81: Đồng bộ Logo thương hiệu SmartStorage trên toàn bộ hệ thống
 * Người thực hiện: Nhi (WS1 - Khách hàng & Đặt chỗ)
 */
describe('ISS-81: Đồng bộ Logo Thương Hiệu SmartStorage (Boxes 3 Khối Thông Minh)', () => {
  const logoComponentPath = path.resolve(
    process.cwd(),
    'src/components/ui/Logo.tsx'
  );
  const customerLayoutPath = path.resolve(
    process.cwd(),
    'src/layouts/CustomerLayout.tsx'
  );
  const dashboardLayoutPath = path.resolve(
    process.cwd(),
    'src/layouts/DashboardLayout.tsx'
  );
  const loginPagePath = path.resolve(
    process.cwd(),
    'src/features/auth/pages/LoginPage.tsx'
  );
  const registerPagePath = path.resolve(
    process.cwd(),
    'src/features/auth/pages/RegisterPage.tsx'
  );
  const forgotPasswordPagePath = path.resolve(
    process.cwd(),
    'src/features/auth/pages/ForgotPasswordPage.tsx'
  );
  const faviconPath = path.resolve(
    process.cwd(),
    'public/favicon.svg'
  );

  it('Component Logo.tsx chuẩn hóa biểu tượng Boxes 3 khối hộp và hỗ trợ dark/light variant, sm/md/lg size', () => {
    const content = fs.readFileSync(logoComponentPath, 'utf-8');
    expect(content).toMatch(/import \{ Boxes \} from 'lucide-react';/);
    expect(content).toMatch(/export const Logo: React\.FC<LogoProps>/);
    expect(content).toMatch(/SmartStorage/);
    expect(content).toMatch(/sizeConfig/);
  });

  it('CustomerLayout sử dụng Logo dùng chung và không còn sử dụng icon đơn Box cho logo', () => {
    const content = fs.readFileSync(customerLayoutPath, 'utf-8');
    expect(content).toMatch(/import \{ Logo \} from '@\/components\/ui\/Logo';/);
    expect(content).toMatch(/<Logo to="\/customer" subtitle="Self-Storage Solutions" size="md" \/>/);
    expect(content).toMatch(/<Logo showSubtitle=\{false\} size="sm" \/>/);
    expect(content).not.toMatch(/<Box className=/);
  });

  it('DashboardLayout sử dụng Logo dùng chung và icon Boxes chuẩn cho menu thu gọn', () => {
    const content = fs.readFileSync(dashboardLayoutPath, 'utf-8');
    expect(content).toMatch(/import \{ Logo \} from '@\/components\/ui\/Logo';/);
    expect(content).toMatch(/<Logo\s+to=\{logoHomePath\}\s+subtitle=\{displayTitle\}/);
    expect(content).toMatch(/<Logo to=\{logoHomePath\} subtitle=\{portalLabel\} size="sm" \/>/);
    expect(content).toMatch(/<Boxes className="w-5 h-5 transition-transform/);
    expect(content).not.toMatch(/<Box className=/);
  });

  it('Các trang Auth (Login, Register, Forgot Password) tích hợp component Logo đồng bộ', () => {
    const loginContent = fs.readFileSync(loginPagePath, 'utf-8');
    const registerContent = fs.readFileSync(registerPagePath, 'utf-8');
    const forgotContent = fs.readFileSync(forgotPasswordPagePath, 'utf-8');

    expect(loginContent).toMatch(/import \{ Logo \} from '@\/components\/ui\/Logo';/);
    expect(loginContent).toMatch(/<Logo\s+to="\/"\s+variant="light"\s+size="lg"/);

    expect(registerContent).toMatch(/import \{ Logo \} from '@\/components\/ui\/Logo';/);
    expect(registerContent).toMatch(/<Logo\s+to="\/"\s+variant="light"\s+size="lg"/);

    expect(forgotContent).toMatch(/import \{ Logo \} from '@\/components\/ui\/Logo';/);
    expect(forgotContent).toMatch(/<Logo\s+to="\/"\s+size="lg"/);
  });

  it('Favicon chuẩn thương hiệu với 3 khối hộp SmartStorage', () => {
    const faviconContent = fs.readFileSync(faviconPath, 'utf-8');
    expect(faviconContent).toMatch(/#008B74/);
    expect(faviconContent).toMatch(/SmartStorage Brand Mark/);
  });
});
