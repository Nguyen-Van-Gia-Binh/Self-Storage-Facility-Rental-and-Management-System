import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { ChangePinModal } from './ChangePinModal';
import { ScheduleReturnModal } from './ScheduleReturnModal';
import { ContractDetailModal } from './ContractDetailModal';
import { ReschedulePeriodModal } from './ReschedulePeriodModal';
import { CancelCheckInModal } from './CancelCheckInModal';
import { EarlyRenewalReminderModal } from './EarlyRenewalReminderModal';
import { OverduePenaltyPaymentModal } from './OverduePenaltyPaymentModal';
import type { ReservationResponse } from '@/api/reservation';
import type { RentedContract } from '../types';

interface MyUnitsModalsProps {
  // 1. Đổi PIN
  selectedPinContract: RentedContract | null;
  onClosePinModal: () => void;
  onPinChanged: (contractId: string, newPin: string) => void;

  // 2. Hẹn ngày trả kho
  selectedReturnContract: RentedContract | null;
  onCloseReturnModal: () => void;
  onReturnScheduled: (contractId: string, returnDate: string) => void;

  // 3. Chi tiết hợp đồng
  selectedDetailContract: RentedContract | null;
  onCloseDetailModal: () => void;
  onSelectReturnFromDetail: (contract: RentedContract) => void;
  onSelectPinFromDetail: (contract: RentedContract) => void;
  onSelectRescheduleFromDetail: (contract: RentedContract) => void;

  // 4. Đổi ngày nhận kho
  selectedRescheduleContract: RentedContract | null;
  onCloseRescheduleModal: () => void;
  onRescheduleSuccess: () => void;

  // 5. Hủy nhận kho
  selectedCancelCheckInContract: RentedContract | null;
  onCloseCancelCheckInModal: () => void;
  onCancelCheckInSuccess: () => void;

  // 6. Nhắc gia hạn sớm
  showEarlyRenewalModal: boolean;
  onCloseEarlyRenewalModal: () => void;
  earlyRenewalContract: RentedContract | null;
  noticeDays: number;
  reminderDays: number[];

  // 7. Nộp phạt quá hạn
  selectedOverdueContract: RentedContract | null;
  onCloseOverdueModal: () => void;
  onOverduePaymentSuccess: () => void;

  // 8. Hủy giữ chỗ 48h
  cancellingReservation: ReservationResponse | null;
  onCloseCancelReservationModal: () => void;
  onConfirmCancelReservation: () => void;
  isCancelling: boolean;
  cancelError: string | null;

  // 9. Hủy yêu cầu trả kho
  selectedCancelReturnContract: RentedContract | null;
  onCloseCancelReturnModal: () => void;
  onConfirmCancelReturn: () => void;
  isCancellingReturn: boolean;
  cancelReturnError: string | null;
}

