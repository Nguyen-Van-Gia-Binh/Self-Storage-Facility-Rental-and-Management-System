// frontend/src/features/bom/utils/exportFacilityCsv.ts
import type { FacilityListItem } from '@/types';

/**
 * Xuất danh sách cơ sở ra file CSV chuẩn UTF-8 (kèm BOM để mở trực tiếp trên Excel không bị lỗi font tiếng Việt).
 * Zero-dependency theo nguyên tắc /ponytail.
 */
export function exportFacilityCsv(facilities: FacilityListItem[], filenamePrefix = 'danh-sach-co-so'): void {
  const headers = [
    'Mã cơ sở',
    'Tên cơ sở',
    'Địa chỉ',
    'Số điện thoại',
    'Giờ mở cửa',
    'Trạng thái',
    'Số loại ô kho',
    'Ngày tạo',
  ];

  const escapeCsv = (val?: string | number | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = facilities.map((f) => [
    escapeCsv(f.code || `#${f.id}`),
    escapeCsv(f.name),
    escapeCsv(f.address),
    escapeCsv(f.phone || 'Chưa cập nhật'),
    escapeCsv(f.openingHours || 'Chưa cập nhật'),
    escapeCsv(f.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'),
    escapeCsv(f.activeUnitTypeCount ?? 0),
    escapeCsv(f.createdAt ? new Date(f.createdAt).toLocaleDateString('vi-VN') : ''),
  ]);

  // \uFEFF là Byte Order Mark (BOM) giúp Excel nhận diện mã hóa UTF-8
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;

  link.href = url;
  link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
