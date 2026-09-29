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
  Phone,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { getContractAccessLogs } from '@/api/customerRentals';
import type { RentedContract, AccessLogEntry } from '../types';

export interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'LOGS'>('DETAILS');
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copiedContractNum, setCopiedContractNum] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen || !contract) return;
    let isMounted = true;

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

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'ACTIVE':
        return <Badge variant="available">Đang hoạt động 24/7</Badge>;
      case 'PENDING_CHECKIN':
      case 'PENDING_CHECK_IN' as any:
        return <Badge variant="reserved">Chờ đối chiếu CCCD tại quầy</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning">Sắp hết hạn</Badge>;
      case 'OVERDUE':
        return <Badge variant="overdue">Quá hạn thanh toán</Badge>;
      case 'PENDING_RETURN':
        return <Badge variant="warning">Đang chờ trả kho</Badge>;
      case 'CLOSED':
        return <Badge variant="default">Đã kết thúc</Badge>;
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
        className={`bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-emerald-100">
              <FileText className="w-3 h-3 text-amber-300" />
              Chi Tiết Hợp Đồng Thuê Kho
            </span>
            <span className="text-xs text-emerald-100">• US-SC-05.2</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Ô kho {contract.unitNumber}
              <span className="text-sm font-medium text-emerald-100">
                ({contract.unitTypeName})
              </span>
            </h3>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-emerald-100/90 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {contract.facilityName}
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
            <span>Thông tin hợp đồng & Biểu phí</span>
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
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'DETAILS' ? (
            <div className="space-y-4 text-xs">
              {/* Contract Identifier & Access Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Số hợp đồng</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                      {contract.contractNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(contract.contractNumber)}
                      className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 rounded cursor-pointer"
                    >
                      {copiedContractNum ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedContractNum ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                  <span className="text-[11px] text-emerald-800 block uppercase font-semibold">Quyền mở khóa điện tử</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span className="font-mono text-sm font-black text-emerald-900">
                        {contract.accessPin ? `PIN: ${contract.accessPin}` : 'Chờ đối chiếu quầy'}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      24/7
                    </span>
                  </div>
                </div>
              </div>

              {/* Rental Term & Schedule */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Thời hạn hợp đồng & Lịch trình</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày bắt đầu thuê:</span>
                    <span className="font-bold text-slate-800 text-xs">{contract.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Ngày kết thúc hợp đồng:</span>
                    <span className="font-bold text-slate-800 text-xs">{contract.endDate}</span>
                  </div>
                </div>
                {contract.scheduledReturnDate && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                    <span>Đã hẹn ngày nghiệm thu trả kho:</span>
                    <span className="font-bold">{contract.scheduledReturnDate}</span>
                  </div>
                )}
              </div>

              {/* Financial Breakdown Table */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>Tài chính & Tiền cọc bảo đảm</span>
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Đơn giá thuê hàng tháng:</span>
                    <span className="font-bold text-brand-700">{formatVND(contract.monthlyRent)}/tháng</span>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <span className="text-slate-600 block">Tiền cọc bảo đảm (Deposit):</span>
                      <span className="text-[10px] text-slate-400 italic">
                        Đang bảo lưu tại ngân hàng, quyết toán khi trả kho
                      </span>
                    </div>
                    <span className="font-bold text-emerald-700">{formatVND(contract.depositHeld)}</span>
                  </div>

                  {contract.overdueFee ? (
                    <div className="flex justify-between text-rose-700 font-semibold border-t border-rose-100 pt-1">
                      <span>Phí phạt quá hạn phát sinh:</span>
                      <span>+{formatVND(contract.overdueFee)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Facility Hotline & Location */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-brand-600" />
                  <span>Bộ phận quản lý cơ sở:</span>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Hotline: <strong>1900 8888</strong>
                  </span>
                  <span>• Giờ mở cửa: 07:00 – 22:00 hàng ngày</span>
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="px-5 cursor-pointer text-xs font-semibold"
          >
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  );
};
