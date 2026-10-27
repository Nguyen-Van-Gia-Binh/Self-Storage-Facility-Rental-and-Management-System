import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

describe('Customer Portal: Table Pagination (MyUnits & Support Tickets)', () => {
  const myUnitsTablePath = path.resolve(
    process.cwd(),
    'src/features/customer/components/MyUnitsTable.tsx'
  );
  const supportTicketTablePath = path.resolve(
    process.cwd(),
    'src/features/customer/components/SupportTicketTable.tsx'
  );

  it('MyUnitsTable.tsx cấu hình pageSize mặc định là 7 và có logic phân trang', () => {
    const content = fs.readFileSync(myUnitsTablePath, 'utf-8');
    expect(content).toMatch(/pageSize\s*=\s*7/);
    expect(content).toMatch(/paginatedItems/);
    expect(content).toMatch(/totalPages/);
    expect(content).toContain('trên tổng số');
    expect(content).toContain('ô kho');
  });

  it('SupportTicketTable.tsx cấu hình pageSize mặc định là 7 và có logic phân trang', () => {
    const content = fs.readFileSync(supportTicketTablePath, 'utf-8');
    expect(content).toMatch(/pageSize\s*=\s*7/);
    expect(content).toMatch(/paginatedTickets/);
    expect(content).toMatch(/totalPages/);
    expect(content).toContain('trên tổng số');
    expect(content).toContain('vé');
  });
});
