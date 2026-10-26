import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, XCircle } from 'lucide-react';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';
import type { MoveInPassData } from '@/types';

interface BookingModalsProps {
  // Modal 1: Hủy đặt chỗ (ISS-77)
  showCancelModal: boolean;
  onCloseCancelModal: () => void;
  onConfirmCancelReservation: () => void;
  isCancellingReservation: boolean;
  cancelError: string | null;

  // Modal 2: Cảnh báo ô kho / cơ sở không khả dụng (ISS-75, ISS-80)
  unavailableModal: {
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'NAVIGATE_HOME' | 'NAVIGATE_UNITS';
  };
  onCloseUnavailableModal: () => void;

  // Modal 3: Giới hạn 1 đơn giữ chỗ PENDING_PAYMENT (ISS-99, BR-RES-02)
  pendingLimitModal: {
    isOpen: boolean;
    pendingReservation: any | null;
  };
  onClosePendingLimitModal: () => void;
  onPayPendingReservation: (rsv: any) => void;

  // Modal 4: Vé vào cổng điện tử Digital Move-in Pass
  showPassModal: boolean;
  createdPass: MoveInPassData | null;
  onClosePassModal: () => void;
}

export const BookingModals: React.FC<BookingModalsProps> = ({
  showCancelModal,
  onCloseCancelModal,
  onConfirmCancelReservation,
  isCancellingReservation,
  cancelError,
  unavailableModal,
  onCloseUnavailableModal,
  pendingLimitModal,
  onClosePendingLimitModal,
  onPayPendingReservation,
  showPassModal,
  createdPass,
  onClosePassModal,
}) => {
  return (
    <>
      {/* 1. Modal hủy đặt chỗ giải phóng ô kho (ISS-77) */}
      <Modal isOpen={showCancelModal} onClose={onCloseCancelModal}>
        <div className="p-6 max-w-md w-full space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận hủy giữ chỗ</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Nếu hủy đơn, ô kho đang giữ chỗ sẽ được giải phóng ngay lập tức trên hệ thống cho khách hàng khác.
            </p>
          </div>
          {cancelError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 justify-center py-2.5 text-xs font-bold"
              onClick={onCloseCancelModal}
            >
              Quay lại (Giữ đơn)
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={onConfirmCancelReservation}
              disabled={isCancellingReservation}
            >
              {isCancellingReservation ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Modal cảnh báo ô kho / cơ sở tạm dừng (ISS-75, ISS-80) */}
      <Modal isOpen={unavailableModal.isOpen} onClose={onCloseUnavailableModal}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{unavailableModal.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {unavailableModal.message}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={onCloseUnavailableModal}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Modal cảnh báo giới hạn 1 đơn giữ chỗ PENDING_PAYMENT (ISS-99, BR-RES-02) */}
      <Modal isOpen={pendingLimitModal.isOpen} onClose={onClosePendingLimitModal}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Quý khách đang có đơn giữ chỗ</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Quý khách vui lòng thanh toán ô kho{' '}
              <strong className="text-slate-900 font-semibold">
                {pendingLimitModal.pendingReservation?.storageUnitCode ||
                  pendingLimitModal.pendingReservation?.code ||
                  'đang giữ chỗ'}
              </strong>
              {pendingLimitModal.pendingReservation?.facilityName
                ? ` (tại ${pendingLimitModal.pendingReservation.facilityName})`
                : ''}{' '}
              trước khi đặt ô kho khác.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={() => onPayPendingReservation(pendingLimitModal.pendingReservation)}
            >
              Thanh toán ô kho đang giữ chỗ
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800"
              onClick={onClosePendingLimitModal}
            >
              Quay lại danh sách ô kho
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Modal vé vào cổng điện tử Digital Move-in Pass */}
      {showPassModal && createdPass && (
        <DigitalMoveInPassModal
          isOpen={showPassModal}
          onClose={onClosePassModal}
          passData={createdPass}
        />
      )}
    </>
  );
};
