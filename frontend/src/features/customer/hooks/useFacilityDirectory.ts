import { useState, useEffect } from 'react';
import { fetchFacilities } from '@/api/facility';

export interface DisplayFacility {
  id: number | string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  startingPrice: number | null;
  openingHours: string;
  image: string;
  phone: string;
  description?: string;
  activeUnitTypeCount?: number;
}

export const FACILITY_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565610222536-ef125c59da2c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
];

/**
 * Trích xuất Tỉnh/Thành phố từ địa chỉ
 */
export function parseCity(address: string): string {
  if (!address) return 'TP. Hồ Chí Minh';
  if (address.includes('Hà Nội')) return 'Hà Nội';
  if (address.includes('TP.HCM') || address.includes('Hồ Chí Minh')) return 'TP. Hồ Chí Minh';
  if (address.includes('Đà Nẵng')) return 'Đà Nẵng';
  if (address.includes('Bình Dương')) return 'Bình Dương';
  return 'TP. Hồ Chí Minh';
}

/**
 * Trích xuất Quận/Huyện từ địa chỉ
 */
export function parseDistrict(address: string): string {
  if (!address) return 'Khu vực trung tâm';
  const match = address.match(/(Quận\s[\wÀ-ỹ0-9]+|Huyện\s[\wÀ-ỹ0-9]+|TP\.\s[\wÀ-ỹ0-9]+|Cầu Giấy|Đống Đa|Thanh Xuân|Hai Bà Trưng|Hải Châu|Bình Thạnh|Thủ Đức)/u);
  return match ? match[0] : 'Khu vực trung tâm';
}

/**
 * Custom Hook tải và ánh xạ danh mục cơ sở kho từ Backend API
 */
export function useFacilityDirectory() {
  const [facilities, setFacilities] = useState<DisplayFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchFacilities()
      .then((data) => {
        if (!ignore && data) {
          const mapped: DisplayFacility[] = data.map((f, idx) => ({
            id: f.id,
            code: f.code || `FAC-${f.id}`,
            name: f.name,
            address: f.address,
            city: parseCity(f.address),
            district: parseDistrict(f.address),
            startingPrice: f.lowestMonthlyPrice && f.lowestMonthlyPrice > 0 ? f.lowestMonthlyPrice : null,
            openingHours: f.openingHours || 'Mở cửa 24/7',
            image: FACILITY_IMAGES[idx % FACILITY_IMAGES.length],
            phone: f.phone || '',
            description: f.description,
            activeUnitTypeCount: f.activeUnitTypeCount || 4,
          }));
          setFacilities(mapped);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách cơ sở:', err);
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { facilities, isLoading };
}
