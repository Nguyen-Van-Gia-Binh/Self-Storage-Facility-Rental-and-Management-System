import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';

export interface CustomerFooterProps {
  facilities?: DisplayFacility[];
  onScrollToId?: (id: string) => void;
}

type PolicyModalKey = 'cancel' | 'pccc' | 'privacy' | 'checkin' | null;

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
    title: 'Điều khoản sử dụng & Quy định PCCC',
    bullets: [
      'Không lưu trữ chất dễ cháy nổ (xăng dầu, bình gas, pháo, hóa chất độc hại) hoặc hàng cấm theo pháp luật.',
      'Không chứa động vật sống hoặc thực phẩm tươi sống dễ phân hủy gây mùi ảnh hưởng các ô kho lân cận.',
      'Tất cả cơ sở được trang bị bình chữa cháy, đầu báo khói và hệ thống vòi phun Sprinkler tự động 24/7.',
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật thông tin khách hàng',
    bullets: [
      'Thông tin cá nhân, CCCD và hợp đồng điện tử được mã hóa và chỉ sử dụng phục vụ quản lý bàn giao & bảo mật ô kho.',
      'Mã PIN 6 số mở khóa thông minh thuộc quyền quản lý riêng của khách hàng và tự động vô hiệu hóa khi kết thúc hợp đồng.',
      'SmartStorage cam kết không chia sẻ dữ liệu khách hàng cho bên thứ ba nếu không có sự đồng ý hoặc yêu cầu pháp lý.',
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
 * Footer chuẩn Enterprise (B2B2C) 4 cột dùng chung cho toàn bộ các màn hình Customer Portal.
 */
export const CustomerFooter: React.FC<CustomerFooterProps> = ({
  facilities = [],
  onScrollToId,
}) => {
  const [policyModal, setPolicyModal] = useState<PolicyModalKey>(null);
  const activePolicyContent = policyModal ? POLICY_MODAL_CONTENT[policyModal] : null;

  return (
    <>
      <footer className="bg-[#F8F9FA] border-t border-gray-200 text-gray-600 mt-16">
        {/* TẦNG TRÊN: Main Footer 4 cột */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Cột 1: Thương hiệu & Niềm tin */}
          <div className="space-y-4">
            <Logo to="/" showSubtitle={false} size="md" />
            <p className="text-sm text-gray-500 leading-relaxed">
              Giải pháp lưu trữ thông minh, an toàn và linh hoạt cho mọi nhu cầu cá nhân &amp; doanh nghiệp.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>An ninh 24/7 · Hoàn 100% cọc minh bạch</span>
            </div>

            {/* Trust Signals: Kết nối mạng xã hội (Line icons tinh gọn) */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook SmartStorage"
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-brand-700 hover:border-brand-300 transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zalo SmartStorage"
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-brand-700 hover:border-brand-300 transition-colors"
              >
                Zalo OA
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube SmartStorage"
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-brand-700 hover:border-brand-300 transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div className="space-y-3.5">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
              Về chúng tôi
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link
                  to="/"
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                >
                  Giới thiệu chung
                </Link>
              </li>
              <li>
                {onScrollToId ? (
                  <button
                    type="button"
                    onClick={() => onScrollToId('branches')}
                    className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    Hệ thống cơ sở
                  </button>
                ) : (
                  <Link
                    to="/customer/units"
                    className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                  >
                    Hệ thống cơ sở
                  </Link>
                )}
              </li>
              {facilities.slice(0, 2).map((fac) => (
                <li key={fac.id}>
                  <Link
                    to={`/customer/units?facility=${fac.id}`}
                    className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                  >
                    {fac.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/customer/my-units"
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                >
                  Kho của tôi &amp; Mã PIN
                </Link>
              </li>
              <li>
                <Link
                  to="/customer/my-units?tab=waitlist"
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                >
                  Danh sách chờ của tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng & Chính sách */}
          <div className="space-y-3.5">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                {onScrollToId ? (
                  <button
                    type="button"
                    onClick={() => onScrollToId('faqs')}
                    className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    Trung tâm trợ giúp (FAQ)
                  </button>
                ) : (
                  <Link
                    to="/customer/support"
                    className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
                  >
                    Trung tâm trợ giúp (FAQ)
                  </Link>
                )}
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('pccc')}
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Điều khoản sử dụng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('privacy')}
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('cancel')}
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Quy định hoàn tiền / Hủy hợp đồng
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModal('checkin')}
                  className="hover:text-brand-700 hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Hướng dẫn nhận kho &amp; Check-in
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ & CTA */}
          <div className="space-y-3.5">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
              Liên hệ
            </h4>
            <div className="space-y-2.5 text-sm">
              <a
                href="tel:19008888"
                className="flex items-center gap-2.5 group"
              >
                <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                <div>
                  <span className="text-lg font-bold text-brand-700 group-hover:text-brand-800 tabular-nums leading-none block">
                    1900 8888
                  </span>
                  <span className="text-xs text-gray-400">Hỗ trợ 07:00 – 22:00 hàng ngày</span>
                </div>
              </a>

              <a
                href="mailto:support@smartstorage.vn"
                className="flex items-center gap-2.5 text-gray-600 hover:text-brand-700 hover:underline underline-offset-4 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span>support@smartstorage.vn</span>
              </a>

              <div className="flex items-start gap-2.5 text-gray-500 text-xs leading-relaxed">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/customer/support"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Nhận tư vấn ngay
              </Link>
            </div>
          </div>
        </div>

        {/* TẦNG DƯỚI: Bottom Footer Pháp lý (MST, Bản quyền & Quick Links) */}
        <div className="border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-gray-500">
            <div className="space-y-1">
              <p className="text-gray-600 font-medium">
                © 2026 SmartStorage Vietnam. Bảo lưu mọi quyền.
              </p>
              <p className="text-gray-400">
                Công ty Cổ phần Dịch vụ Lưu trữ Thông minh SmartStorage · MST: 0318264920 cấp ngày 12/01/2026 tại Sở KH&amp;ĐT TP. Hồ Chí Minh.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 shrink-0">
              <button
                type="button"
                onClick={() => setPolicyModal('privacy')}
                className="hover:text-brand-700 hover:underline underline-offset-4 cursor-pointer"
              >
                Chính sách bảo mật
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setPolicyModal('pccc')}
                className="hover:text-brand-700 hover:underline underline-offset-4 cursor-pointer"
              >
                Điều khoản sử dụng
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setPolicyModal('cancel')}
                className="hover:text-brand-700 hover:underline underline-offset-4 cursor-pointer"
              >
                Quy định hoàn cọc
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal xem nhanh quy định & chính sách */}
      {activePolicyContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs"
          onClick={() => setPolicyModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{activePolicyContent.title}</h3>
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                aria-label="Đóng"
                className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 text-sm text-gray-600 leading-relaxed list-disc pl-4">
              {activePolicyContent.bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