export const MyUnitsModals: React.FC<MyUnitsModalsProps> = ({
  selectedPinContract,
  onClosePinModal,
  onPinChanged,
  selectedReturnContract,
  onCloseReturnModal,
  onReturnScheduled,
  selectedDetailContract,
  onCloseDetailModal,
  onSelectReturnFromDetail,
  onSelectPinFromDetail,
  onSelectRescheduleFromDetail,
  selectedRescheduleContract,
  onCloseRescheduleModal,
  onRescheduleSuccess,
  selectedCancelCheckInContract,
  onCloseCancelCheckInModal,
  onCancelCheckInSuccess,
  showEarlyRenewalModal,
  onCloseEarlyRenewalModal,
  earlyRenewalContract,
  noticeDays,
  reminderDays,
  selectedOverdueContract,
  onCloseOverdueModal,
  onOverduePaymentSuccess,
  cancellingReservation,
  onCloseCancelReservationModal,
  onConfirmCancelReservation,
  isCancelling,
  cancelError,
  selectedCancelReturnContract,
  onCloseCancelReturnModal,
  onConfirmCancelReturn,
  isCancellingReturn,
  cancelReturnError,
}) => {
  return (
    <>
      {/* 1. Modal đổi mã PIN mở khóa kho */}
      <ChangePinModal
        isOpen={Boolean(selectedPinContract)}
        onClose={onClosePinModal}
        contract={selectedPinContract}
        onPinChanged={onPinChanged}
      />

      {/* 2. Modal đăng ký lịch trả kho */}
      <ScheduleReturnModal
        isOpen={Boolean(selectedReturnContract)}
        onClose={onCloseReturnModal}
        contract={selectedReturnContract}
        onReturnScheduled={onReturnScheduled}
      />

      {/* 3. Modal xem chi tiết hợp đồng điện tử */}
      <ContractDetailModal
        isOpen={Boolean(selectedDetailContract)}
        onClose={onCloseDetailModal}
        contract={selectedDetailContract}
        onScheduleReturn={onSelectReturnFromDetail}
        onChangePin={onSelectPinFromDetail}
        onReschedulePeriod={onSelectRescheduleFromDetail}
      />

      {/* 4. Modal thay đổi ngày hẹn nhận kho */}
      <ReschedulePeriodModal
        isOpen={Boolean(selectedRescheduleContract)}
        onClose={onCloseRescheduleModal}
        contract={selectedRescheduleContract}
        onSuccess={onRescheduleSuccess}
      />

      {/* 5. Modal hủy nhận kho và hoàn tiền cọc */}
      <CancelCheckInModal
        isOpen={Boolean(selectedCancelCheckInContract)}
        onClose={onCloseCancelCheckInModal}
        contract={selectedCancelCheckInContract}
        onSuccess={onCancelCheckInSuccess}
      />

      {/* 6. Pop-up tự động nhắc gia hạn hợp đồng sớm */}
      <EarlyRenewalReminderModal
        isOpen={showEarlyRenewalModal}
        onClose={onCloseEarlyRenewalModal}
        contract={earlyRenewalContract}
        noticeDays={noticeDays}
        reminderDays={reminderDays}
      />

      {/* 7. Modal thanh toán phí quá hạn hoặc công nợ quyết toán VNPay */}
      {selectedOverdueContract && (
        <OverduePenaltyPaymentModal
          isOpen={Boolean(selectedOverdueContract)}
          onClose={onCloseOverdueModal}
          onPaymentSuccess={onOverduePaymentSuccess}
          unitNumber={selectedOverdueContract.unitNumber}
          facilityName={selectedOverdueContract.facilityName}
          totalAmount={
            selectedOverdueContract.status === 'TERMINATED' ||
            selectedOverdueContract.status === 'PENDING_RETURN'
              ? selectedOverdueContract.totalOutstandingDebt || selectedOverdueContract.overdueFee || 0
              : selectedOverdueContract.overdueFee || 0
          }
          contractId={Number(selectedOverdueContract.id)}
          paymentType={
            selectedOverdueContract.status === 'TERMINATED' ||
            selectedOverdueContract.status === 'PENDING_RETURN'
              ? 'SETTLEMENT'
              : 'OVERDUE_PENALTY'
          }
        />
      )}

      {/* 8. Modal xác nhận hủy đơn giữ chỗ */}
      <Modal
        isOpen={Boolean(cancellingReservation)}
        onClose={onCloseCancelReservationModal}
        className="max-w-md w-full"
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Xác nhận hủy giữ chỗ
            </h3>
            <button
              type="button"
              disabled={isCancelling}
              onClick={onCloseCancelReservationModal}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer text-lg leading-none"
            >
              ×
            </button>
          </div>

          {cancellingReservation && (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">
                Bạn đang thực hiện hủy đơn giữ chỗ cho ô kho:
              </p>
              {/* Khối tóm tắt thông tin đơn hàng (Nền xám nhạt) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  Mã đơn: {cancellingReservation.code || `#${cancellingReservation.id}`}
                </p>
                <p className="text-xs sm:text-sm text-slate-500">
                  {[cancellingReservation.unitTypeName, cancellingReservation.facilityName]
                    .filter(Boolean)
                    .join(' - ') || 'Chi tiết ô kho lưu trữ'}
                </p>
              </div>

              {/* Cảnh báo hậu quả (Dùng text, không dùng nền đỏ) */}
              <p className="text-xs sm:text-sm text-rose-600 font-medium leading-relaxed">
                Thao tác này không thể hoàn tác. Tiền cọc của bạn sẽ được xử lý theo chính sách hoàn hủy của hệ thống.
              </p>
            </div>
          )}

          {cancelError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={onCloseCancelReservationModal}
              className="text-slate-700 hover:bg-slate-100"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isCancelling}
              onClick={onConfirmCancelReservation}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors"
            >
              {isCancelling ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy giữ chỗ'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Modal xác nhận hủy yêu cầu trả kho (ISS-125) */}
      <Modal
        isOpen={Boolean(selectedCancelReturnContract)}
        onClose={onCloseCancelReturnModal}
        className="max-w-md w-full"
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Xác nhận hủy yêu cầu trả kho
            </h3>
            <button
              type="button"
              disabled={isCancellingReturn}
              onClick={onCloseCancelReturnModal}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ×
            </button>
          </div>

          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn hủy yêu cầu trả kho cho ô kho{' '}
            <strong className="text-slate-900">
              {selectedCancelReturnContract?.unitNumber}
            </strong>
            ?
          </p>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed">
            Sau khi hủy, hợp đồng sẽ tiếp tục được duy trì hoạt động bình thường. Bạn vẫn có thể tiếp tục sử dụng mã PIN để mở khóa ô kho.
          </div>

          {cancelReturnError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {cancelReturnError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCloseCancelReturnModal}
              disabled={isCancellingReturn}
              className="text-slate-700 hover:bg-slate-100"
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onConfirmCancelReturn}
              disabled={isCancellingReturn}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isCancellingReturn ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy yêu cầu'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
