import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFacilityCardProps {
  facility: DisplayFacility;
}

/**
 * Thẻ hiển thị cơ sở kho trên HomePage 
 */
export const HomeFacilityCard: React.FC<HomeFacilityCardProps> = ({ facility: fac }) => {
  return (
    <div
      key={fac.id}
      className="w-full sm:w-[350px] lg:w-[380px] max-w-md bg-white rounded-2xl border border-brand-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        {/* Khung ảnh & Tag mã cơ sở */}
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

      {/* Footer: Giá thuê & Nút xem kho trống */}
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
  );
};
