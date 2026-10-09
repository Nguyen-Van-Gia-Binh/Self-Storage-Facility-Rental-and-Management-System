import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Calendar,
  MapPin,
  KeyRound,
  ShieldCheck,
  Clock,
  User,
  History,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  CreditCard,
  Building2,
  Printer,
  CheckSquare,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { getContractAccessLogs, getMyRentalDetail, type CustomerRentalDetail } from '@/api/customerRentals';
import type { RentedContract, AccessLogEntry } from '../types';

export interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onScheduleReturn?: (contract: RentedContract) => void;
  onChangePin?: (contract: RentedContract) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
  onScheduleReturn,
  onChangePin,
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'LOGS'>('DETAILS');
  const [detail, setDetail] = useState<CustomerRentalDetail | null>(null);
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedContractNum, setCopiedContractNum] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen || !contract) return;
    let isMounted = true;

    // Tải chi tiết bổ sung từ backend (thông tin khách hàng, biên bản bàn giao, phụ lục đổi kho)
    getMyRentalDetail(Number(contract.id))
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        console.error('Lỗi tải chi tiết hợp đồng:', err);
      });

    // Tải nhật ký ra vào
    setLoadingLogs(true);
    getContractAccessLogs(contract.id)
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setLoadingLogs(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải nhật ký:', err);
        if (isMounted) setLoadingLogs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contract]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setActiveTab('DETAILS');
    }, 180);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContractNum(true);
    setTimeout(() => setCopiedContractNum(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const effectiveContractNumber = detail?.contractCode || contract.contractNumber;
  const effectiveUnitNumber = detail?.unitCode || contract.unitNumber;
  const effectiveFacilityName = detail?.facilityName || contract.facilityName;
  const effectiveFacilityAddress = detail?.facilityAddress || 'Cơ sở trực thuộc Hệ thống Self-Storage';
  const effectiveFacilityPhone = detail?.facilityPhone || '1900 8888';
  const effectiveCustomerName = detail?.customerName || contract.customerName || 'Nguyễn Văn Khách';
  const effectiveCustomerPhone = detail?.customerPhone || contract.customerPhone || '0987654321';
  const effectiveCustomerIdentity = detail?.customerIdentityNumber || contract.customerIdentityNumber || '079201001234';
  const effectiveCustomerEmail = detail?.customerEmail || contract.customerEmail || 'khachhang@smartstorage.vn';
  const effectiveUnitTypeName = detail?.unitTypeName || contract.unitTypeName;
  const effectiveDimensions = detail?.unitDimensions || contract.unitDimensions || '1.5m x 2.0m x 2.5m';
  const effectiveFloor = detail?.floor ?? contract.floor ?? 1;
  const effectivePosition = detail?.position || contract.position || 'Khu A';
  const effectiveCheckinDate = detail?.checkinDate || contract.checkinDate || contract.startDate;
  const effectiveHandoverStaff = detail?.handoverStaffName || contract.handoverStaffName || 'Nhân viên lễ tân cơ sở';
  const effectiveHandoverNote = detail?.handoverConditionNote || contract.handoverConditionNote || 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao';
  const relocationId = detail?.relocationSupportRequestId || contract.relocationSupportRequestId;
  const relocationCode = detail?.relocationSupportRequestCode || contract.relocationSupportRequestCode || 'SUP-202610-0001';
  const relocationReason = detail?.relocationReason || contract.relocationReason || 'Di dời kho đạt chuẩn kỹ thuật theo sự cố hỗ trợ';

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'ACTIVE':
        return <Badge variant="available">Đang hoạt động 24/7</Badge>;
      case 'PENDING_CHECKIN':
      case 'PENDING_CHECK_IN' as any:
        return <Badge variant="reserved">Chờ đối chiếu CCCD tại quầy</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning">Sắp hết hạn</Badge>;
      case 'OVERDUE': {
        const overdueDays =
          contract.overdueDays !== undefined && contract.overdueDays > 0
            ? contract.overdueDays
            : 1;
        const isGracePeriod = overdueDays <= 3;
        if (contract.overdueFee === 0 && !isGracePeriod) {
          return (
            <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-300">
              Đã tất toán phạt — Chờ dọn kho / trả kho
            </Badge>
          );
        }
        return (
          <Badge variant={isGracePeriod ? 'warning' : 'overdue'}>
            {isGracePeriod ? `Ân hạn D+${overdueDays}` : `Quá hạn D+${overdueDays}`}
          </Badge>
        );
      }
      case 'PENDING_RETURN':
        return <Badge variant="warning">Đang chờ trả kho</Badge>;
      case 'CLOSED':
        return <Badge variant="default">Đã kết thúc</Badge>;
      case 'TERMINATED':
        return <Badge variant="danger">Đã chấm dứt</Badge>;
      default:
        return <Badge variant="default">{contract.status}</Badge>;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
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
        {/* Header Quốc hiệu & Trạng thái */}
        <div className="bg-gradient-to-r from-[#0a483c] via-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center pb-2 border-b border-white/15 mb-3">
            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-200">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-[9px] font-semibold tracking-wider text-emerald-100/90">
              Độc lập – Tự do – Hạnh phúc
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-emerald-100 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                HỢP ĐỒNG THUÊ Ô KHO THÔNG MINH & BIÊN BẢN BÀN GIAO ĐIỆN TỬ
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                Ô kho {effectiveUnitNumber}
                <span className="text-sm font-medium text-emerald-100">
                  ({effectiveUnitTypeName})
                </span>
              </h3>
            </div>
            <div className="flex sm:flex-col items-start sm:items-end gap-1.5">
              {getStatusBadge()}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-100 bg-white/10 px-2 py-0.5 rounded">
                <span>{effectiveContractNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(effectiveContractNumber)}
                  className="hover:text-white cursor-pointer"
                  title="Sao chép số hợp đồng"
                >
                  {copiedContractNum ? <Check className="w-3 h-3 text-amber-300" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-200" />
            {effectiveFacilityName} • {effectiveFacilityAddress}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-5 pt-3 bg-slate-50/50 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('DETAILS')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DETAILS'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Văn bản hợp đồng & Biên bản bàn giao</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LOGS'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử ra vào ô kho ({logs.length})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {activeTab === 'DETAILS' ? (
            <div className="space-y-4 text-xs">
              {/* Banner Phụ lục điều chuyển ô kho do sự cố kỹ thuật (nếu có) */}
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
                      Bảo lưu toàn bộ quyền lợi khách hàng: Đơn giá thuê ({formatVND(detail?.monthlyPrice || contract.monthlyRent)}/tháng) và tiền cọc bảo đảm ban đầu ({formatVND(detail?.depositAmount || contract.depositHeld)}) được giữ nguyên vẹn theo quy tắc BR-AVL-05 & BR-SUP-02.
                    </span>
                  </div>
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
                    <p className="text-slate-500 text-[11px]">Số CCCD/Định danh: <strong className="font-mono text-slate-700">{effectiveCustomerIdentity}</strong></p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày bắt đầu thuê:</span>
                    <span className="font-bold text-slate-800">{contract.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày kết thúc hợp đồng:</span>
                    <span className="font-bold text-slate-800">{contract.endDate}</span>
                  </div>
                </div>

                {contract.accessPin && (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                      Mã PIN khóa điện tử 24/7:
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {contract.accessPin}
                    </span>
                  </div>
                )}
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
                      <span className="text-slate-700 font-semibold block">Tiền cọc bảo đảm (Deposit):</span>
                      <span className="text-[10px] text-slate-400 italic">
                        Bảo lưu tại tài khoản ngân hàng, quyết toán hoàn cọc sau nghiệm thu trả kho theo BR-RET-04
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

              {/* Điều 4: Biên bản bàn giao & Nghiệm thu tại chỗ (Check-in Handover) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  <span>ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU TẠI CHỖ (CHECK-IN HANDOVER)</span>
                </h4>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                    <span>Thời điểm hoàn tất bàn giao: <strong className="text-slate-800">{effectiveCheckinDate}</strong></span>
                    <span>Nhân viên đón tiếp & lập biên bản: <strong className="text-brand-800">{effectiveHandoverStaff}</strong></span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="font-bold text-slate-700 mb-1.5">Kết quả kiểm tra 4 tiêu chí nghiệm thu vật lý bàn giao (BR-CHK-02):</p>
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
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 text-slate-600">
                    <span>Ghi chú hiện trường: </span>
                    <em className="text-slate-800 font-semibold">{effectiveHandoverNote}</em>
                  </div>
                </div>

                {/* Chữ ký số 2 bên */}
                <div className="grid grid-cols-2 gap-4 pt-2 text-center text-xs">
                  <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN CHO THUÊ</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ban Quản lý cơ sở</p>
                    <div className="my-3 py-1 px-2 inline-block border border-dashed border-emerald-400 bg-emerald-50/60 rounded text-[11px] font-bold text-emerald-800">
                      ✓ ĐÃ KÝ SỐ ĐIỆN TỬ
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px]">{effectiveHandoverStaff}</p>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">ĐẠI DIỆN BÊN THUÊ KHO</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Khách hàng xác nhận</p>
                    <div className="my-3 py-1 px-2 inline-block border border-dashed border-emerald-400 bg-emerald-50/60 rounded text-[11px] font-bold text-emerald-800">
                      ✓ ĐÃ XÁC NHẬN BÀN GIAO
                    </div>
                    <p className="font-semibold text-slate-700 text-[11px]">{effectiveCustomerName}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Access Logs (US-SC-05.2) */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Nhật ký ra vào cảm biến số (mới nhất xếp trước)</span>
                <span className="font-semibold text-brand-700">Mã hóa bảo mật 24/7</span>
              </div>

              {loadingLogs ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải dữ liệu nhật ký ra vào...
                </div>
              ) : logs.length > 0 ? (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {log.status === 'SUCCESS' ? 'Mở khóa thành công' : 'Mở khóa thất bại'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono font-medium text-slate-600">
                              {log.method === 'PIN_CODE' ? 'Bàn phím PIN' : log.method === 'QR_PASS' ? 'Quét mã QR Pass' : 'Lễ tân'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {log.accessorName}
                            </span>
                            <span>• {log.deviceInfo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Chưa ghi nhận lượt ra vào nào cho ô kho này.
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500 mt-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <span>
                  Hệ thống giám sát cửa khóa IoT tự động lưu trữ nhật ký mở cửa trong 90 ngày để phục vụ bảo đảm an ninh tài sản theo tiêu chuẩn an ninh thông minh.
                </span>
              </div>
            </div>
          )}
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
  );
};
