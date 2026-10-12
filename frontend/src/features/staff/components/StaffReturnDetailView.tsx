import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { DailyReturnTask, ReturnContractDetail, ReturnInspectionRequest } from '@/types';
import { getReturnContractById, submitReturnInspection, completeUnitCleaning } from '@/api/contract';
import { useCurrentUser } from '@/utils/useCurrentUser';
import { ReturnInspectionForm } from './ReturnInspectionForm';
import { ReturnSuccessModal } from './ReturnSuccessModal';

export interface StaffReturnDetailViewProps {
  task: DailyReturnTask;
  onBack: () => void;
  onSuccess: () => void;
}

export const StaffReturnDetailView: React.FC<StaffReturnDetailViewProps> = ({
  task,
  onBack,
  onSuccess,
}) => {
  const user = useCurrentUser();
  const staffId = user?.id ? Number(user.id) : undefined;

  const [contract, setContract] = useState<ReturnContractDetail | null>(null);
  const [, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success modal
  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    contractCode: string;
    unitCode: string;
    customerName: string;
    refundAmount: number;
  }>({
    isOpen: false,
    contractCode: '',
    unitCode: '',
    customerName: '',
    refundAmount: 0,
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Nạp chi tiết hợp đồng trả kho từ API backend
  const loadContractDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!task.contractId) {
        throw new Error('Nhiệm vụ không có mã hợp đồng hợp lệ.');
      }
      const data = await getReturnContractById(task.contractId);
      setContract(data);
    } catch (err: any) {
      console.warn('Lỗi nạp hợp đồng trả kho:', err);
      setErrorMsg(err?.message || 'Không thể tải thông tin hợp đồng từ hệ thống.');
      // Tạo đối tượng fallback từ thông tin trong task
      setContract({
        id: task.contractId,
        code: task.contractCode || `HD-${task.contractId}`,
        storageUnitId: 0,
        storageUnitCode: task.unitCode,
        unitTypeName: 'Tiêu chuẩn',
        facilityId: task.facilityId || 0,
        facilityName: task.facilityName || 'Cơ sở hiện tại',
        customerId: 0,
        customerName: task.customerName,
        customerPhone: task.customerPhone || '',
        customerIdentityNumber: 'Đang cập nhật',
        startDate: '',
        endDateExclusive: '',
        rentalMonths: 1,
        monthlyPrice: 0,
        depositAmount: task.depositAmount || 0,
        status: task.status || 'PENDING_RETURN',
        isInspected: false,
      });
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    loadContractDetail();
  }, [loadContractDetail]);

  const handleSubmitInspection = async (data: ReturnInspectionRequest) => {
    if (!contract) return;
    setSubmitting(true);
    try {
      const res = await submitReturnInspection(contract.id, data, staffId);
      showToast('success', 'Đã hoàn tất biên bản nghiệm thu hiện trạng trả kho!');

      setSuccessData({
        isOpen: true,
        contractCode: contract.code,
        unitCode: contract.storageUnitCode,
        customerName: contract.customerName,
        refundAmount: res.estimatedDepositRefund,
      });
    } catch (err: any) {
      console.error('Lỗi khi nộp biên bản nghiệm thu:', err);
      showToast('error', err?.message || 'Đã xảy ra lỗi khi nộp biên bản nghiệm thu.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = Boolean(
    task.completed ||
      task.status === 'COMPLETED' ||
      task.status === 'INSPECTED' ||
      task.status === 'RETURNED' ||
      contract?.isInspected ||
      contract?.status === 'INSPECTED',
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hiển thị lỗi nếu có */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg} (Hiển thị dữ liệu ca trực sẵn có)</span>
          </div>
          <button
            type="button"
            onClick={loadContractDetail}
            className="font-bold underline hover:text-amber-900 ml-2"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Nội dung chi tiết 2 cột (Tràn màn hình in-place) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4/12): Thông tin khách hàng, ô kho & hồ sơ cọc */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Quay lại Nhiệm vụ ca trực"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Hồ sơ trả kho
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-500">
                #{task.contractCode || task.contractId}
              </span>
            </div>

            {/* Thông tin ô kho */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Ô kho trả:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-sm">
                  {task.unitCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Loại ô kho:</span>
                <span className="font-medium text-slate-800">
                  {contract?.unitTypeName || 'Ô kho tiêu chuẩn'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Cơ sở:</span>
                <span className="font-medium text-slate-800 truncate max-w-[160px]">
                  {task.facilityName || contract?.facilityName || 'Cơ sở hiện tại'}
                </span>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{task.customerName}</span>
              </div>

              {task.customerPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{task.customerPhone}</span>
                  </div>
                  <a
                    href={`tel:${task.customerPhone}`}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                  >
                    <span>Gọi điện</span>
                  </a>
                </div>
              )}

              {contract?.customerIdentityNumber && (
                <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>CCCD: <strong className="font-mono text-slate-700">{contract.customerIdentityNumber}</strong></span>
                </div>
              )}
            </div>

            {/* Thông tin thời gian & cọc */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Giờ hẹn trả:
                </span>
                <strong className="text-slate-900 font-medium">
                  {task.appointmentTime || 'Trong ca trực'}
                </strong>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Tiền cọc gốc:
                </span>
                <strong className="font-mono text-sm text-emerald-700 font-bold">
                  {(task.depositAmount || contract?.depositAmount || 0).toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            {/* Chỉ dẫn nhân viên */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quy trình nghiệm thu (FS-04)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                <li>Kiểm tra khách đã dọn sạch toàn bộ tài sản.</li>
                <li>Đánh giá hiện trạng vách tường, sàn, ổ khóa.</li>
                <li>Lựa chọn phụ phí vệ sinh/sửa chữa từ danh mục nếu có tổn hại.</li>
                <li>Lấy chữ ký điện tử xác nhận của khách hàng.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8/12): Form Nghiệm thu trả kho */}
        <div className="lg:col-span-8 space-y-4">
          {contract ? (
            isCompleted ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ô kho {task.unitCode} đã được nghiệm thu trả kho thành công
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Biên bản nghiệm thu hiện trường và bảng tính khấu trừ cọc đã được ghi nhận vào hệ thống. Ô kho sẵn sàng cho quy trình vệ sinh bàn giao lượt mới.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại danh sách ca trực</span>
                  </button>
                </div>
              </div>
            ) : (
              <ReturnInspectionForm
                contract={contract}
                onSubmit={handleSubmitInspection}
                isSubmitting={submitting}
              />
            )
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Đang tải biểu mẫu nghiệm thu...</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal thành công & Hoàn tất nghiệm thu */}
      <ReturnSuccessModal
        isOpen={successData.isOpen}
        contractCode={successData.contractCode}
        unitCode={successData.unitCode}
        customerName={successData.customerName}
        refundAmount={successData.refundAmount}
        onClose={() => {
          setSuccessData((prev) => ({ ...prev, isOpen: false }));
          onSuccess();
          onBack();
        }}
        onMarkCleaned={
          contract
            ? async () => {
                try {
                  await completeUnitCleaning(contract.id);
                  showToast('success', 'Đã đánh dấu hoàn tất dọn dẹp vệ sinh ô kho!');
                } catch (err: any) {
                  showToast('error', err?.message || 'Không thể cập nhật trạng thái vệ sinh.');
                }
              }
            : undefined
        }
      />
    </div>
  );
};
