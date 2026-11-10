import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Phone, Clock, Layers } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFacilityCardProps {
  facility: DisplayFacility;
}

/**
 * Thẻ hiển thị cơ sở kho thực tế từ API — minh bạch giờ mở cửa, giá khởi điểm và số hạng kho.
 */
export const HomeFacilityCard: React.FC<HomeFacilityCardProps> = ({ facility: fac }) => {
  const unitPickerHref = `/customer/units?facility=${String(fac.id)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#57b29a]/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Ảnh cơ sở + Nhãn khu vực */}
        <div className="relative h-36 overflow-hidden bg-slate-100">
          <img
            src={fac.image || '/assets/landing/facility.jpg'}
            alt={fac.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#125449] shadow-xs backdrop-blur-sm">
              {fac.city}
            </span>
          </div>
          {fac.activeUnitTypeCount !== undefined && fac.activeUnitTypeCount > 0 && (
            <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#125449]/85 text-white backdrop-blur-sm">
              <Layers className="w-3 h-3 text-emerald-200" />
              {fac.activeUnitTypeCount} hạng kho đang mở
            </span>
          )}
        </div>

        {/* Nội dung thông tin cơ sở */}
        <div className="p-5">
          <h3 className="font-bold text-base text-[#0a1614] mb-1.5 group-hover:text-[#439782] transition-colors line-clamp-1">
            {fac.name}
          </h3>

          <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-4 leading-relaxed min-h-[2.4rem]">
            <MapPin className="w-3.5 h-3.5 text-[#57b29a] shrink-0 mt-0.5" />
            <span className="line-clamp-2">{fac.address}</span>
          </p>

          {/* Thông số thực tế từ Backend */}
          <div className="space-y-2 text-xs bg-[#f2f9f7] p-3.5 rounded-xl border border-slate-200/70">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Giờ mở cửa
              </span>
              <span className="font-semibold text-[#0a1614]">
                {fac.openingHours || '06:00 - 22:00'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-500">Giá thuê từ</span>
              <span className="font-bold text-[#439782] text-sm">
                {fac.startingPrice ? `${formatVND(fac.startingPrice)}/tháng` : 'Xem bảng giá'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-5 pt-0 flex gap-2">
        <a
          className="py-2.5 px-3 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          href={fac.phone ? `tel:${fac.phone}` : 'tel:19008888'}
          title={`Gọi ${fac.phone || '1900 8888'}`}
        >
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>Gọi</span>
        </a>
        <Link
          to={unitPickerHref}
          className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#57b29a] hover:bg-[#439782] text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
        >
          <span>Xem phòng trống</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
