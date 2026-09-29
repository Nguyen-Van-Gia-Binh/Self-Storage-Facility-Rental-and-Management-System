import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mock Data Cleanup Audit', () => {
  it('pricing.ts không còn chứa Kho Tân Bình', () => {
    const filePath = path.resolve(process.cwd(), 'src/api/pricing.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('Tân Bình');
  });

  it('customerApi.ts không còn fallback Storage Locker', () => {
    const filePath = path.resolve(process.cwd(), 'src/features/customer/api/customerApi.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('Storage Locker');
  });

  it('mock-facilities.json chứa các cơ sở chuẩn toàn quốc và không có Tân Bình', () => {
    const filePath = path.resolve(process.cwd(), 'src/mock/mock-facilities.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const facilities = JSON.parse(content);
    expect(facilities.some((f: any) => f.code === 'FAC-CG')).toBe(true);
    expect(facilities.some((f: any) => f.code === 'FAC-TX')).toBe(true);
    expect(facilities.some((f: any) => f.name.includes('Tân Bình'))).toBe(false);
  });

  it('mock-unit-types.json dùng đúng thuật ngữ Ô kho và không chứa Locker', () => {
    const filePath = path.resolve(process.cwd(), 'src/mock/mock-unit-types.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toMatch(/Locker/i);
    expect(content).not.toMatch(/tủ đồ/i);
  });
});
