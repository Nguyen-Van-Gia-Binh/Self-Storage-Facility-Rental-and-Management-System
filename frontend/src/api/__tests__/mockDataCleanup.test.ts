import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mock Data Cleanup & Real Database API Audit', () => {
  it('pricing.ts không còn mockActivePolicy, không còn inMemory mock và gọi API thật', () => {
    const filePath = path.resolve(process.cwd(), 'src/api/pricing.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('mockActivePolicy');
    expect(content).not.toContain('inMemoryUnitTypes');
    expect(content).not.toContain('inMemorySurcharges');
    expect(content).not.toContain('mock-unit-types.json');
    expect(content).not.toContain('Tân Bình');
    expect(content).toContain('/policies/active');
    expect(content).toContain('/facilities/${facilityId}/prices');
    expect(content).toContain('/surcharges');
  });

  it('facility.ts không còn USE_MOCK hay import mock json và gọi API thật', () => {
    const filePath = path.resolve(process.cwd(), 'src/api/facility.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('USE_MOCK');
    expect(content).not.toContain('inMemoryFacilities');
    expect(content).not.toContain('mockFacilities');
    expect(content).not.toContain('mock-facilities.json');
    expect(content).not.toContain('mock-unit-types.json');
    expect(content).toContain('/facilities');
    expect(content).toContain('/facilities/${facilityId}/unit-types');
  });

  it('mock-facilities.json và mock-unit-types.json đã được xóa hoàn toàn', () => {
    const facMockPath = path.resolve(process.cwd(), 'src/mock/mock-facilities.json');
    const utMockPath = path.resolve(process.cwd(), 'src/mock/mock-unit-types.json');
    expect(fs.existsSync(facMockPath)).toBe(false);
    expect(fs.existsSync(utMockPath)).toBe(false);
  });

  it('report.ts không còn USE_MOCK hay mock-system-reports.json và gọi API thật', () => {
    const filePath = path.resolve(process.cwd(), 'src/api/report.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const mockPath = path.resolve(process.cwd(), 'src/mock/mock-system-reports.json');
    expect(content).not.toContain('USE_MOCK');
    expect(content).not.toContain('mock-system-reports.json');
    expect(fs.existsSync(mockPath)).toBe(false);
    expect(content).toContain('/reports/system/revenue');
    expect(content).toContain('/reports/system/occupancy');
    expect(content).toContain('/reports/system/overdue');
    expect(content).toContain('/reports/system/export');
  });

  it('staff.ts không còn mock ca trực và mock-daily-tasks.json đã được xóa', () => {
    const filePath = path.resolve(process.cwd(), 'src/api/staff.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    const mockPath = path.resolve(process.cwd(), 'src/mock/mock-daily-tasks.json');
    expect(content).not.toContain('mock-daily-tasks.json');
    expect(content).not.toContain('isMockEnabled');
    expect(content).not.toContain('updateTaskStatusInSession');
    expect(content).not.toContain('DAMAGED_UNIT');
    expect(content).not.toContain('Math.random');
    expect(content).toContain('/reports/staff/${staffId}/daily-tasks');
    expect(fs.existsSync(mockPath)).toBe(false);
  });

  it('customerApi.ts không còn fallback Storage Locker', () => {
    const filePath = path.resolve(process.cwd(), 'src/features/customer/api/customerApi.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('Storage Locker');
  });
});
