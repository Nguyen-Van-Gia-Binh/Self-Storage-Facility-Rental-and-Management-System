import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export interface UnitUnavailableModalState {
  isOpen: boolean;
  title: string;
  message: string;
}

export interface PendingLimitModalState {
  isOpen: boolean;
  pendingReservation: any | null;
}

interface UnitPickerModalsProps {
  facilityInactiveModalOpen: boolean;
  onCloseFacilityInactive: () => void;
  unitUnavailableModal: UnitUnavailableModalState;
  onCloseUnitUnavailable: () => void;
  pendingLimitModal: PendingLimitModalState;
  onClosePendingLimit: () => void;
  onPayPendingReservation: (reservation: any) => void;
}

/**
 * Cụm 3 Modal an ninh cho UnitPickerPage:
 * 1. Cảnh báo cơ sở ngừng hoạt động (ISS-75)
 * 2. Cảnh báo ô kho không khả dụng (bảo trì / đã có người cọc / unlisted) (ISS-76, ISS-80)
 * 3. Cảnh báo giới hạn 1 đơn giữ chỗ PENDING_PAYMENT (BR-RES-02, ISS-99)
 */
export const UnitPickerModals: React.FC<UnitPickerModalsProps> = ({
  facilityInactiveModalOpen,
  onCloseFacilityInactive,
  unitUnavailableModal,
  onCloseUnitUnavailable,
  pendingLimitModal,
  onClosePendingLimit,
  onPayPendingReservation,
}) => {
  return (
    <>
      {/* 1. Modal cảnh báo khi cơ sở ngừng hoạt động */}
      <Modal isOpen={facilityInactiveModalOpen} onClose={onCloseFacilityInactive}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Cơ sở tạm ngừng hoạt động</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cơ sở lưu trữ bạn đang chọn hiện đã tạm dừng phục vụ. Quý khách vui lòng chọn cơ sở khác đang hoạt động.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={onCloseFacilityInactive}
            >
              Quay lại danh sách cơ sở
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Modal cảnh báo ô kho không khả dụng */}
      <Modal isOpen={unitUnavailableModal.isOpen} onClose={onCloseUnitUnavailable}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{unitUnavailableModal.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {unitUnavailableModal.message}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={onCloseUnitUnavailable}
            >
              Đã hiểu, chọn ô kho khác
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Modal cảnh báo giới hạn 1 đơn giữ chỗ PENDING_PAYMENT */}
      <Modal isOpen={pendingLimitModal.isOpen} onClose={onClosePendingLimit}>
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Quý khách đang có đơn giữ chỗ</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Quý khách vui lòng thanh toán ô kho{' '}
              <strong className="text-slate-900 font-semibold">
                {pendingLimitModal.pendingReservation?.storageUnitCode || pendingLimitModal.pendingReservation?.code || ''}
              </strong>
              {pendingLimitModal.pendingReservation?.facilityName ? ` (tại ${pendingLimitModal.pendingReservation.facilityName})` : ''}{' '}
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
              onClick={onClosePendingLimit}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
