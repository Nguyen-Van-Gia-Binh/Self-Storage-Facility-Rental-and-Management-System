import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, XCircle } from 'lucide-react';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
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

  // Hỗ trợ Waitlist và Chống Spam Bom hàng
  onOpenWaitlist?: () => void;
  spamBlockedModal?: {
    isOpen: boolean;
    facilityPhone?: string;
  };
  onCloseSpamBlockedModal?: () => void;
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
  onOpenWaitlist,
  spamBlockedModal,
  onCloseSpamBlockedModal,
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
              Nếu hủy đơn, ô kho đang giữ chỗ sẽ được giải phóng ngay lập tức trên hệ thống.
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
            {unavailableModal.title === 'Hết chỗ' && onOpenWaitlist ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-center py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
                  onClick={onCloseUnavailableModal}
                >
                  Chọn hạng kho khác
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 justify-center py-2.5 text-xs sm:text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => {
                    onCloseUnavailableModal();
                    onOpenWaitlist();
                  }}
                >
                  Đăng ký Danh sách chờ
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
                onClick={onCloseUnavailableModal}
              >
                Quay lại
              </Button>
            )}
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
                {isStorageUnitAssigned(pendingLimitModal.pendingReservation?.storageUnitCode)
                  ? pendingLimitModal.pendingReservation.storageUnitCode
                  : pendingLimitModal.pendingReservation?.unitTypeName ||
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

      {/* 5. Modal cảnh báo bị chặn do Spam Bom hàng (BR-SPAM-01) */}
      {spamBlockedModal && (
        <Modal isOpen={spamBlockedModal.isOpen} onClose={onCloseSpamBlockedModal || (() => {})}>
          <div className="p-6 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Tài khoản tạm khóa chức năng đặt kho</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chức năng đặt kho tạm thời bị khóa trong ngày vì bạn đã hủy hoặc bỏ thanh toán quá 5 lần trong hôm nay.
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs space-y-1">
              <span className="font-semibold text-amber-900">Liên hệ Quản lý cơ sở để được hỗ trợ:</span>
              <div className="flex items-center justify-between text-slate-700 pt-1">
                <span>Hotline Quản lý:</span>
                <a
                  href={`tel:${spamBlockedModal.facilityPhone || '1900-2026'}`}
                  className="font-bold text-brand-700 hover:underline"
                >
                  {spamBlockedModal.facilityPhone || '1900-2026'}
                </a>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${spamBlockedModal.facilityPhone || '1900-2026'}`}
                className="flex-1 inline-flex items-center justify-center py-2.5 text-xs sm:text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
              >
                Gọi Hotline Quản lý
              </a>
              <Button
                variant="outline"
                className="flex-1 justify-center py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
                onClick={onCloseSpamBlockedModal}
              >
                Đã hiểu & Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
