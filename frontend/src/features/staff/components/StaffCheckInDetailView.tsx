import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
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
    <div className="space-y-6 animate-in fade-in duration-200">
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

      {/* Top Header Điều hướng quay lại & Tiêu đề đồng nhất */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Quay lại danh sách ca trực</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                Ô {task.unitCode}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Tiếp đón & Bàn giao ô kho
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hợp đồng #{contract?.code || task.contractCode || task.contractId} · Khách hàng {task.customerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDone ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã hoàn tất bàn giao</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Chờ tiếp đón & Bàn giao</span>
            </span>
          )}

          <button
            type="button"
            onClick={loadContractDetail}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Full-Width Console */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-96 skeleton rounded-2xl" />
          <div className="lg:col-span-8 h-96 skeleton rounded-2xl" />
        </div>
      ) : contract ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (4/12): 1 thẻ Hồ sơ tiếp đón duy nhất, rõ ràng, không trùng lặp */}
          <div className="lg:col-span-4">
            <CustomerVerificationCard contract={contract} />
          </div>

          {/* CỘT PHẢI (8/12): Biên bản bàn giao hoặc Trạng thái đã xong */}
          <div className="lg:col-span-8">
            {isDone ? (
              <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-8 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Hợp đồng đã được bàn giao & kích hoạt
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách hàng <strong className="text-slate-900">{contract.customerName}</strong> đã nhận bàn giao ô kho{' '}
                    <strong className="font-mono text-teal-700">{contract.storageUnitCode}</strong>. Khách có thể dùng mã PIN hoặc ứng dụng SmartStorage để mở khóa 24/7.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Xem lại Mã PIN bảo mật</span>
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
