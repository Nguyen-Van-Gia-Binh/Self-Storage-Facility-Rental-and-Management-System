/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * ISS-113: Tái thiết kế Custom Dropdown Thành phố trên HomePage
 * Người thực hiện: Xuân Nhi (WS1 - Khách hàng & Đặt chỗ)
 */
describe('ISS-113: Custom Dropdown Thành phố trên HomePage (Real DB Data)', () => {
  const homePagePath = path.resolve(
    process.cwd(),
    'src/features/customer/pages/HomePage.tsx'
  );
  const homeSearchBarPath = path.resolve(
    process.cwd(),
    'src/features/customer/components/HomeSearchBar.tsx'
  );
  const getDropdownContent = () => {
    return fs.existsSync(homeSearchBarPath)
      ? fs.readFileSync(homeSearchBarPath, 'utf-8')
      : fs.readFileSync(homePagePath, 'utf-8');
  };

  it('HomePage không sử dụng thẻ select thô sơ mặc định của trình duyệt', () => {
    const content = getDropdownContent();
    expect(content).not.toMatch(/<select[\s\S]*?availableCities/);
  });

  it('HomePage sử dụng custom dropdown tương tác với state isCityDropdownOpen và ref click outside', () => {
    const content = getDropdownContent();
    expect(content).toMatch(/isCityDropdownOpen/);
    expect(content).toMatch(/cityDropdownRef/);
    expect(content).toMatch(/handleClickOutside/);
  });

  it('Custom dropdown trích xuất danh sách tỉnh thành và đếm số lượng cơ sở trực tiếp từ CSDL thật', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    expect(content).toMatch(/availableCities = useMemo\(\(\) => \{[\s\S]*?facilities\.map/);
    expect(content).toMatch(/cityFacilityCounts = useMemo\(\(\) => \{/);
  });

  it('Custom dropdown panel hỗ trợ ARIA listbox và hiển thị icon check khi được chọn', () => {
    const content = getDropdownContent();
    expect(content).toMatch(/role="listbox"/);
    expect(content).toMatch(/role="option"/);
    expect(content).toMatch(/<Check\s/);
  });
});
