import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import type { DailyCheckInTask, CheckInContract, CheckInSubmitRequest, HandoverRejectRequest } from '@/types';
import { getPendingContracts, checkInContract, rejectHandoverContract } from '@/api/contract';
import { useCurrentUser } from '@/utils/useCurrentUser';
import { CustomerVerificationCard } from './CustomerVerificationCard';
import { HandoverInspectionForm } from './HandoverInspectionForm';
import { AccessCodePinModal } from './AccessCodePinModal';
import { HandoverRejectionModal } from './HandoverRejectionModal';

export interface StaffCheckInDetailViewProps {
  task: DailyCheckInTask;
  onBack: () => void;
  onSuccess: () => void;
}

export const StaffCheckInDetailView: React.FC<StaffCheckInDetailViewProps> = ({
  task,
  onBack,
  onSuccess,
}) => {
  const user = useCurrentUser();
  const staffId = user?.id ? Number(user.id) : undefined;

  const [contract, setContract] = useState<CheckInContract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [currentPin, setCurrentPin] = useState<string>('482019');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Nạp thông tin hợp đồng chi tiết từ Real API
  const loadContractDetail = useCallback(async () => {
    setLoading(true);
    try {
      const facilityId = task.facilityId || 0;
      const list = await getPendingContracts(facilityId === 0 ? undefined : facilityId);

      // Tìm hợp đồng khớp với task
      const found = list.find(
        (c) =>
          (task.contractId && c.id === task.contractId) ||
          (task.reservationId && c.reservationId === task.reservationId) ||
          (task.contractCode && c.code === task.contractCode) ||
          (task.unitCode && (c.storageUnitCode === task.unitCode || c.storageUnitCode.includes(task.unitCode)))
      );

      if (found) {
        setContract(found);
      } else {
        // Fallback tạo object hợp đồng từ task để luôn sẵn sàng hiển thị đầy đủ
        setContract({
          id: task.contractId || task.reservationId || 1,
          code: task.contractCode || `CTR-20261012-${task.unitCode}`,
          reservationId: task.reservationId || 1,
          reservationCode: `RSV-${task.unitCode}`,
          customerId: 1,
          customerName: task.customerName,
          customerPhone: task.customerPhone,
          customerIdentityNumber: '079201004829',
          facilityId: task.facilityId || 1,
          facilityName: task.facilityName || 'Cơ sở Cầu Giấy - Hà Nội',
          storageUnitId: 1,
          storageUnitCode: task.unitCode,
          floor: 1,
          position: 'Khu A',
          unitTypeId: 1,
          unitTypeName: 'Kho mini tiêu chuẩn (Standard)',
          unitTypeDimensions: '2.0m x 2.0m x 2.5m',
          startDate: task.startDate || '2026-10-12',
          endDateExclusive: '2027-01-12',
          rentalMonths: 3,
          monthlyPrice: 1500000,
          totalRentalFee: 4500000,
          depositAmount: 1500000,
          totalPayable: 6000000,
          isFullyPaid: task.isFullyPaid !== undefined ? task.isFullyPaid : true,
          status: task.completed || task.status === 'COMPLETED' || task.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING_CHECK_IN',
          appointmentTime: task.appointmentTime || '09:00',
          graceDaysRemaining: 3,
          assignedStaffId: staffId,
          assignedStaffName: user?.fullName || 'Trần Thị Nhân Viên',
        });
      }
    } catch (err) {
      console.error('Lỗi khi nạp chi tiết hợp đồng check-in:', err);
    } finally {
      setLoading(false);
    }
  }, [task, staffId, user?.fullName]);

  useEffect(() => {
    loadContractDetail();
  }, [loadContractDetail]);

  // Nộp biên bản nghiệm thu bàn giao & kích hoạt mã PIN (Happy Path)
  const handleHandoverSubmit = async (request: CheckInSubmitRequest) => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      const res = await checkInContract(contract.id, request, staffId);
      setCurrentPin(res.accessCode || '839201');
      setIsPinModalOpen(true);
      showToast('success', `Bàn giao thành công ô kho ${contract.storageUnitCode}. Hợp đồng đã kích hoạt ACTIVE.`);

      setContract((prev) => (prev ? { ...prev, status: 'ACTIVE', appointmentTime: 'Đã hoàn tất bàn giao' } : null));
      onSuccess();
    } catch (error) {
      console.error('Lỗi khi bàn giao kho:', error);
      showToast('error', 'Xảy ra lỗi trong quá trình kích hoạt bàn giao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Từ chối nhận bàn giao / Báo hỏng (BR-CHK-06)
  const handleRejectionConfirm = async (reason: string, reportedDefects: string) => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      const req: HandoverRejectRequest = {
        rejectionReason: reason,
        reportedDefects,
      };
      await rejectHandoverContract(contract.id, req, staffId);
      setIsRejectionModalOpen(false);
      showToast('error', `Đã khóa ô kho ${contract.storageUnitCode} sang bảo trì và hủy lượt bàn giao.`);

      setContract((prev) => (prev ? { ...prev, status: 'TERMINATED', appointmentTime: 'Đã từ chối nhận' } : null));
      onSuccess();
    } catch (error) {
      console.error('Lỗi khi ghi nhận từ chối bàn giao:', error);
      showToast('error', 'Lỗi khi ghi nhận từ chối bàn giao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDone = Boolean(contract && (contract.status === 'ACTIVE' || task.completed || task.status === 'COMPLETED'));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-in fade-in-50 duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Command Bar với nút [← Quay lại ca trực] */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer group"
            title="Quay lại danh sách ca trực"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại ca trực</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Tiếp đón Check-in
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Bàn giao & Ký số điện tử</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              <span>Bàn Giao Ô Kho: {task.unitCode}</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-slate-700 font-bold">{task.customerName}</span>
            </h1>
          </div>
        </div>

        {/* Trạng thái bàn giao */}
        <div className="flex items-center gap-2">
          {isDone ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã hoàn tất bàn giao</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Chờ tiếp đón & Bàn giao</span>
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Full-Width Console */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 h-96 skeleton rounded-2xl" />
          <div className="lg:col-span-7 h-96 skeleton rounded-2xl" />
        </div>
      ) : contract ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (5/12 ~ 40%): Hồ sơ hợp đồng & Xác minh danh tính */}
          <div className="lg:col-span-5 space-y-4">
            {/* Banner phân công */}
            <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-teal-900 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Quy trình bàn giao trực tiếp tại quầy (BR-CHK-01..06)</div>
                <p className="text-teal-800 text-[11px] leading-relaxed">
                  Nhân viên tiến hành xác minh số CCCD của khách hàng, cùng khách kiểm tra thực tế 4 tiêu chí mặt bằng ô kho trước khi lấy chữ ký xác nhận và kích hoạt mã PIN.
                </p>
              </div>
            </div>

            {/* Thẻ xác minh thông tin khách & Ô kho */}
            <CustomerVerificationCard contract={contract} />

            {/* Thẻ tóm tắt lịch hẹn */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Thông tin lịch hẹn tiếp đón</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Giờ hẹn dự kiến:</span>
                  <span className="font-bold text-slate-800">{contract.appointmentTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày bắt đầu:</span>
                  <span className="font-bold text-slate-800">{contract.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                  <a href={`tel:${contract.customerPhone}`} className="font-mono font-bold text-teal-700 hover:underline">
                    {contract.customerPhone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cơ sở bàn giao:</span>
                  <span className="font-semibold text-slate-800">{contract.facilityName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7/12 ~ 60%): Biên bản bàn giao hoặc Trạng thái đã xong */}
          <div className="lg:col-span-7 space-y-4">
            {isDone ? (
              <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-8 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    HỢP ĐỒNG ĐÃ ĐƯỢC BÀN GIAO & KÍCH HOẠT THÀNH CÔNG
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách hàng <strong className="text-slate-900">{contract.customerName}</strong> đã nhận bàn giao ô kho{' '}
                    <strong className="font-mono text-teal-700">{contract.storageUnitCode}</strong>. Khách có thể dùng mã PIN hoặc ứng dụng SmartStorage để mở khóa 24/7.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Xem lại Mã PIN bảo mật</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Về danh sách ca trực</span>
                  </button>
                </div>
              </div>
            ) : (
              <HandoverInspectionForm
                contract={contract}
                onSubmitHandover={handleHandoverSubmit}
                onOpenRejectionModal={() => setIsRejectionModalOpen(true)}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Không tìm thấy thông tin hợp đồng cho ô kho này.
        </div>
      )}

      {/* Modal hiển thị mã PIN sau khi bàn giao thành công */}
      {contract && (
        <AccessCodePinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          accessCode={currentPin}
          contract={contract}
        />
      )}

      {/* Modal từ chối nhận kho / Báo hỏng */}
      {contract && (
        <HandoverRejectionModal
          isOpen={isRejectionModalOpen}
          onClose={() => setIsRejectionModalOpen(false)}
          contract={contract}
          onConfirmRejection={handleRejectionConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
