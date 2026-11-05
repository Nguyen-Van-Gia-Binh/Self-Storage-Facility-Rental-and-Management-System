import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle2, AlertCircle, Building2, Package } from 'lucide-react';
import { registerWaitlist } from '@/api/waitlist';
import { useCurrentUser } from '@/utils/useCurrentUser';

interface WaitlistRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: number;
  facilityName: string;
  unitTypeId: number;
  unitTypeName: string;
  initialStartDate?: string;
  initialRentalMonths?: number;
  onSuccess?: () => void;
}

export const WaitlistRegistrationModal: React.FC<WaitlistRegistrationModalProps> = ({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  unitTypeId,
  unitTypeName,
  initialStartDate,
  initialRentalMonths = 1,
  onSuccess,
}) => {
  const user = useCurrentUser();
  const todayStr = new Date().toISOString().split('T')[0];

  const [targetStartDate, setTargetStartDate] = useState<string>(
    initialStartDate && initialStartDate >= todayStr ? initialStartDate : todayStr
  );
  const [rentalMonths, setRentalMonths] = useState<number>(initialRentalMonths || 1);
  const [contactNotes, setContactNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Quý khách vui lòng đăng nhập để đăng ký vào Danh sách chờ.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await registerWaitlist({
        facilityId,
        unitTypeId,
        targetStartDate,
        rentalMonths: Number(rentalMonths) || 1,
        contactNotes: contactNotes.trim() || undefined,
      });
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      if (err?.errorCode === 'WAITLIST_ALREADY_EXISTS') {
        setErrorMsg('Bạn đã có yêu cầu chờ cho loại ô kho này tại cơ sở. Vui lòng kiểm tra mục Danh sách chờ của tôi.');
      } else {
        setErrorMsg(err?.message || 'Không thể đăng ký danh sách chờ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-lg w-full space-y-5">
        {isSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900">Đăng ký Danh sách chờ thành công!</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Yêu cầu của bạn đã được ghi nhận vào hệ thống ưu tiên (FIFO). Khi có ô kho trống, Quản lý cơ sở sẽ trực tiếp gọi điện tư vấn và giữ chỗ cho bạn.
              </p>
            </div>
            <div className="pt-3">
              <Button
                variant="primary"
                className="w-full justify-center py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleClose}
              >
                Đã hiểu & Đóng
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đăng ký Danh sách chờ (Waitlist)</h3>
                <p className="text-xs text-slate-500">Nhận thông báo và giữ chỗ ưu tiên ngay khi có kho trống</p>
              </div>
            </div>

            {/* Thông tin kho */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium text-slate-500">
                  <Building2 className="w-3.5 h-3.5" /> Cơ sở:
                </span>
                <span className="font-semibold text-slate-900">{facilityName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium text-slate-500">
                  <Package className="w-3.5 h-3.5" /> Hạng kho:
                </span>
                <span className="font-semibold text-emerald-700">{unitTypeName}</span>
              </div>
            </div>

            {/* Form inputs */}
            <div className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày mong muốn bắt đầu thuê <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={targetStartDate}
                  onChange={(e) => setTargetStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời gian dự kiến thuê <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rentalMonths}
                  onChange={(e) => setRentalMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                >
                  <option value={1}>1 tháng</option>
                  <option value={3}>3 tháng</option>
                  <option value={6}>6 tháng</option>
                  <option value={12}>12 tháng (1 năm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú nhu cầu thêm (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Ví dụ: Cần kho khô ráo gửi đồ gia đình, có thể nhận sớm hơn..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-center py-2.5 text-xs font-medium text-slate-600"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 justify-center py-2.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận đăng ký'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
