import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Pagination } from '../Pagination';

const cleanHtml = (html: string) => html.replace(/<!-- -->/g, '');

describe('Pagination component', () => {
  it('không hiển thị (return null) khi totalItems <= threshold', () => {
    const html = renderToString(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={10}
        pageSize={12}
        threshold={12}
        onPageChange={() => {}}
      />
    );
    expect(html).toBe('');
  });

  it('hiển thị đầy đủ nút trang và nhãn số lượng khi totalItems > threshold', () => {
    const html = cleanHtml(
      renderToString(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={55}
          pageSize={12}
          threshold={12}
          itemName="cơ sở"
          onPageChange={() => {}}
        />
      )
    );
    // Chuỗi hiển thị số lượng
    expect(html).toContain('Hiển thị');
    expect(html).toContain('55');
    // Có các nút trang 1, 2, 3...
    expect(html).toContain('1');
    expect(html).toContain('5');
  });

  it('hiển thị thanh điều hướng và dropdown pageSize khi showAlways=true dù chỉ có 1 trang', () => {
    const html = cleanHtml(
      renderToString(
        <Pagination
          currentPage={1}
          totalPages={1}
          totalItems={3}
          pageSize={12}
          pageSizeOptions={[6, 12, 24]}
          onPageSizeChange={() => {}}
          showAlways={true}
          itemName="cơ sở"
          onPageChange={() => {}}
        />
      )
    );
    expect(html).toContain('Hiển thị');
    expect(html).toContain('3');
    expect(html).toContain('cơ sở');
    expect(html).toContain('12 / trang');
  });
});
