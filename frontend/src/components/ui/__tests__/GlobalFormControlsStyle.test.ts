/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      results.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Global Form Controls & Focus Ring Enterprise Standards', () => {
  const srcRoot = path.resolve(process.cwd(), 'src');

  it('index.css chuẩn hóa toàn bộ native <select> với mũi tên SVG thanh mảnh và đủ padding phải', () => {
    const css = fs.readFileSync(path.join(srcRoot, 'index.css'), 'utf-8');

    expect(css).toContain('select:not([multiple]):not(.appearance-none)');
    expect(css).toContain('appearance: none;');
    expect(css).toContain('select:not([multiple]):not(.appearance-none):not(.bg-transparent)');
    expect(css).toContain('padding-right: 2.35rem;');
    expect(css).toContain('background-position: right 0.75rem center;');
    expect(css).toContain('select.bg-transparent:not([multiple]):not(.appearance-none)');
    expect(css).toContain('padding-right: 1.5rem;');
  });

  it('WaitlistInboxPage căn đều chiều cao h-9 cho thanh chọn Cơ sở và nút Làm mới', () => {
    const content = fs.readFileSync(
      path.join(srcRoot, 'features/manager/pages/WaitlistInboxPage.tsx'),
      'utf-8'
    );

    expect(content).toContain('h-9 rounded-lg border border-gray-300 bg-white pl-3 pr-9');
    expect(content).toContain('inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300');
  });

  it('Button.tsx và toàn bộ frontend không dùng focus:ring-offset-2 gây viền kép khi click chuột (chỉ dùng focus-visible)', () => {
    const buttonContent = fs.readFileSync(path.join(srcRoot, 'components/ui/Button.tsx'), 'utf-8');
    expect(buttonContent).toContain('focus-visible:ring-2 focus-visible:ring-offset-2');
    expect(buttonContent).not.toContain('focus:ring-2 focus:ring-offset-2');

    const tsxFiles = collectTsxFiles(srcRoot);
    const offending = tsxFiles.filter((filePath) =>
      fs.readFileSync(filePath, 'utf-8').includes('focus:ring-offset-2')
    );
    expect(offending).toEqual([]);
  });

  it('Input.tsx dùng focus ring dịu (/20) và ForgotPasswordPage OTP input có padding ngang px-4', () => {
    const inputContent = fs.readFileSync(path.join(srcRoot, 'components/ui/Input.tsx'), 'utf-8');
    expect(inputContent).toContain('focus:ring-brand-500/20');
    expect(inputContent).toContain('focus:ring-red-500/20');

    const forgotContent = fs.readFileSync(
      path.join(srcRoot, 'features/auth/pages/ForgotPasswordPage.tsx'),
      'utf-8'
    );
    expect(forgotContent).toContain('px-4 py-3 rounded-xl bg-slate-50 border border-slate-200');
  });

  it('đồng bộ hoàn toàn font Inter toàn hệ thống: không ép tnum toàn cục lên html/body, không dùng font-mono trên WorkItemCard và bỏ font cũ Be Vietnam Pro trên HomePage', () => {
    const css = fs.readFileSync(path.join(srcRoot, 'index.css'), 'utf-8');
    expect(css).not.toContain("font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11', 'tnum';");
    expect(css).toContain('code,');
    expect(css).toContain('.font-mono {');

    const workItemCard = fs.readFileSync(
      path.join(srcRoot, 'features/manager/components/WorkItemCard.tsx'),
      'utf-8'
    );
    expect(workItemCard).not.toContain('font-mono');

    const shiftPage = fs.readFileSync(
      path.join(srcRoot, 'features/manager/pages/ShiftCalendarPage.tsx'),
      'utf-8'
    );
    expect(shiftPage).not.toContain('font-mono');

    const homePage = fs.readFileSync(
      path.join(srcRoot, 'features/customer/pages/HomePage.tsx'),
      'utf-8'
    );
    expect(homePage).not.toContain('Be Vietnam Pro');

    const homeHero = fs.readFileSync(
      path.join(srcRoot, 'features/customer/components/HomeHeroSection.tsx'),
      'utf-8'
    );
    expect(homeHero).not.toContain('Be Vietnam Pro');
  });
});
