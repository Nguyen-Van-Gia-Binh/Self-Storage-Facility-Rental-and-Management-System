import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, ShieldCheck, Phone, Mail, X } from 'lucide-react';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

interface HomeFooterProps {
  facilities: DisplayFacility[];
  onScrollToId: (id: string) => void;
}

type PolicyModalKey = 'cancel' | 'pccc' | 'checkin' | null;

const POLICY_MODAL_CONTENT: Record<
  Exclude<PolicyModalKey, null>,
  { title: string; bullets: string[] }
> = {
  cancel: {
    title: 'Chính sách hủy đặt chỗ & hoàn tiền cọc',
    bullets: [
      'Hủy đơn đặt chỗ trước ngày bắt đầu từ 7 ngày trở lên: hoàn 100% tiền thuê và 100% tiền cọc.',
      'Hủy từ 2 đến 6 ngày (≥ 48 giờ và < 7 ngày): hoàn 100% tiền thuê và 50% tiền cọc.',
      'Hủy sát ngày nhận (< 48 giờ): hoàn 100% tiền thuê và không hoàn cọc.',
      'Khi đang thuê kho: gửi yêu cầu trả kho trước 30 ngày để nhận lại 100% tiền cọc sau nghiệm thu.',
    ],
  },
  pccc: {
    title: 'Quy định PCCC & Hàng hóa không nhận lưu trữ',
    bullets: [
      'Không lưu trữ chất dễ cháy nổ (xăng dầu, bình gas, pháo, hóa chất độc hại), hàng cấm theo pháp luật.',
      'Không chứa động vật sống hoặc thực phẩm tươi sống dễ phân hủy gây mùi.',
      'Tất cả cơ sở được trang bị bình chữa cháy, đầu báo khói và hệ thống vòi phun Sprinkler tự động.',
    ],
  },
  checkin: {
    title: 'Hướng dẫn nhận kho & Sử dụng mã PIN',
    bullets: [
      'Sau khi thanh toán đơn đặt chỗ qua VNPay, Quản lý cơ sở sẽ gán ô kho vật lý đúng hạng đã đặt.',
      'Khách hàng có thể tự Check-in Online trên mục "Kho của tôi" hoặc tới quầy để nhân viên hỗ trợ bàn giao.',
      'Sau khi ký xác nhận bàn giao, mã PIN 6 số riêng tư sẽ được kích hoạt ngay lập tức.',
    ],
  },
};

/**
 * Footer đồng bộ 100% tiếng Việt, số Hotline 1900 8888 chuẩn CustomerLayout và không có link chết.
 */
export const HomeFooter: React.FC<HomeFooterProps> = ({ facilities, onScrollToId }) => {
  const [policyModal, setPolicyModal] = useState<PolicyModalKey>(null);
  const activePolicyContent = policyModal ? POLICY_MODAL_CONTENT[policyModal] : null;

  return (
    <>
      <footer className="bg-gradient-to-b from-[#125449] to-[#0e3f37] text-teal-100/80 border-t border-teal-700/50">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          {/* Cột 1: Thương hiệu */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200">
                <Warehouse className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                SmartStorage<span className="text-emerald-200">.vn</span>
              </span>
            </div>
            <p className="text-teal-100/80 text-xs leading-relaxed">
              Hệ thống cho thuê kho tự quản sạch đẹp, minh bạch giá cước và quản lý hợp đồng trực tuyến tại Hà Nội &amp; TP. Hồ Chí Minh.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-100/90">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Bảo vệ hàng hóa cơ bản 10tr · Mở rộng 50tr</span>
            </div>
          </div>

          {/* Cột 2: Mạng lưới cơ sở thật */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Mạng lưới cơ sở
            </h4>
            <ul className="space-y-2 text-xs">
              {facilities.length > 0 ? (
                facilities.slice(0, 4).map((fac) => (
                  <li key={fac.id}>
                    <Link
                      to={`/customer/units?facility=${fac.id}`}
                      className="hover:text-white transition-colors"
                    >
                      {fac.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => onScrollToId('branches')}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Cơ sở Cầu Giấy - Hà Nội
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onScrollToId('branches')}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Cơ sở Quận 7 - TP.HCM
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onScrollToId('branches')}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      Cơ sở Quận 1 - TP.HCM
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Cột 3: Dịch vụ & Hỗ trợ khách hàng */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Dịch vụ &amp; Cổng khách hàng
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToId('unit-types')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Kho Tiêu Chuẩn &amp; Kho Máy Lạnh
                </button>
              </li>
              <li>
                <Link to="/customer/my-units" className="hover:text-white transition-colors">
                  Quản lý Kho của tôi &amp; Mã PIN
                </Link>
              </li>
              <li>
                <Link to="/customer/support" className="hover:text-white transition-colors">
                  Gửi yêu cầu hỗ trợ / Sự cố
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onScrollToId('faqs')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Câu hỏi thường gặp
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 4: Quy định & Liên hệ */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
              Quy định &amp; Liên hệ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('cancel')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Chính sách hủy &amp; hoàn tiền cọc
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('pccc')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Quy định PCCC &amp; Hàng cấm gửi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('checkin')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Hướng dẫn nhận kho &amp; Check-in
                </button>
              </li>
            </ul>
            <div className="pt-2 text-xs space-y-1.5 border-t border-teal-700/50">
              <a
                href="tel:19008888"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  Hotline: <strong className="text-white">1900 8888</strong>
                </span>
              </a>
              <a
                href="mailto:support@smartstorage.vn"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-300" />
                <span>support@smartstorage.vn</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-teal-700/50 py-5">
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-teal-200/75">
            <p>© 2026 SmartStorage Vietnam. Hệ thống quản lý &amp; cho thuê kho tự quản.</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPolicyModal('cancel')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Điều khoản hoàn cọc
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setPolicyModal('pccc')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                An toàn PCCC
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal xem nhanh quy định */}
      {activePolicyContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setPolicyModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-[#0a1614]">{activePolicyContent.title}</h3>
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                aria-label="Đóng"
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-disc pl-4">
              {activePolicyContent.bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                className="px-4 py-2 rounded-xl bg-[#57b29a] hover:bg-[#439782] text-white text-xs font-semibold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

