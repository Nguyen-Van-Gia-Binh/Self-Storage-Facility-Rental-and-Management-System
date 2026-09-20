import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { CheckInContract, CheckInSubmitRequest, HandoverRejectRequest } from '../../../types';
import { getPendingContracts, checkInContract, rejectHandoverContract } from '../../../api/contract';
import { CheckInQueueList } from '../components/CheckInQueueList';
import { CustomerVerificationCard } from '../components/CustomerVerificationCard';
import { HandoverInspectionForm } from '../components/HandoverInspectionForm';
import { AccessCodePinModal } from '../components/AccessCodePinModal';
import { HandoverRejectionModal } from '../components/HandoverRejectionModal';

export const StaffCheckInPage: React.FC = () => {
  const [contracts, setContracts] = useState<CheckInContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<CheckInContract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  // Tải danh sách hợp đồng chờ check-in
  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPendingContracts(1); // Mặc định Facility 1: District 7 Flagship
      setContracts(data);
      if (data.length > 0) {
        // Mặc định chọn hợp đồng đầu tiên nếu chưa chọn hoặc id cũ không còn
        setSelectedContract((prev) => {
          if (!prev) return data[0];
          const exists = data.find((c) => c.id === prev.id);
          return exists || data[0];
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách check-in:', error);
      showToast('error', 'Không thể tải danh sách hợp đồng chờ tiếp đón.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Xử lý nộp biên bản bàn giao & kích hoạt PIN (Happy Path)
  const handleHandoverSubmit = async (request: CheckInSubmitRequest) => {
    if (!selectedContract) return;

    setIsSubmitting(true);
    try {
      const res = await checkInContract(selectedContract.id, request);
      setCurrentPin(res.accessCode);
      setIsPinModalOpen(true);
      showToast('success', `Bàn giao thành công ô kho ${selectedContract.storageUnitCode}. Hợp đồng đã kích hoạt ACTIVE.`);

      // Cập nhật lại danh sách trên UI
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? { ...c, status: 'ACTIVE', appointmentTime: 'Đã hoàn tất bàn giao' }
            : c
        )
      );
      setSelectedContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'ACTIVE',
              appointmentTime: 'Đã hoàn tất bàn giao',
            }
          : null
      );
    } catch (error) {
      console.error('Lỗi khi bàn giao kho:', error);
      showToast('error', 'Xảy ra lỗi trong quá trình lưu biên bản bàn giao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý từ chối nhận kho / Báo hỏng (Exception Path theo BR-CHK-06)
  const handleRejectionConfirm = async (reason: string, reportedDefects: string) => {
    if (!selectedContract) return;

    setIsSubmitting(true);
    try {
      const req: HandoverRejectRequest = {
        rejectionReason: reason,
        reportedDefects,
      };
      await rejectHandoverContract(selectedContract.id, req);
      setIsRejectionModalOpen(false);
      showToast('error', `Đã khóa ô kho ${selectedContract.storageUnitCode} sang MAINTENANCE và hủy lượt bàn giao.`);

      // Cập nhật lại danh sách trên UI
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id
            ? { ...c, status: 'TERMINATED', appointmentTime: 'Đã từ chối nhận (Bảo trì)' }
            : c
        )
      );
      setSelectedContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'TERMINATED',
              appointmentTime: 'Đã từ chối nhận (Bảo trì)',
            }
          : null
      );
    } catch (error) {
      console.error('Lỗi khi từ chối bàn giao:', error);
      showToast('error', 'Lỗi khi ghi nhận từ chối bàn giao.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
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

      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              SCR-FS-01 • Quy Trình Flow 2
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Bàn giao & Ký số điện tử</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-brand-600" />
            Bàn Giao Kho & Tiếp Đón Check-in
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác minh danh tính khách, đối soát thanh toán 100%, nghiệm thu hiện trạng mặt bằng và kích hoạt mã PIN mở cửa 24/7.
          </p>
        </div>

        {/* Thanh công cụ cơ sở & làm mới */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Cơ sở:</span>
            <span className="font-bold text-slate-900">District 7 Flagship</span>
          </div>

          <button
            type="button"
            onClick={loadContracts}
            disabled={isLoading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-600 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2-Column Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Cột trái (38% ~ 5/12): Queue List */}
        <div className="lg:col-span-5 h-[calc(100vh-14rem)] min-h-[580px]">
          <CheckInQueueList
            contracts={contracts}
            selectedContractId={selectedContract?.id || null}
            onSelectContract={(contract) => setSelectedContract(contract)}
            isLoading={isLoading}
          />
        </div>

        {/* Cột phải (62% ~ 7/12): Active Handover Desk */}
        <div className="lg:col-span-7 space-y-4">
          {selectedContract ? (
            <>
              {/* Thẻ xác minh thông tin khách & Ô kho */}
              <CustomerVerificationCard contract={selectedContract} />

              {/* Trạng thái đã hoàn tất hoặc bị hủy */}
              {selectedContract.status === 'ACTIVE' ? (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-300 p-6 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-900">
                    HỢP ĐỒNG ĐÃ ĐƯỢC BÀN GIAO & KÍCH HOẠT (ACTIVE)
                  </h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Khách hàng <strong className="text-emerald-950">{selectedContract.customerName}</strong> đã nhận bàn giao ô kho <strong className="font-mono text-emerald-950">{selectedContract.storageUnitCode}</strong>. Khách có thể dùng mã PIN hoặc mã QR trên điện thoại để ra vào cơ sở bất kỳ lúc nào.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    Xem lại Mã PIN bảo mật
                  </button>
                </div>
              ) : selectedContract.status === 'TERMINATED' ? (
                <div className="bg-red-50 rounded-2xl border border-red-300 p-6 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-700 mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-red-900">
                    LƯỢT BÀN GIAO ĐÃ BỊ HỦY BỎ DO PHÁT SINH SỰ CỐ
                  </h3>
                  <p className="text-xs text-red-800 max-w-md mx-auto leading-relaxed">
                    Ô kho <strong className="font-mono text-red-950">{selectedContract.storageUnitCode}</strong> đã được chuyển sang trạng thái <strong>MAINTENANCE</strong> (Bảo trì). Lệnh hoàn tiền 100% đã được gửi sang Quản lý cơ sở (FM) để hoàn tất trong 3 ngày làm việc theo quy định <code>BR-CHK-06</code>.
                  </p>
                </div>
              ) : (
                /* Form kiểm tra hiện trạng và ký số (PENDING_CHECK_IN) */
                <HandoverInspectionForm
                  contract={selectedContract}
                  onSubmitHandover={handleHandoverSubmit}
                  onOpenRejectionModal={() => setIsRejectionModalOpen(true)}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-sm">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">Chưa chọn lượt hẹn bàn giao</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Vui lòng chọn một khách hàng từ danh sách hàng đợi bên trái hoặc nhập mã đơn / số CCCD vào ô tìm kiếm để bắt đầu quy trình đón tiếp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedContract && (
        <>
          <AccessCodePinModal
            isOpen={isPinModalOpen}
            onClose={() => setIsPinModalOpen(false)}
            accessCode={currentPin}
            contract={selectedContract}
          />

          <HandoverRejectionModal
            isOpen={isRejectionModalOpen}
            onClose={() => setIsRejectionModalOpen(false)}
            contract={selectedContract}
            onConfirmRejection={handleRejectionConfirm}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </div>
  );
};
