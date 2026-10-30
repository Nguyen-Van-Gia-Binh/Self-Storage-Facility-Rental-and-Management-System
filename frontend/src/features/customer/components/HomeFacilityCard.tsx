import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFacilityCardProps {
  facility: DisplayFacility;
}

/**
 * Thẻ hiển thị cơ sở kho trên HomePage - Chuẩn Human-Centered UI
 * Toàn bộ card là link bấm được, loại bỏ nút thừa và mã FAC-* kỹ thuật
 */
export const HomeFacilityCard: React.FC<HomeFacilityCardProps> = ({ facility: fac }) => {
  return (
    <Link
      to={`/customer/units?facility=${fac.id}`}
      key={fac.id}
      className="w-full sm:w-[350px] lg:w-[380px] max-w-md bg-white rounded-2xl border border-brand-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer block"
    >
      <div>
        {/* Khung ảnh & Tag trạng thái thực tế */}
        <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
          <img
            src={fac.image}
            alt={fac.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Giờ mở cửa */}
          <div className="absolute top-3 left-3 bg-[#0a1614]/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <Clock className="w-3 h-3 text-brand-400" />
            <span>{fac.openingHours}</span>
          </div>

          {/* Trạng thái kho thực tế thay cho mã FAC-* kỹ thuật */}
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Đang có kho trống</span>
          </div>
        </div>

        {/* Nội dung thông tin cơ sở */}
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

      {/* Footer: Giá thuê & Lời gọi hành động tinh tế */}
      <div className="p-5 pt-0">
        <div className="pt-3 border-t border-brand-100/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Giá thuê từ</span>
            {fac.startingPrice != null ? (
              <div className="flex items-baseline gap-1">
                <strong className="text-base font-black text-brand-700 font-mono">
                  {formatVND(fac.startingPrice)}
                </strong>
                <span className="text-xs text-slate-500 font-medium">/tháng</span>
              </div>
            ) : (
              <strong className="text-xs font-bold text-slate-500">Liên hệ báo giá</strong>
            )}
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700 transition-colors">
            <span>Xem kho trống</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};
