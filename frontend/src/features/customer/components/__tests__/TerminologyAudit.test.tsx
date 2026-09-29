import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Terminology Audit: Không được sử dụng các thuật ngữ sai lệch bản chất Self-Storage', () => {
  const targetFiles = [
    'src/features/customer/components/ContractDetailModal.tsx',
    'src/features/customer/components/RentedUnitCard.tsx',
    'src/features/customer/pages/BookingPage.tsx',
    'src/features/customer/components/EarlyRenewalReminderModal.tsx',
    'src/features/customer/components/RenewalReceiptModal.tsx',
    'src/features/customer/pages/HomePage.tsx',
    'src/features/customer/pages/MyUnitsPage.tsx',
    'src/features/manager/api/staffAssignmentApi.ts',
  ];

  targetFiles.forEach((relPath) => {
    it(`File ${relPath} không chứa "ngăn tủ", "ngăn kho", "tủ đồ"`, () => {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toMatch(/ngăn tủ/i);
      expect(content).not.toMatch(/ngăn kho/i);
      expect(content).not.toMatch(/tủ đồ/i);
    });
  });
});
