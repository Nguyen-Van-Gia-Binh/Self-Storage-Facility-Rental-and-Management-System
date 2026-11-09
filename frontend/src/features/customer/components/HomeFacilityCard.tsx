import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Phone } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFacilityCardProps {
  facility: DisplayFacility;
  index?: number;
}

/**
 * Thẻ hiển thị cơ sở kho trên HomePage — Chuẩn Dub.co SaaS & Modern Logistics
 */
export const HomeFacilityCard: React.FC<HomeFacilityCardProps> = ({ facility: fac, index = 0 }) => {
  const isFeatured = index === 1; // Cơ sở trọng điểm (thẻ thứ 2) viền xanh nổi bật theo prototype

  // Quy mô diện tích sàn minh họa theo từng chi nhánh
  const floorAreas = ['2.400 m²', '4.500 m²', '3.100 m²', '2.800 m²', '3.600 m²', '5.000 m²'];
  const floorArea = floorAreas[index % floorAreas.length];

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between group ${
        isFeatured
          ? 'border-2 border-[#57b29a] shadow-md hover:shadow-lg hover:-translate-y-1'
          : 'border border-slate-200 shadow-sm hover:shadow-md hover:border-[#57b29a]/50 hover:-translate-y-1'
      }`}
    >
      <div>
        {/* Khung ảnh */}
        <div className="relative h-52 overflow-hidden bg-slate-100">
          <img
            src={fac.image || '/assets/landing/facility.jpg'}
            alt={fac.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Nội dung thông tin cơ sở */}
        <div className="p-6">
          <h3 className="font-bold text-base text-[#0a1614] mb-1 group-hover:text-[#57b29a] transition-colors line-clamp-1">
            {fac.name}
          </h3>

          <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-3 leading-relaxed">
            <MapPin className="w-4 h-4 text-[#57b29a] shrink-0 mt-0.5" />
            <span className="line-clamp-2">{fac.address}</span>
          </p>

          {/* Bảng thông số kỹ thuật (SaaS specs box theo đúng thiết kế landing_page) */}
          <div className="space-y-1.5 text-xs text-slate-600 bg-[#f2f9f7] p-3.5 rounded-xl mb-4 border border-slate-200/70 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Diện tích sàn:</span>
              <span className="font-semibold text-[#0a1614]">{floorArea}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Loại kho:</span>
              <span className="font-semibold text-[#0a1614]">Tiêu Chuẩn &amp; Máy Lạnh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Giờ mở cửa:</span>
              <span className="font-semibold text-emerald-700">{fac.openingHours || '24/7 Smart Access'}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
              <span className="text-slate-500">Giá thuê từ:</span>
              <span className="font-bold text-[#57b29a]">
                {fac.startingPrice ? `${formatVND(fac.startingPrice)}/tháng` : 'Liên hệ tư vấn'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons chân card: Gọi tư vấn & Thuê kho ngay */}
      <div className="px-6 pb-6 pt-0 flex gap-2">
        <a
          className="flex-1 text-center py-2.5 px-3 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          href={fac.phone ? `tel:${fac.phone}` : 'tel:19008899'}
        >
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>Gọi tư vấn</span>
        </a>
        <Link
          to={`/customer/units?facility=${fac.id}`}
          className={`flex-1 text-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
            isFeatured
              ? 'bg-[#57b29a] hover:bg-[#439782] text-white active:scale-[0.98]'
              : 'bg-[#0a1614] hover:bg-slate-800 text-white active:scale-[0.98]'
          }`}
        >
          <span>Thuê kho ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
