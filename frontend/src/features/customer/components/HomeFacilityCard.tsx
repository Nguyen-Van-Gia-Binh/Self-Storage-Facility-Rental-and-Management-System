import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Phone, Clock, Navigation } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFacilityCardProps {
  facility: DisplayFacility;
}

/**
 * Thẻ cơ sở gọn gàng: ảnh, địa chỉ, Google Maps, giờ mở cửa và giá khởi điểm.
 */
export const HomeFacilityCard: React.FC<HomeFacilityCardProps> = ({ facility: fac }) => {
  const unitPickerHref = `/customer/units?facility=${String(fac.id)}`;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fac.address || fac.name
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/95 shadow-xs hover:shadow-lg hover:border-sky-300/80 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Ảnh cơ sở + Nhãn khu vực */}
        <div className="relative h-44 overflow-hidden bg-slate-100">
          <img
            src={fac.image || '/assets/landing/facility.jpg'}
            alt={fac.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-[#0c5a8a] shadow-xs backdrop-blur-sm">
              {fac.city}
            </span>
          </div>
        </div>

        {/* Nội dung thông tin cơ sở */}
        <div className="p-5 space-y-3.5">
          <div>
            <h3 className="font-bold text-lg text-[#0a1614] mb-1.5 group-hover:text-[#0c5a8a] transition-colors line-clamp-1">
              {fac.name}
            </h3>

            <p className="text-[13px] text-slate-700 flex items-start gap-1.5 leading-relaxed min-h-[2.6rem]">
              <MapPin className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span className="line-clamp-2">{fac.address}</span>
            </p>
          </div>

          {/* Thông số thực tế */}
          <div className="space-y-2 text-[13px] bg-[#f3f8fc] p-3.5 rounded-xl border border-sky-200/60">
            <div className="flex justify-between items-center gap-2">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-slate-500" /> Giờ mở cửa
              </span>
              <span className="font-semibold text-[#0a1614]">
                {fac.openingHours || '06:00 - 22:00'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-sky-200/60">
              <span className="text-slate-700 font-medium">Giá thuê từ</span>
              <span className="font-bold text-[#0c5a8a] text-base">
                {fac.startingPrice ? `${formatVND(fac.startingPrice)}/tháng` : 'Xem bảng giá'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-5 pt-0 flex gap-2">
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 border border-slate-300 rounded-xl text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          title="Mở chỉ đường trên Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-[#0284c7]" />
          <span>Bản đồ</span>
        </a>
        <a
          className="py-2.5 px-3 border border-slate-300 rounded-xl text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          href={fac.phone ? `tel:${fac.phone}` : 'tel:19008888'}
          title={`Gọi ${fac.phone || '1900 8888'}`}
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>Gọi</span>
        </a>
        <Link
          to={unitPickerHref}
          className="flex-1 text-center py-2.5 px-3.5 rounded-xl text-[13px] font-bold bg-[#0c5a8a] hover:bg-[#084369] text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
        >
          <span>Chọn ô kho</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
