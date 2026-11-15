import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  CalendarClock,
  Flame,
  Lock,
  CheckCircle2,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export type TermsPolicyTabKey = 'booking' | 'lifecycle' | 'safety' | 'privacy';

export interface TermsAndPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  initialTab?: TermsPolicyTabKey;
  holdHours?: number;
  depositMultiplierLabel?: string;
}

const TABS: Array<{
  key: TermsPolicyTabKey;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    key: 'booking',
    label: '1. Đặt chỗ, Tiền cọc & Hủy lịch',
    icon: FileText,
  },
  {
    key: 'lifecycle',
    label: '2. Nhận kho, Gia hạn & Trả kho',
    icon: CalendarClock,
  },
  {
    key: 'safety',
    label: '3. Nội quy, PCCC & Bảo hiểm',
    icon: Flame,
  },
  {
    key: 'privacy',
    label: '4. Tài khoản & Bảo mật',
    icon: Lock,
  },
];

export const TermsAndPolicyModal: React.FC<TermsAndPolicyModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'booking',
  holdHours = 48,
  depositMultiplierLabel = '1',
}) => {
  const [activeTab, setActiveTab] = useState<TermsPolicyTabKey>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleAccept = () => {
    onAccept?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl w-full overflow-hidden">
      <div className="flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0f3d35] via-[#145348] to-[#0f3d35] text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Điều khoản sử dụng &amp; Chính sách khách hàng SmartStorage
              </h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Quy định minh bạch về đặt giữ chỗ, tiền cọc, hoàn hủy, vận hành ô kho tự quản và bảo vệ quyền riêng tư
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ điều khoản"
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-brand-700 border-brand-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed flex-1">
          {/* ==================== TAB 1: ĐẶT CHỖ, TIỀN CỌC & HỦY LỊCH ==================== */}
          {activeTab === 'booking' && (
            <div className="space-y-5">
              {/* Khối 1: Quy định đặt trước & Giữ chỗ */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Quy định đặt chỗ &amp; Thời gian giữ suất chờ thanh toán</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    <strong>Khung thời gian đặt trước trực tuyến:</strong> Quý khách có thể chọn ngày bắt đầu thuê trong vòng{' '}
                    <strong>tối đa 30 ngày</strong> kể từ ngày đặt. Nếu cần đặt lịch xa hơn 30 ngày hoặc khi hạng kho đang tạm hết chỗ trống, hệ thống hỗ trợ đăng ký vào{' '}
                    <strong>Danh sách chờ (Waitlist)</strong> hoàn toàn miễn phí (0 ₫) để Quản lý cơ sở liên hệ ưu tiên theo thứ tự đăng ký.
                  </li>
                  <li>
                    <strong>Đặt theo Hạng kho tiêu chuẩn:</strong> Quý khách lựa chọn Hạng kho theo diện tích và điều kiện môi trường (Kho Tiêu Chuẩn hoặc Kho Máy Lạnh). Quản lý cơ sở sẽ phân bổ ô kho vật lý cụ thể đạt chuẩn trước ngày hẹn nhận kho.
                  </li>
                  <li>
                    <strong>Giữ chỗ trong {holdHours} giờ:</strong> Sau khi gửi thông tin đặt chỗ, hệ thống giữ suất hạng kho cho Quý khách trong{' '}
                    <strong>{holdHours} giờ</strong> để hoàn tất thanh toán. Trong lúc chưa thanh toán, Quý khách có thể hủy đơn miễn phí bất kỳ lúc nào (mỗi thời điểm tài khoản giữ tối đa 01 đơn chờ thanh toán).
                  </li>
                  <li>
                    <strong>Quy định chống spam hủy đơn:</strong> Để bảo vệ công suất phục vụ chung, tài khoản hủy đơn hoặc bỏ thanh toán quá{' '}
                    <strong>5 lần trong một ngày</strong> sẽ tạm thời bị khóa tính năng tạo đơn mới trong ngày hôm đó.
                  </li>
                </ul>
              </div>

              {/* Khối 2: Thanh toán & Tiền cọc bảo đảm */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Thanh toán trọn kỳ &amp; Chính sách tiền cọc bảo đảm</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    <strong>Thanh toán 1 lần duy nhất khi đặt kho:</strong> Tổng số tiền thanh toán ban đầu qua cổng VNPay bao gồm:{' '}
                    <strong>Tiền thuê trọn kỳ hạn (N tháng) + Tiền cọc bảo đảm ({depositMultiplierLabel} tháng tiền thuê gốc) + Phí gói bảo vệ mở rộng (nếu chọn)</strong>.
                  </li>
                  <li>
                    <strong>Cam kết hoàn trả 100% tiền cọc:</strong> Khoản tiền cọc được bảo lưu độc lập (không sinh lãi, không dùng để khấu trừ vào tiền thuê giữa kỳ) và được{' '}
                    <strong>hoàn trả 100% trong vòng 7 ngày làm việc</strong> sau khi Quý khách hoàn tất nghiệm thu trả kho nguyên trạng.
                  </li>
                  <li>
                    <strong>Miễn thu thêm cọc khi gia hạn:</strong> Mỗi hợp đồng chỉ đóng tiền cọc một lần duy nhất ở kỳ đầu tiên; các lần gia hạn tiếp theo không phát sinh thêm tiền cọc mới.
                  </li>
                </ul>
              </div>

              {/* Khối 3: Bảng 3 tầng hủy nhận kho */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>Chính sách hủy đơn đã thanh toán (Trước khi nhận kho)</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Tiền thuê luôn được hoàn 100%
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Khi Quý khách đã thanh toán nhưng có thay đổi kế hoạch và bấm <strong>&ldquo;Hủy nhận kho&rdquo;</strong> trước khi bàn giao, toàn bộ{' '}
                  <strong>100% tiền thuê</strong> luôn được hoàn lại. Mức phí hủy (nếu có) chỉ tính trên khoản <strong>Tiền cọc bảo đảm</strong> theo 3 mốc thời gian tính đến 00:00 ngày bắt đầu thuê:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <div className="text-xs font-extrabold text-emerald-900">Tầng 1: Từ 7 ngày trở lên</div>
                    <div className="text-[11px] text-emerald-800 font-semibold">Trước ngày nhận kho ≥ 7 ngày</div>
                    <p className="text-xs text-slate-700 pt-1">
                      Khấu trừ cọc: <strong>0 ₫</strong>.<br />
                      Hoàn lại <strong>100% tiền thuê + 100% tiền cọc</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="text-xs font-extrabold text-amber-900">Tầng 2: Từ 2 đến 6 ngày</div>
                    <div className="text-[11px] text-amber-800 font-semibold">Từ 48 giờ đến dưới 7 ngày</div>
                    <p className="text-xs text-slate-700 pt-1">
                      Khấu trừ: <strong>50% tiền cọc</strong>.<br />
                      Hoàn lại <strong>100% tiền thuê + 50% tiền cọc</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                    <div className="text-xs font-extrabold text-rose-900">Tầng 3: Dưới 48 giờ</div>
                    <div className="text-[11px] text-rose-800 font-semibold">Sát giờ nhận kho (&lt; 2 ngày)</div>
                    <p className="text-xs text-slate-700 pt-1">
                      Khấu trừ: <strong>100% tiền cọc</strong>.<br />
                      Hoàn lại <strong>100% tiền thuê</strong> (không hoàn cọc).
                    </p>
                  </div>
                </div>
              </div>

              {/* Khối 4: Chính sách dời ngày nhận kho */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <span>Chính sách dời ngày bắt đầu nhận kho</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
                  <li>
                    Quý khách đang ở trạng thái chờ nhận kho có thể yêu cầu dời ngày bắt đầu nhận kho <strong>tối đa 01 lần duy nhất</strong> trên mỗi hợp đồng, với số ngày dời từ <strong>1 đến 7 ngày</strong> và gửi yêu cầu trước 00:00 ngày nhận kho ban đầu <strong>ít nhất 48 giờ</strong>.
                  </li>
                  <li>
                    Phí giữ kho chờ theo ngày được tính minh bạch bằng: <strong>Số ngày dời × (Đơn giá thuê tháng / 30)</strong> (làm tròn lên 1.000 ₫). Sau khi thanh toán phí dời ngày, cả ngày bắt đầu và ngày kết thúc hợp đồng đều được lùi tương ứng, giữ nguyên trọn vẹn số tháng thuê của Quý khách.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: NHẬN KHO, GIA HẠN & TRẢ KHO ==================== */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-5">
              {/* Khối 1: Nhận bàn giao ô kho */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Thủ tục nhận bàn giao &amp; Kích hoạt mã mở kho</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Quý khách có thể thực hiện <strong>Nhận kho trực tuyến (Check-in Online)</strong> ngay trên mục <em>&ldquo;Kho của tôi&rdquo;</em> hoặc xuất trình CCCD/Hộ chiếu trùng khớp cùng mã vé nhận kho điện tử (QR e-Pass) tại quầy lễ tân cơ sở để nhân viên hỗ trợ đồng kiểm hiện trạng.
                  </li>
                  <li>
                    Ngay sau khi ký xác nhận biên bản bàn giao, hệ thống kích hoạt <strong>mã PIN 6 chữ số</strong> và <strong>mã QR mở cửa riêng biệt</strong> để Quý khách tự do ra vào lưu trữ tài sản.
                  </li>
                  <li>
                    Nếu ô kho dự kiến bàn giao phát sinh sự cố kỹ thuật tại hiện trường, cơ sở cam kết bố trí ngay một ô kho đạt chuẩn khác cùng hạng (hoặc hoàn trả 100% toàn bộ tiền thuê và tiền cọc trong vòng <strong>3 ngày làm việc</strong> nếu Quý khách từ chối nhận kho do lỗi cơ sở).
                  </li>
                </ul>
              </div>

              {/* Khối 2: Gia hạn hợp đồng */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Quy định gia hạn hợp đồng thuê kho</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    <strong>Tự gia hạn trực tuyến:</strong> Quý khách có thể tự gia hạn trực tuyến từ <strong>1 đến 12 tháng/lần</strong> bất kỳ lúc nào khi hợp đồng đang hoạt động cho đến <strong>trước hạn chót 20 ngày</strong> so với ngày kết thúc hợp đồng. Giá gia hạn áp dụng theo biểu giá niêm yết tại thời điểm gia hạn và <strong>không cần đóng thêm tiền cọc</strong>.
                  </li>
                  <li>
                    <strong>Trong vòng 20 ngày cuối trước khi hết hạn:</strong> Tính năng tự gia hạn trên ứng dụng sẽ tạm khóa để cơ sở ưu tiên điều phối lịch cho khách trong Danh sách chờ. Nếu Quý khách muốn gia hạn muộn trong khoảng thời gian này, vui lòng liên hệ trực tiếp Quản lý cơ sở để được hỗ trợ duyệt gia hạn ngoại lệ (áp dụng phí hành chính <strong>200.000 ₫</strong> khi ô kho chưa có khách mới đặt cọc).
                  </li>
                </ul>
              </div>

              {/* Khối 3: Trả kho & Hoàn tiền */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Chính sách trả kho &amp; Quyết toán hoàn tiền bảo vệ khách hàng</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    <strong>Trả kho đúng hạn hoặc trong 30 ngày cuối hợp đồng:</strong> Sau khi Quý khách dọn sạch đồ đạc, bấm <em>&ldquo;Báo trả kho&rdquo;</em> và nhân viên nghiệm thu ô kho nguyên trạng, hệ thống <strong>hoàn trả 100% tiền cọc bảo đảm</strong> (đối trừ chi phí vệ sinh hoặc hư hỏng thực tế nếu có theo bảng phí niêm yết).
                  </li>
                  <li>
                    <strong>Trả kho sớm trước hạn dài (còn trên 30 ngày thuê chưa sử dụng):</strong> Quý khách được <strong>hoàn lại 100% tiền thuê của toàn bộ số ngày thực tế chưa sử dụng</strong>, và chỉ khấu trừ khoản tiền cọc bảo đảm (1 tháng) để bù đắp chi phí trống kho trước hạn cho cơ sở.
                  </li>
                  <li>
                    <strong>Thời gian chuyển khoản hoàn tiền:</strong> Khoản tiền hoàn quyết toán được chuyển về tài khoản/phương thức thanh toán gốc của Quý khách trong vòng <strong>7 ngày làm việc</strong> kể từ ngày Quản lý cơ sở phê duyệt quyết toán.
                  </li>
                </ul>
              </div>

              {/* Khối 4: Lộ trình xử lý quá hạn */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>4. Quy định xử lý quá hạn hợp đồng (7 ngày sau ngày kết thúc)</span>
                </h3>
                <p className="text-xs text-slate-700">
                  Nếu qua ngày hết hạn hợp đồng mà Quý khách chưa gia hạn và chưa hoàn tất trả kho, hợp đồng sẽ chuyển sang trạng thái <strong>Quá hạn</strong> và tạm khóa mã PIN mở kho cho đến khi thanh toán phí quá hạn:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
                    <div className="font-extrabold text-amber-900">Ngày quá hạn 1 – 3</div>
                    <p className="text-slate-600">
                      Miễn phạt vi phạm; chỉ tính phí lưu kho quá hạn <strong>5% tiền cọc/ngày</strong> (tối đa 15% tiền cọc trong 3 ngày).
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-1">
                    <div className="font-extrabold text-orange-900">Ngày quá hạn 4 – 6</div>
                    <p className="text-slate-600">
                      Phí phạt quá hạn <strong>10% tiền cọc/ngày</strong>. Đóng đủ phí quá hạn qua VNPay sẽ được mở lại mã PIN tạm thời đến <strong>23:59</strong> cùng ngày để dọn đồ và báo trả kho.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-1">
                    <div className="font-extrabold text-rose-900">Từ ngày quá hạn thứ 7</div>
                    <p className="text-slate-600">
                      Chấm dứt hợp đồng, thu hồi PIN vĩnh viễn và khấu trừ trọn vẹn <strong>100% tiền cọc</strong> (55% phí quá hạn + 45% phí niêm phong chuyển đồ về Kho Tổng lưu giữ tối đa 30 ngày).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: NỘI QUY, PCCC & BẢO HIỂM ==================== */}
          {activeTab === 'safety' && (
            <div className="space-y-5">
              {/* Khối 1: Nguyên tắc tự quản */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Nguyên tắc thuê kho tự quản &amp; Sử dụng mã truy cập</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Dịch vụ SmartStorage là hợp đồng <strong>cho thuê không gian mặt bằng lưu trữ tự quản</strong>. Quý khách tự nắm giữ mã PIN 6 chữ số / mã QR cá nhân, chủ động sắp xếp và lấy đồ đạc.
                  </li>
                  <li>
                    Quý khách có trách nhiệm bảo mật mã mở kho và đóng cửa ô kho cẩn thận sau mỗi lần ra vào. Khi quên mã PIN, Quý khách có thể bấm <strong>Yêu cầu cấp lại mã PIN mới</strong> ngay trên ứng dụng hoàn toàn miễn phí và có hiệu lực tức thì.
                  </li>
                </ul>
              </div>

              {/* Khối 2: Hàng hóa nghiêm cấm */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2.5">
                <h3 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Danh mục hàng hóa nghiêm cấm lưu trữ &amp; An toàn PCCC</span>
                </h3>
                <p className="text-xs text-rose-900 font-medium">
                  Để đảm bảo an toàn Phòng cháy chữa cháy (PCCC) và vệ sinh môi trường cho toàn bộ cơ sở, Quý khách cam kết tuyệt đối <strong>KHÔNG</strong> lưu trữ các loại vật phẩm sau:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    <strong>Chất dễ cháy nổ &amp; Hóa chất nguy hiểm:</strong> Xăng dầu, nhiên liệu, bình gas, pháo nổ, sơn, dung môi hóa học, chất phóng xạ, chất độc hại hoặc pin công suất lớn không có thiết bị bảo hộ.
                  </li>
                  <li>
                    <strong>Hàng cấm theo quy định pháp luật:</strong> Vũ khí, đạn dược, chất ma túy, chất kích thích, hàng lậu, hàng giả, tài sản do phạm pháp mà có.
                  </li>
                  <li>
                    <strong>Sinh vật sống &amp; Thực phẩm dễ phân hủy:</strong> Động vật sống, cây cảnh cần tưới nước, thực phẩm tươi sống dễ ôi thiu gây mùi hôi hoặc thu hút côn trùng, chuột bọ.
                  </li>
                  <li>
                    <strong>Tài sản đặc biệt quý giá:</strong> Tiền mặt, vàng bạc, kim cương, đá quý, cổ vật hoặc giấy tờ có giá trị ngang tiền.
                  </li>
                </ul>
                <div className="p-3 bg-white/90 rounded-lg border border-rose-200 text-xs text-rose-900">
                  <strong>Trách nhiệm pháp lý:</strong> Công ty miễn trừ 100% trách nhiệm bồi thường nếu Quý khách tự ý lưu trữ hàng hóa thuộc danh mục cấm. Quý khách chịu hoàn toàn trách nhiệm trước pháp luật và bồi thường toàn bộ thiệt hại phát sinh nếu hàng cấm gây cháy nổ, hư hại hạ tầng cơ sở hoặc tài sản của các ô kho lân cận.
                </div>
              </div>

              {/* Khối 3: Hạn mức bảo vệ hàng hóa */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span>Trách nhiệm bồi thường &amp; Gói bảo vệ tài sản lưu trữ</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">Gói Cơ bản (Mặc định)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Miễn phí (0 ₫)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pt-1">
                      Bồi thường theo giá trị tổn thất thực tế tối đa <strong>10.000.000 ₫ / ô kho</strong> khi phát sinh hư hại trực tiếp do lỗi kỹ thuật từ cơ sở hạ tầng.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-emerald-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-950">Gói Toàn diện 50M (Tùy chọn)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        +50.000 ₫/tháng
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pt-1">
                      Nâng hạn mức bảo vệ và bồi hoàn rủi ro thực tế lên tối đa <strong>50.000.000 ₫ / ô kho</strong>. Phù hợp khi lưu trữ thiết bị điện tử, hàng hóa và hồ sơ giá trị cao.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: TÀI KHOẢN & BẢO MẬT ==================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              {/* Khối 1: Xác thực tài khoản */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>Đăng ký, Xác thực OTP &amp; Bảo mật tài khoản</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Mỗi tài khoản khách hàng được định danh bằng địa chỉ Email hợp lệ và xác thực qua <strong>mã OTP 6 chữ số</strong> gửi về hộp thư điện tử (hiệu lực trong vòng <strong>5 phút</strong>).
                  </li>
                  <li>
                    Mật khẩu đăng nhập của Quý khách được mã hóa một chiều an toàn. Quý khách vui lòng không chia sẻ mật khẩu hoặc mã PIN mở kho cho người không có thẩm quyền.
                  </li>
                </ul>
              </div>

              {/* Khối 2: Bảo mật CCCD & Thông tin cá nhân */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>Mục đích thu thập &amp; Bảo mật CCCD / Hộ chiếu (12 số)</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <li>
                    Thông tin <strong>Họ và tên, Số điện thoại, Email và Số CCCD / Hộ chiếu</strong> được thu thập chỉ để phục vụ:
                    <ol className="list-decimal pl-5 mt-1 space-y-1">
                      <li>
                        Xác lập <strong>Hợp đồng thuê ô kho tự quản điện tử</strong> tuân thủ Luật Giao dịch Điện tử 2023 và Bộ luật Dân sự 2015.
                      </li>
                      <li>
                        Đối chiếu danh tính chính chủ khi bàn giao ô kho tại quầy lễ tân hoặc khi hỗ trợ cấp lại chìa khóa cơ tại hiện trường.
                      </li>
                      <li>
                        Gửi mã mở khóa PIN/QR bảo mật, hóa đơn điện tử và các thông báo nhắc lịch gia hạn/trả kho.
                      </li>
                    </ol>
                  </li>
                  <li>
                    <strong>Lưu trữ độc lập theo từng hợp đồng:</strong> Thông tin người thuê điền trên từng đơn đặt chỗ được lưu riêng biệt trong hợp đồng của đơn đó, không tự động thay đổi hay ghi đè thông tin hồ sơ tài khoản đăng nhập gốc của Quý khách.
                  </li>
                </ul>
              </div>

              {/* Khối 3: Cam kết quyền riêng tư */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>3. Cam kết bảo vệ dữ liệu cá nhân</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  SmartStorage cam kết bảo mật tuyệt đối dữ liệu cá nhân và lịch sử giao dịch của Quý khách; không mua bán, trao đổi hoặc chia sẻ thông tin cho bất kỳ bên thứ ba nào ngoài mục đích xử lý giao dịch thanh toán qua cổng VNPay và đối tác bảo hiểm hàng hóa (trong trường hợp Quý khách đăng ký Gói Toàn diện 50M).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] sm:text-xs text-slate-500">
            Mọi thắc mắc về quy định dịch vụ, vui lòng liên hệ Hotline hỗ trợ 24/7:{' '}
            <strong className="text-slate-800">1900 8888</strong>
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onAccept ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAccept}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tôi đã đọc hiểu &amp; Đồng ý điều khoản</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onClose}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Đã hiểu &amp; Đóng
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
