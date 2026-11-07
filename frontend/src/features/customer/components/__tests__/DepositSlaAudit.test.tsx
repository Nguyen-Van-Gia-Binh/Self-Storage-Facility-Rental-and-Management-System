import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Deposit SLA Audit: Không được hiển thị cam kết hoàn cọc 24-48 giờ', () => {
  it('File ScheduleReturnModal.tsx không chứa "24-48" và chứa "7 ngày làm việc"', () => {
    const fullPath = path.resolve(process.cwd(), 'src/features/customer/components/ScheduleReturnModal.tsx');
    const content = fs.readFileSync(fullPath, 'utf-8');
    expect(content).not.toMatch(/24-48/i);
    expect(content).toMatch(/7 ngày làm việc/i);
  });

  it('File MyUnitsPage.tsx không chứa "24-48"', () => {
    const fullPath = path.resolve(process.cwd(), 'src/features/customer/pages/MyUnitsPage.tsx');
    const content = fs.readFileSync(fullPath, 'utf-8');
    expect(content).not.toMatch(/24-48/i);
  });
});
