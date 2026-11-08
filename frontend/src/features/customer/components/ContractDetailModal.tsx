import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Calendar,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Printer,
  CheckSquare,
  Circle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import { getMyRentalDetail, type CustomerRentalDetail } from '@/api/customerRentals';
import type { RentedContract } from '../types';
import { ContractPrintDocument } from './ContractPrintDocument';

export interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onScheduleReturn?: (contract: RentedContract) => void;
  onChangePin?: (contract: RentedContract) => void;
  onReschedulePeriod?: (contract: RentedContract) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
  onScheduleReturn,
  onChangePin,
  onReschedulePeriod,
}) => {
  const [detail, setDetail] = useState<CustomerRentalDetail | null>(null);
  const [isClosing, setIsClosing] = useState(false);


  useEffect(() => {
    if (!isOpen || !contract) {
      setDetail(null);
      return;
    }
    setDetail(null);
    let isMounted = true;

    // Tải chi tiết bổ sung từ backend (thông tin khách hàng, biên bản bàn giao, phụ lục đổi kho)
    getMyRentalDetail(Number(contract.id))
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        console.error('Lỗi tải chi tiết hợp đồng:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contract?.id]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDetail(null);
    }, 180);
  };

  const handlePrint = () => {
    window.print();
  };

  // Chỉ chấp nhận detail khi ID hoặc mã hợp đồng trùng khớp hoàn toàn với contract prop hiện tại (chống stale state giữa các HĐ khác nhau)
  const isCurrentContractDetail = detail && (String(detail.id) === String(contract.id) || detail.contractCode === contract.contractNumber);
  const effectiveDetail = isCurrentContractDetail ? detail : null;

  const effectiveContractNumber = contract.contractNumber || effectiveDetail?.contractCode || `CTR-${contract.id}`;
  const effectiveStatus = (contract.status || effectiveDetail?.status) as string;
  const isCancelledAtHandover = effectiveStatus === 'TERMINATED';
  const isClosed = effectiveStatus === 'CLOSED';
  const isRelocating =
    !isCancelledAtHandover &&
    !isClosed &&
    (effectiveStatus === 'PENDING_CHECKIN' ||
      effectiveStatus === 'PENDING_CHECK_IN' ||
      effectiveStatus === 'ACTIVE') &&
    Boolean(contract.relocationEligible || effectiveDetail?.relocationEligible);
  const rawUnitNumber = effectiveDetail?.unitCode || contract.unitNumber;
  const effectiveUnitNumber = isRelocating && (effectiveStatus === 'PENDING_CHECKIN' || effectiveStatus === 'PENDING_CHECK_IN')
    ? 'Chờ cấp ô mới'
    : rawUnitNumber || 'Chưa gán';
  const effectiveFacilityName = effectiveDetail?.facilityName || contract.facilityName;
  const effectiveFacilityAddress = effectiveDetail?.facilityAddress || 'Cơ sở trực thuộc Hệ thống Self-Storage';
  const effectiveFacilityPhone = effectiveDetail?.facilityPhone || '1900 8888';
  const effectiveCustomerName = effectiveDetail?.customerName || contract.customerName || 'Nguyễn Văn Khách';
  const effectiveCustomerPhone = effectiveDetail?.customerPhone || contract.customerPhone || '0987654321';
  const effectiveCustomerIdentity = effectiveDetail?.customerIdentityNumber || contract.customerIdentityNumber || '079201001234';
  const effectiveCustomerEmail = effectiveDetail?.customerEmail || contract.customerEmail || 'khachhang@smartstorage.vn';
  const effectiveUnitTypeName = effectiveDetail?.unitTypeName || contract.unitTypeName;
  const effectiveDimensions = effectiveDetail?.unitDimensions || contract.unitDimensions || '1.5m x 2.0m x 2.5m';
  const effectiveFloor = effectiveDetail?.floor ?? contract.floor ?? 1;
  const effectivePosition = effectiveDetail?.position || contract.position || 'Khu A';

  const isPendingCheckin =
    effectiveStatus === 'PENDING_CHECKIN' ||
    effectiveStatus === 'PENDING_CHECK_IN';

  // Xác định chữ Watermark tương ứng
  let watermarkText = 'HỢP ĐỒNG HIỆU LỰC';
  if (effectiveStatus === 'TERMINATED') {
    if (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND')) {
      watermarkText = 'TỪ CHỐI NHẬN - HOÀN 100%';
    } else if (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) {
      watermarkText = 'ĐÃ HỦY - HOÀN CỌC 100%';
    } else {
      watermarkText = 'ĐÃ HỦY - GIẢI PHÓNG Ô';
    }
  } else if (contract.relocationEligible || effectiveDetail?.relocationEligible) {
    watermarkText = 'ĐANG ĐỔI Ô KHO';
  } else if (effectiveStatus === 'OVERDUE') {
    watermarkText = 'HỢP ĐỒNG QUÁ HẠN';
  } else if (effectiveStatus === 'PENDING_RETURN') {
    watermarkText = 'CHỜ TRẢ KHO & HOÀN CỌC';
  } else if (effectiveStatus === 'CLOSED') {
    watermarkText = 'ĐÃ THANH LÝ HỢP ĐỒNG';
  } else if (isPendingCheckin) {
    watermarkText = 'CHỜ BÀN GIAO';
  }

  const isHandoverCompleted =
    !isPendingCheckin &&
    !isCancelledAtHandover;

  const effectiveCheckinDate = isHandoverCompleted
    ? (effectiveDetail?.checkinDate || contract.checkinDate || contract.startDate)
    : isCancelledAtHandover
      ? 'Không nhận kho (Đã dừng hợp đồng do sự cố)'
      : 'Chưa thực hiện (Chờ làm thủ tục nhận kho tại quầy)';
  const effectiveHandoverStaff = isHandoverCompleted || isCancelledAtHandover
    ? (effectiveDetail?.handoverStaffName || contract.handoverStaffName || 'Nhân viên lễ tân cơ sở')
    : 'Chờ phân công tiếp đón tại quầy';
  const effectiveHandoverNote = isClosed
    ? 'Đã hoàn tất nghiệm thu và quyết toán hợp đồng'
    : isHandoverCompleted
      ? (effectiveDetail?.handoverConditionNote || contract.handoverConditionNote || 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao')
      : isCancelledAtHandover
        ? (effectiveDetail?.handoverConditionNote || contract.handoverConditionNote || 'Không đạt chuẩn nhận kho do phát sinh sự cố hư hỏng tại chỗ')
        : isRelocating
          ? 'Ô kho phát sinh sự cố lúc tiếp đón. Cơ sở đang phân bổ lại ô kho mới cùng loại cho quý khách.'
          : 'Đang chờ khách hàng xuất trình CCCD và mã e-Pass tại quầy lễ tân để tiến hành nghiệm thu thực địa.';
  const relocationId = (isCancelledAtHandover || isClosed)
    ? undefined
    : (effectiveDetail?.relocationSupportRequestId || contract.relocationSupportRequestId);
  const relocationCode = effectiveDetail?.relocationSupportRequestCode || contract.relocationSupportRequestCode || 'SUP-202610-0001';
  const relocationReason = effectiveDetail?.relocationReason || contract.relocationReason || 'Di dời kho đạt chuẩn kỹ thuật theo sự cố hỗ trợ';

  return createPortal(
    <>
      <div
        className={`no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
          isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
        }`}
        onClick={handleClose}
      >
      <div
        className={`bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Thông tin hợp đồng & Trạng thái */}
        <div className="bg-gradient-to-r from-[#0a483c] via-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="pr-10">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              HỢP ĐỒNG THUÊ Ô KHO THÔNG MINH & BIÊN BẢN BÀN GIAO ĐIỆN TỬ
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              Ô kho {effectiveUnitNumber}
            </h3>
          </div>
        </div>

        {/* Subheader */}
        <div className="flex items-center border-b border-slate-200 px-5 pt-3 bg-slate-50/50 gap-4 text-xs font-bold">
          <div className="pb-3 px-1 border-b-2 border-brand-600 text-brand-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Văn bản hợp đồng & Biên bản bàn giao</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-4 relative">
            {/* Watermark mờ chìm văn bản */}
            <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.04] z-0 overflow-hidden">
              <div className="transform -rotate-25 font-black text-6xl tracking-widest text-slate-900 border-8 border-slate-900 px-8 py-4 uppercase text-center max-w-lg">
                {watermarkText}
              </div>
            </div>

            <div className="space-y-4 text-xs relative z-10">
              {/* 1. Banner Phụ lục điều chuyển ô kho do sự cố kỹ thuật (nếu đã điều chuyển xong) */}
              {relocationId && (
                <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 space-y-2 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>PHỤ LỤC ĐIỀU CHUYỂN Ô KHO (SỰ CỐ KỸ THUẬT)</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      {relocationCode}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Ô kho đã được Ban Quản lý cơ sở điều chuyển từ ô ban đầu sang <strong>Ô KHO MỚI: {effectiveUnitNumber}</strong> theo Phiếu xử lý sự cố số <strong>{relocationCode}</strong> ({relocationReason}).
                  </p>
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Bảo lưu toàn bộ quyền lợi khách hàng: Đơn giá thuê ({formatVND(detail?.monthlyPrice || contract.monthlyRent)}/tháng) và tiền cọc bảo đảm ban đầu ({formatVND(detail?.depositAmount || contract.depositHeld)}) được giữ nguyên vẹn.
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Banner Chờ phân bổ lại ô kho mới khi khách từ chối ô cũ và chọn Đổi ô kho */}
              {(isRelocating || Boolean(contract.relocationEligible || detail?.relocationEligible)) && !relocationId && (
                <div className="p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 space-y-2 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                      <span>PHỤ LỤC TẠM HOÃN BÀN GIAO &amp; ĐANG BỐ TRÍ ĐỔI Ô KHO MỚI</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      Chờ cấp ô mới
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Khách hàng đã kiểm tra thực tế và phát hiện sự cố tại ô kho ban đầu ({contract.rejectionReason || 'Cửa cuốn / khóa cơ bị kẹt, hư hỏng không vận hành được'}). Khách hàng đã chọn <strong>Đổi sang ô kho khác cùng loại</strong>. Quản lý cơ sở (FM) đang điều phối và cấp ô kho mới trên sơ đồ 2D cho quý khách.
                  </p>
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Bảo lưu 100% quyền lợi: Đơn giá thuê ({formatVND(detail?.monthlyPrice || contract.monthlyRent)}/tháng) và tiền cọc đã thanh toán ({formatVND(detail?.depositAmount || contract.depositHeld)}) được giữ nguyên 100%.
                    </span>
                  </div>
                </div>
              )}

              {/* Banner Hợp đồng đang báo trả kho & chờ nghiệm thu */}
              {effectiveStatus === 'PENDING_RETURN' && (
                <div className="p-4 rounded-xl bg-indigo-50/90 border-2 border-indigo-200 space-y-2 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>
                        {contract.inspectionDone
                          ? 'ĐÃ NGHIỆM THU TRẢ KHO — CHỜ QUYẾT TOÁN HOÀN CỌC'
                          : 'ĐANG YÊU CẦU TRẢ KHO & CHỜ NGHIỆM THU'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      {contract.inspectionDone ? 'Chờ hoàn cọc' : 'Chờ nghiệm thu trả kho'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Hợp đồng đã gửi thông báo trả kho và đang trong quy trình kiểm tra thực địa, đối soát chi phí và hoàn trả tiền cọc bảo đảm.
                  </p>
                </div>
              )}

              {/* 3. Banner Hợp đồng TERMINATED (3 trường hợp phân hóa chuẩn xác) */}
              {(effectiveStatus === 'TERMINATED' || isCancelledAtHandover) && (
                (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND') || isCancelledAtHandover) ? (
                  /* Trường hợp 3A: Từ chối nhận kho tại chỗ -> Hủy & Hoàn 100% */
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>BIÊN BẢN TỪ CHỐI BÀN GIAO TẠI HIỆN TRƯỜNG &amp; HOÀN TIỀN 100% (BR-CHK-02)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                        Hoàn tiền 100%
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      Tại buổi bàn giao, khách hàng và nhân viên cơ sở đã tiến hành đối soát 4 tiêu chí nghiệm thu vật lý. Do phát sinh khiếm khuyết vật lý tại hiện trường (<strong>{contract.rejectionReason || 'Ô kho bị ẩm ướt / có dấu hiệu thấm dột từ trần kho'}</strong>), khách hàng đã <strong>từ chối nhận bàn giao</strong> và yêu cầu chấm dứt hợp đồng.
                    </p>
                    <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Quyết toán bồi hoàn: Hoàn trả 100% tiền cọc ({formatVND(detail?.depositAmount || contract.depositHeld)}) và 100% tiền thuê đã trả trước ({formatVND(detail?.monthlyPrice || contract.monthlyRent)}) về tài khoản ngân hàng của khách hàng.
                      </span>
                    </div>
                  </div>
                ) : (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                  /* Trường hợp 3B: Chưa gán kho mà đã hủy */
                  <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-300 space-y-2 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-orange-900 font-extrabold text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span>BIÊN BẢN HỦY ĐẶT CHỖ KHO (CHƯA PHÂN BỔ Ô VẬT LÝ)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-orange-200 text-orange-950 px-2 py-0.5 rounded">
                        Hoàn cọc 100%
                      </span>
                    </div>
                    <p className="text-xs text-orange-900 leading-relaxed">
                      Khách hàng đã hủy giao dịch trước khi cơ sở phân bổ ô kho vật lý cụ thể. Hợp đồng đặt trước được chấm dứt hiệu lực theo thỏa thuận tự nguyện giữa hai bên.
                    </p>
                    <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Hoàn cọc 100%: Số tiền cọc bảo đảm {formatVND(detail?.depositAmount || contract.depositHeld)} đã được hoàn trả đầy đủ cho khách hàng.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Trường hợp 3C: Đã gán ô nhưng hủy trước nhận kho (giải phóng ô) */
                  <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-2 animate-in fade-in duration-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>BIÊN BẢN HỦY GIỮ CHỖ &amp; GIẢI PHÓNG Ô KHO VẬT LÝ</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                        Đã giải phóng ô kho
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      Khách hàng đã thông báo hủy đơn trước ngày nhận kho. Ô kho <strong>{effectiveUnitNumber}</strong> đã được hoàn trả ngay lập tức về trạng thái Trống (AVAILABLE) trên sơ đồ cơ sở để phục vụ khách hàng khác. Tiền cọc đã được quyết toán theo chính sách hợp đồng.
                    </p>
                  </div>
                )
              )}

              {/* Banner Hợp đồng đã hoàn tất & tất toán */}
              {isClosed && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>HỢP ĐỒNG ĐÃ KẾT THÚC & HOÀN TẤT TẤT TOÁN</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                      Đã tất toán
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hợp đồng đã hoàn thành chu kỳ thuê, hoàn tất biên bản bàn giao nghiệm thu và quyết toán toàn bộ các nghĩa vụ tài chính theo quy định.
                  </p>
                </div>
              )}

              {/* Điều 1: Các bên tham gia hợp đồng */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bên A: Bên Cho Thuê */}
                  <div className="space-y-1 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-bold text-brand-800 uppercase block mb-1">
                      Bên Cho Thuê (Bên A)
                    </span>
                    <p className="font-bold text-slate-800">{effectiveFacilityName}</p>
                    <p className="text-slate-500 text-[11px]">Đ/c: {effectiveFacilityAddress}</p>
                    <p className="text-slate-500 text-[11px]">Hotline: <strong className="text-slate-700">{effectiveFacilityPhone}</strong></p>
                  </div>

                  {/* Bên B: Bên Thuê */}
                  <div className="space-y-1 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-bold text-brand-800 uppercase block mb-1">
                      Bên Thuê Kho (Bên B)
                    </span>
                    <p className="font-bold text-slate-800">{effectiveCustomerName}</p>
                    <p className="text-slate-500 text-[11px]">Số ĐT: <strong className="text-slate-700">{effectiveCustomerPhone}</strong></p>
                    <p className="text-slate-500 text-[11px]">Số CCCD: <strong className="font-mono text-slate-700">{effectiveCustomerIdentity}</strong></p>
                    <p className="text-slate-500 text-[11px]">Email: {effectiveCustomerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Điều 2: Đối tượng & Thời hạn thuê */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mã ô kho:</span>
                    <span className="font-black text-brand-700 text-sm">{effectiveUnitNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Loại kho:</span>
                    <span className="font-bold text-slate-800">{effectiveUnitTypeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kích thước:</span>
                    <span className="font-semibold text-slate-800">{effectiveDimensions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Vị trí tầng:</span>
                    <span className="font-semibold text-slate-800">Tầng {effectiveFloor} ({effectivePosition})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Số hợp đồng:</span>
                    <span className="font-mono font-bold text-slate-800">{effectiveContractNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày bắt đầu thuê:</span>
                    <span className="font-bold text-slate-800">{contract.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày kết thúc hợp đồng:</span>
                    <span className="font-bold text-slate-800">{contract.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Điều 3: Tài chính & Tiền cọc bảo đảm */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>ĐIỀU 3: TÀI CHÍNH & TIỀN CỌC BẢO ĐẢM</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">Đơn giá thuê hàng tháng:</span>
                    <span className="font-bold text-brand-700 text-sm">
                      {formatVND(detail?.monthlyPrice || contract.monthlyRent)}/tháng
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-700 font-semibold block">Tiền cọc bảo đảm:</span>
                      <span className="text-[10px] text-slate-400 italic">
                        Bảo lưu tại tài khoản ngân hàng, quyết toán hoàn cọc sau nghiệm thu trả kho
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatVND(detail?.depositAmount || contract.depositHeld)}
                    </span>
                  </div>

                  {contract.overdueFee ? (
                    <div className="flex justify-between text-rose-700 font-semibold border-t border-rose-100 pt-1">
                      <span>Phí phạt quá hạn phát sinh:</span>
                      <span>+{formatVND(contract.overdueFee)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Điều 4: Biên bản bàn giao & Nghiệm thu tại chỗ */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <CheckSquare className="w-4 h-4 text-brand-600" />
                    <span>ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU TẠI CHỖ</span>
                  </h4>
                  {isClosed && (
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Đã nghiệm thu & tất toán
                    </span>
                  )}
                  {isPendingCheckin && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {isRelocating ? 'Chờ đổi ô kho' : 'Chờ nghiệm thu tại quầy'}
                    </span>
                  )}
                  {isCancelledAtHandover && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Từ chối nhận kho do sự cố
                    </span>
                  )}
                </div>

                {isPendingCheckin && (
                  isRelocating ? (
                    <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-900">Đang điều phối đổi ô kho tại chỗ</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Ô kho ban đầu phát sinh sự cố kỹ thuật lúc tiếp đón. Nhân viên lễ tân đang liên hệ Quản lý cơ sở để bố trí đổi sang ô kho đạt chuẩn khác cùng loại cho quý khách.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-900">Ô kho đang ở trạng thái Chờ nhận kho</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Quý khách vui lòng xuất trình CCCD và thẻ nhận kho điện tử tại quầy lễ tân cơ sở. Nhân viên trực sẽ hướng dẫn kiểm tra 4 tiêu chí nghiệm thu thực địa và cùng quý khách xác nhận bàn giao.
                        </p>
                      </div>
                    </div>
                  )
                )}

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                    <span>
                      Thời điểm hoàn tất bàn giao:{' '}
                      <strong className={isHandoverCompleted ? 'text-slate-800' : 'text-amber-800 font-semibold'}>
                        {effectiveCheckinDate}
                      </strong>
                    </span>
                    <span>
                      Nhân viên đón tiếp & lập biên bản:{' '}
                      <strong className={isHandoverCompleted ? 'text-brand-800' : 'text-slate-500 font-normal italic'}>
                        {effectiveHandoverStaff}
                      </strong>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="font-bold text-slate-700 mb-1.5">
                      Kết quả kiểm tra 4 tiêu chí nghiệm thu vật lý bàn giao:
                    </p>
                    {isHandoverCompleted ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-emerald-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mặt bằng kho sạch sẽ, thông thoáng, không vật cản</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cửa cuốn & cơ cấu khóa vận hành an toàn, trơn tru</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sàn tường khô ráo, phòng chống ẩm mốc & PCCC đạt chuẩn</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Khóa điện tử IoT đã sẵn sàng, cấp mã PIN mở cửa 24/7</span>
                        </div>
                      </div>
                    ) : isCancelledAtHandover ? (
                      <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-800">Biên bản ghi nhận sự cố bàn giao tại hiện trường:</p>
                          <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                            Ô kho không đạt chuẩn nghiệm thu do phát sinh khiếm khuyết vật lý / sự cố kỹ thuật. Hợp đồng đã dừng thủ tục nhận kho để xử lý hoàn cọc và tiền thuê cho quý khách.
                          </p>
                        </div>
                      </div>
                    ) : isRelocating ? (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="font-bold text-amber-800">Đang điều phối đổi ô kho tại chỗ:</p>
                          <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                            Phát hiện sự cố kỹ thuật tại ô kho ban đầu. Nhân viên tiếp đón đang phối hợp Quản lý cơ sở để đổi sang ô kho đạt chuẩn khác cùng loại cho quý khách.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mặt bằng kho sạch sẽ (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Cửa cuốn & cơ cấu khóa (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sàn tường & PCCC đạt chuẩn (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Khóa điện tử IoT & cấp mã PIN (Kích hoạt khi nhận kho)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 text-slate-600">
                    <span>Ghi chú hiện trường: </span>
                    <em className={isHandoverCompleted ? 'text-slate-800 font-semibold' : 'text-slate-600 font-medium'}>
                      {effectiveHandoverNote}
                    </em>
                  </div>
                </div>

                {/* Chữ ký số 2 bên */}
                <div className="grid grid-cols-2 gap-4 pt-2 text-center text-xs">
                  <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN CHO THUÊ</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ban Quản lý cơ sở</p>
                    {isHandoverCompleted ? (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-emerald-400 bg-emerald-50/60 rounded text-[11px] font-bold text-emerald-800">
                          ✓ ĐÃ KÝ SỐ ĐIỆN TỬ
                        </div>
                        <p className="font-semibold text-slate-700 text-[11px]">{effectiveHandoverStaff}</p>
                      </>
                    ) : isCancelledAtHandover ? (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                          HỦY NHẬN DO SỰ CỐ
                        </div>
                        <p className="font-semibold text-slate-600 text-[11px]">{effectiveHandoverStaff}</p>
                      </>
                    ) : isRelocating ? (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-700">
                          ĐANG ĐỢI ĐỔI Ô MỚI
                        </div>
                        <p className="font-semibold text-slate-600 text-[11px]">{effectiveHandoverStaff}</p>
                      </>
                    ) : (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-slate-300 bg-slate-100 rounded text-[11px] font-bold text-slate-500">
                          CHỜ TIẾP ĐÓN & KÝ TẠI QUẦY
                        </div>
                        <p className="font-medium text-slate-400 text-[11px]">Chưa ký biên bản bàn giao</p>
                      </>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN THUÊ KHO</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Khách hàng xác nhận</p>
                    {isHandoverCompleted ? (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-emerald-400 bg-emerald-50/60 rounded text-[11px] font-bold text-emerald-800">
                          ✓ ĐÃ XÁC NHẬN BÀN GIAO
                        </div>
                        <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                      </>
                    ) : (contract.status === 'TERMINATED' || isCancelledAtHandover) ? (
                      (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND') || isCancelledAtHandover) ? (
                        <>
                          <div className="my-3 py-1 px-2 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                            TỪ CHỐI NHẬN (HOÀN 100%)
                          </div>
                          <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                        </>
                      ) : (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                        <>
                          <div className="my-3 py-1 px-2 inline-block border border-dashed border-orange-300 bg-orange-50 rounded text-[11px] font-bold text-orange-800">
                            HỦY ĐẶT CHỖ (HOÀN CỌC 100%)
                          </div>
                          <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                        </>
                      ) : (
                        <>
                          <div className="my-3 py-1 px-2 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                            HỦY GIỮ CHỖ (GIẢI PHÓNG Ô)
                          </div>
                          <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                        </>
                      )
                    ) : (contract.relocationEligible || detail?.relocationEligible || isRelocating) ? (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-700">
                          CHỜ BÀN GIAO Ô MỚI
                        </div>
                        <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                      </>
                    ) : (
                      <>
                        <div className="my-3 py-1 px-2 inline-block border border-dashed border-amber-300 bg-amber-50/80 rounded text-[11px] font-bold text-amber-700">
                          CHỜ XÁC NHẬN KHI NHẬN KHO
                        </div>
                        <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Footer với nút In hợp đồng, Đổi PIN, Báo trả kho và Đóng */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 cursor-pointer text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In hợp đồng</span>
            </Button>

            {onChangePin && contract && contract.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClose();
                  onChangePin(contract);
                }}
                className="flex items-center gap-1.5 px-3 cursor-pointer text-xs font-semibold text-brand-700 border-brand-200 hover:bg-brand-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi PIN</span>
              </Button>
            )}

            {onScheduleReturn &&
              contract &&
              (contract.status === 'ACTIVE' || contract.status === 'EXPIRING_SOON') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleClose();
                    onScheduleReturn(contract);
                  }}
                  className="flex items-center gap-1.5 px-3 cursor-pointer text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <span>Báo trả kho</span>
                </Button>
              )}

            {onReschedulePeriod && contract && isPendingCheckin && (
              <Button
                variant="outline"
                size="sm"
                disabled={(effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1}
                onClick={() => {
                  if ((effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) < 1) {
                    handleClose();
                    onReschedulePeriod(contract);
                  }
                }}
                title={
                  (effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'Mỗi hợp đồng chỉ được phép dời lịch nhận kho tối đa 1 lần duy nhất (BR-RES-06)'
                    : 'Yêu cầu dời ngày bắt đầu nhận kho'
                }
                className={`flex items-center gap-1.5 px-3 text-xs font-semibold ${
                  (effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-100 border-slate-200'
                    : 'cursor-pointer text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {(effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'Đã dời lịch (1/1)'
                    : 'Dời ngày nhận kho'}
                </span>
              </Button>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleClose}
            className="px-5 cursor-pointer text-xs font-semibold"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>

    {/* Bản in hợp đồng & biên bản bàn giao chuẩn pháp lý A4 (kết xuất khi in/lưu PDF) */}
    <ContractPrintDocument
      contract={contract}
      detail={detail}
    />
  </>,
  document.body
);
};
