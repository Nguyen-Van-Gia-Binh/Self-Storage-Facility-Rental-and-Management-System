import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X, FileText, Shield, CheckCircle2 } from 'lucide-react';

export interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setHasScrolledToBottom(true);
    }
  };

  const handleClose = () => {
    setHasScrolledToBottom(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0d6050] to-[#12836d] px-6 py-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">Điều khoản dịch vụ và Chính sách bảo mật</h2>
            <p className="text-[11px] text-emerald-200">Cập nhật: tháng 9/2026</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 text-sm text-slate-700 space-y-5"
        onScroll={handleScroll}
      >
        {/* Section 1 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600" />
            1. Giới thiệu
          </h3>
          <p>
            Chào mừng quý khách đến với hệ thống Smart Storage. Khi sử dụng dịch vụ cho thuê kho tự
            lưu trữ của Smart Storage Vietnam (sau đây gọi là "Công ty"), quý khách đồng ý tuân thủ
            các điều khoản và điều kiện được nêu trong tài liệu này.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">2. Phạm vi dịch vụ</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Cho thuê ô kho tự lưu trữ theo kỳ hạn 1 đến 12 tháng.</li>
            <li>Cung cấp không gian lưu trữ an toàn với hệ thống camera giám sát 24/7.</li>
            <li>Mở cửa tự động bằng mã PIN hoặc thẻ từ trong khung giờ quy định.</li>
            <li>Hỗ trợ khách hàng qua hotline và kênh chat trực tuyến.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">3. Quy định lưu trữ an toàn (PCCC)</h3>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
            <p className="font-bold text-slate-800">Nghiêm cấm lưu trữ:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Chất dễ cháy, nổ, khí độc hại.</li>
              <li>Chất ma túy và các chất cấm theo pháp luật Việt Nam.</li>
              <li>Động vật sống.</li>
              <li>Thực phẩm dễ hư hỏng (trừ kho lạnh có điều kiện riêng).</li>
              <li>Vũ khí, vật liệu nổ.</li>
              <li>Các mặt hàng vi phạm pháp luật hoặc quy định địa phương.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">4. Chính sách thanh toán và đặt cọc</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Đặt cọc:</strong> Khách hàng thanh toán phí đặt cọc tương đương 1 tháng tiền
              thuê (hoặc theo chính sách hiện hành) để giữ chỗ trong 48 giờ.
            </li>
            <li>
              <strong>Hoàn cọc:</strong> Được hoàn 100% nếu hủy trước 48 giờ kể từ ngày bắt đầu
              thuê; hoàn 50% nếu hủy trong vòng 24 giờ trước ngày bắt đầu; không hoàn nếu hủy
              trễ hoặc không đến nhận kho (no-show).
            </li>
            <li>
              <strong>Thanh toán:</strong> Tiền thuê các tháng tiếp theo thanh toán trước theo
              kỳ hạn đã chọn.
            </li>
            <li>
              <strong>Quá hạn:</strong> Sau 3 ngày quá hạn thanh toán, quyền truy cập ô kho sẽ bị
              tạm khóa; sau 10 ngày, Công ty có quyền chấm dứt hợp đồng và xử lý tài sản bên
              trong theo quy định.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">5. Trả kho trước hạn</h3>
          <p>
            Khách hàng trả kho trước hạn hợp đồng <strong>không được hoàn lại tiền thuê</strong>{' '}
            các tháng còn lại. Khách hàng phải thông báo bằng văn bản (qua ứng dụng hoặc email)
            ít nhất 30 ngày trước ngày trả kho dự kiến.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">6. Trách nhiệm và giới hạn</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Khách hàng chịu trách nhiệm bảo quản tài sản bên trong ô kho. Công ty không chịu
              trách nhiệm về mất mát, hư hỏng do thiên tai, chiến tranh hoặc lỗi từ phía khách
              hàng.
            </li>
            <li>
              Công ty giới hạn trách nhiệm bồi thường tối đa bằng số tiền thuê 1 tháng của ô kho
              đang thuê, trừ khi có thỏa thuận riêng bằng văn bản.
            </li>
            <li>
              Khách hàng chịu trách nhiệm bồi thường thiệt hại gây ra cho ô kho hoặc cơ sở.
            </li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">7. Chính sách bảo mật thông tin</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              Thông tin cá nhân của khách hàng (tên, CCCD, số điện thoại, email) được thu thập
              và xử lý theo quy định pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.
            </li>
            <li>
              Dữ liệu truy cập (mã PIN, thẻ từ, nhật ký ra vào) được lưu trữ bảo mật và chỉ
              được tiết lộ khi có yêu cầu từ cơ quan có thẩm quyền.
            </li>
            <li>
              Khách hàng đồng ý cho Công ty sử dụng số CCCD để định danh khi cấp quyền mở cửa
              bảo mật tại cơ sở.
            </li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">8. Liên hệ hỗ trợ</h3>
          <p>
            Mọi thắc mắc vui lòng liên hệ qua kênh hỗ trợ trong ứng dụng hoặc email:{' '}
            <strong>hotro@smartstorage.vn</strong>.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 italic">
          Vui lòng đọc kỹ trước khi đồng ý. Điều khoản có thể được cập nhật định kỳ.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={handleClose}
          disabled={!hasScrolledToBottom}
          className="px-6 py-2 text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
        >
          {hasScrolledToBottom ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Đã đọc & Đóng
            </>
          ) : (
            'Cuộn xuống để tiếp tục'
          )}
        </Button>
      </div>
    </Modal>
  );
};
