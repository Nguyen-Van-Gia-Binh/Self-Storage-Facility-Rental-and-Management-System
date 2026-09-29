import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Deposit SLA Audit: Không được hiển thị cam kết hoàn cọc 24-48 giờ', () => {
  const targetFiles = [
    'src/features/customer/pages/MyUnitsPage.tsx',
    'src/features/customer/components/ScheduleReturnModal.tsx',
  ];

  targetFiles.forEach((relPath) => {
    it(`File ${relPath} không chứa "24-48" và chứa "7 ngày"`, () => {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toMatch(/24-48/i);
      expect(content).toMatch(/7 ngày làm việc/i);
    });
  });
});
