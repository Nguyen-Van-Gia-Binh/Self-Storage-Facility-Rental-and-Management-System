import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowRight, ChevronDown, Clock, Loader2, Sparkles, X } from 'lucide-react';
import { fetchFacilities } from '@/api/facility';
import { formatVND } from '../utils/pricing';

interface DisplayFacility {
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
  if (!address) return 'TP. Hồ Chí Minh';
  if (address.includes('Hà Nội')) return 'Hà Nội';
  if (address.includes('TP.HCM') || address.includes('Hồ Chí Minh')) return 'TP. Hồ Chí Minh';
  if (address.includes('Đà Nẵng')) return 'Đà Nẵng';
  if (address.includes('Bình Dương')) return 'Bình Dương';
  return 'TP. Hồ Chí Minh';
}

function parseDistrict(address: string): string {
  if (!address) return 'Khu vực trung tâm';
  const match = address.match(/(Quận\s[\wÀ-ỹ0-9]+|Huyện\s[\wÀ-ỹ0-9]+|TP\.\s[\wÀ-ỹ0-9]+|Cầu Giấy|Đống Đa|Thanh Xuân|Hai Bà Trưng|Hải Châu|Bình Thạnh|Thủ Đức)/u);
  return match ? match[0] : 'Khu vực trung tâm';
}

export const HomePage: React.FC = () => {
  const [facilities, setFacilities] = useState<DisplayFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Trích xuất danh sách Thành phố từ dữ liệu cơ sở thật
  const availableCities = useMemo(() => {
    const set = new Set(facilities.map((f) => f.city));
    return ['Tất cả thành phố', ...Array.from(set)];
  }, [facilities]);

  // Lọc cơ sở theo Thành phố và Search Query
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCity = selectedCity === 'Tất cả thành phố' || f.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q);
      return matchCity && matchQuery;
    });
  }, [facilities, selectedCity, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* HERO BANNER: INTENTIONAL MINIMALISM */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
            Hệ Thống Kho Tự Quản Thông Minh 24/7
          </span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a1614] tracking-tight">
          Chọn Cơ Sở Kho Gần Bạn Nhất
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
          Hệ thống ô kho tự quản an toàn, kiểm soát ra vào bằng mã PIN điện tử, bảo quản đồ đạc tiêu chuẩn và máy lạnh cao cấp.
        </p>
      </div>

      {/* SEARCH & FILTER BAR: UNIFIED SEAMLESS BAR */}
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="bg-white rounded-2xl p-2 shadow-xs hover:shadow-sm border border-brand-200/80 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 transition-all focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/10">
          
          {/* City Filter Segment */}
          <div className="flex items-center gap-3 px-3.5 py-2 sm:w-64 hover:bg-slate-50/70 rounded-xl transition-colors relative cursor-pointer group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                Khu vực
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-[#0a1614] focus:outline-none w-full cursor-pointer appearance-none pr-4 truncate"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-slate-600" />
          </div>

          {/* Text Search Segment */}
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm theo tên cơ sở, đường phố, quận huyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium text-[#0a1614] placeholder:text-slate-400 focus:outline-none bg-transparent py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Quick City Filter Pills */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
          {availableCities.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 hover:border-brand-300'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* FACILITIES DIRECTORY */}
      <div className="space-y-6">
        
        <div className="flex items-center gap-3 border-b border-brand-200/60 pb-3">
          <h2 className="text-xl font-extrabold text-[#0a1614] tracking-tight">
            {selectedCity === 'Tất cả thành phố' ? 'Tất cả cơ sở' : `Cơ sở tại ${selectedCity}`}
          </h2>
          <span className="text-xs font-bold text-brand-700 bg-brand-100/70 border border-brand-200 px-2.5 py-0.5 rounded-full">
            {filteredFacilities.length} cơ sở
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải dữ liệu cơ sở thật từ hệ thống...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-brand-200 p-8 space-y-3">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy cơ sở phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vui lòng thử chọn thành phố khác hoặc xóa từ khóa tìm kiếm để xem tất cả cơ sở.
            </p>
          </div>
        ) : (
          /* Cards Grid: Centered Flex Layout for balanced aesthetics */
          <div className="flex flex-wrap justify-center gap-6">
            {filteredFacilities.map((fac) => (
              <div
                key={fac.id}
                className="w-full sm:w-[350px] lg:w-[380px] max-w-md bg-white rounded-2xl border border-brand-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Image */}
                  <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={fac.image}
                      alt={fac.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#0a1614]/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3 h-3 text-brand-400" />
                      <span>{fac.openingHours}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-brand-600 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-xs">
                      {fac.code}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-extrabold text-[#0a1614] group-hover:text-brand-700 transition-colors line-clamp-1">
                      {fac.name}
                    </h3>

                    <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{fac.address}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Price & CTA Button */}
                <div className="p-5 pt-0 space-y-3.5">
                  <div className="pt-3 border-t border-brand-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Giá thuê từ:</span>
                    <div className="text-right">
                      {fac.startingPrice != null ? (
                        <>
                          <strong className="text-base font-black text-brand-700 font-mono">
                            {formatVND(fac.startingPrice)}
                          </strong>
                          <span className="text-xs text-slate-500 font-medium">/tháng</span>
                        </>
                      ) : (
                        <strong className="text-xs font-bold text-slate-500">Liên hệ báo giá</strong>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/customer/units?facility=${fac.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Xem kho trống & Đặt chỗ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
