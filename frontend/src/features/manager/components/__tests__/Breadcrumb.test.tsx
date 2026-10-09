import { describe, it, expect } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb component', () => {
  it('1. Render đầy đủ các cấp và biểu tượng chevron ngăn cách', () => {
    const items = [
      { label: 'Cơ sở Cầu Giấy', to: '/manager/facilities/1' },
      { label: 'Kho Nhỏ (4m²)', to: '/manager/facilities/1/unit-types/10' },
      { label: 'Ô CG-S101' },
    ];

    const html = renderToString(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>
    );

    expect(html).toContain('Quản lý ô kho');
    expect(html).toContain('Cơ sở Cầu Giấy');
    expect(html).toContain('Kho Nhỏ (4m²)');
    expect(html).toContain('Ô CG-S101');
    expect(html).toContain('/manager/facilities/1');
  });

  it('2. Cấp cuối cùng là text in đậm và không chứa thẻ link href', () => {
    const items = [
      { label: 'Cơ sở Quận 7', to: '/manager/facilities/2' },
      { label: 'Kho Vừa' },
    ];

    const html = renderToString(
      <MemoryRouter>
        <Breadcrumb items={items} />
      </MemoryRouter>
    );

    expect(html).toContain('Kho Vừa');
    expect(html).toContain('font-semibold text-slate-900');
  });
});
