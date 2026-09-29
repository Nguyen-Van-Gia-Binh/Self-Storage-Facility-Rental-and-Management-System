import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowRight, ChevronDown, ShieldCheck, Clock, Thermometer, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchFacilities } from '@/api/facility';
import { formatVND } from '../utils/pricing';

interface DisplayFacility {
  id: number | string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  startingPrice: number;
  openingHours: string;
  image: string;
  phone: string;
  description?: string;
  activeUnitTypeCount?: number;
}

const FACILITY_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549194388-f61be84a6e9e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565610222536-ef125c59da2c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
];

function parseCity(address: string): string {
  if (address.includes('Hà Nội')) return 'Hà Nội';
  if (address.includes('TP.HCM') || address.includes('Hồ Chí Minh')) return 'TP. Hồ Chí Minh';
  if (address.includes('Đà Nẵng')) return 'Đà Nẵng';
  if (address.includes('Bình Dương')) return 'Bình Dương';
  return 'TP. Hồ Chí Minh';
}

function parseDistrict(address: string): string {
  const match = address.match(/(Quận\s[\wÀ-ỹ0-9]+|Huyện\s[\wÀ-ỹ0-9]+|TP\.\s[\wÀ-ỹ0-9]+|Cầu Giấy|Đống Đa|Thanh Xuân|Hai Bà Trưng|Hải Châu|Bình Thạnh)/u);
  return match ? match[0] : 'Khu vực trung tâm';
}

export const HomePage: React.FC = () => {
  const [facilities, setFacilities] = useState<DisplayFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tất cả quận / huyện');

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
            startingPrice: f.lowestMonthlyPrice || 500000,
            openingHours: f.openingHours || '06:00–22:00',
            image: FACILITY_IMAGES[idx % FACILITY_IMAGES.length],
            phone: f.phone || '1900 8888',
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

  // Trích xuất danh sách Thành phố từ dữ liệu cơ sở thật
  const availableCities = useMemo(() => {
    const set = new Set(facilities.map(f => f.city));
    return ['Tất cả thành phố', ...Array.from(set)];
  }, [facilities]);

  const availableDistricts = useMemo(() => {
    const relevant = selectedCity === 'Tất cả thành phố' 
      ? facilities 
      : facilities.filter(f => f.city === selectedCity);
    const districts = relevant.map(f => f.district);
    return ['Tất cả quận / huyện', ...Array.from(new Set(districts))];
  }, [facilities, selectedCity]);

  // Lọc cơ sở theo Thành phố và Quận
  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchCity = selectedCity === 'Tất cả thành phố' || f.city === selectedCity;
      const matchDistrict = selectedDistrict === 'Tất cả quận / huyện' || f.district === selectedDistrict;
      return matchCity && matchDistrict;
    });
  }, [facilities, selectedCity, selectedDistrict]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-1">
        <span className="text-[11px] font-bold text-[#7c94c3] bg-[#7c94c3]/12 px-3 py-1 rounded-full uppercase tracking-wider">
          Mạng Lưới Kho Tự Quản Thông Minh (Smart Storage)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a1614] tracking-tight">
          Tìm Cơ Sở Kho Tự Quản Gần Bạn Nhất
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Lựa chọn cơ sở lưu trữ tại TP.HCM, Hà Nội hoặc Đà Nẵng để tra cứu các kích thước ô kho còn trống, chế độ máy lạnh bảo quản đồ đạc và bảng giá niêm yết minh bạch.
        </p>
      </div>

      {/* Search & Filter Bar (SCR-SC-01) */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-3 shadow-xs border border-slate-200/90 grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center">
        {/* City Filter */}
        <div className="md:col-span-2 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-brand-50/50 border border-slate-200 relative">
          <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
          <div className="flex-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">THÀNH PHỐ</span>
            <select 
              value={selectedCity} 
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedDistrict('Tất cả quận / huyện');
              }}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#0a1614] focus:outline-none w-full cursor-pointer appearance-none pr-5"
            >
              {availableCities.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3" />
        </div>

        {/* District Filter */}
        <div className="md:col-span-2 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-brand-50/50 border border-slate-200 relative">
          <Search className="w-4 h-4 text-brand-500 shrink-0" />
          <div className="flex-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QUẬN / HUYỆN</span>
            <select 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#0a1614] focus:outline-none w-full cursor-pointer appearance-none pr-5"
            >
              {availableDistricts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3" />
        </div>

        {/* Search CTA */}
        <Button 
          variant="primary" 
          size="md"
          className="md:col-span-1 h-full py-2.5 text-xs sm:text-sm font-bold shadow-xs"
        >
          Tìm Kiếm
        </Button>
      </div>

      {/* Facilities Directory Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#0a1614] tracking-tight">
                {selectedCity === 'Tất cả thành phố' 
                  ? 'Tất cả cơ sở toàn quốc' 
                  : `Cơ sở tại ${selectedDistrict === 'Tất cả quận / huyện' ? selectedCity : selectedDistrict}`}
              </h2>
              <Badge variant="accent" className="text-[10px] px-2 py-0.5">
                {filteredFacilities.length} Cơ sở khả dụng
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Chọn cơ sở bên dưới để xem kích thước ô kho và đặt chỗ trực tuyến.
            </p>
          </div>
        </div>

        {/* Facilities Grid or Loading */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách cơ sở từ hệ thống...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredFacilities.map((fac) => (
              <Card key={fac.id} className="overflow-hidden border-slate-200/90 rounded-xl bg-white flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div>
                  {/* Facility Image */}
                  <div className="h-40 w-full overflow-hidden bg-slate-100 relative">
                    <img 
                      src={fac.image} 
                      alt={fac.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#0a1614]/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand-400" /> {fac.openingHours}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-brand-600/90 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {fac.code}
                    </span>
                  </div>

                  {/* Facility Info */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-[#0a1614] line-clamp-1">
                      {fac.name}
                    </h3>
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{fac.address}</span>
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px] text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-[#96b3cf]/12 text-[#1e3a5f] px-2 py-0.5 rounded-md">
                        <Thermometer className="w-3 h-3 text-[#96b3cf]" /> Điều hòa nhiệt độ
                      </span>
                      <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3 h-3 text-brand-500" /> Khóa thông minh IoT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & CTA Button */}
                <div className="p-4 pt-0 space-y-3">
                  <div className="pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Giá thuê khởi điểm:</span>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Từ </span>
                      <strong className="text-base font-extrabold text-brand-600">{formatVND(fac.startingPrice)}</strong>
                      <span className="text-xs text-slate-500">/tháng</span>
                    </div>
                  </div>

                  <Link to={`/customer/units?facility=${fac.id}`} className="w-full block">
                    <Button variant="primary" size="sm" className="w-full py-2 gap-1.5 font-semibold text-xs rounded-lg">
                      <span>Xem kho trống & Đặt chỗ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
