// frontend/src/features/manager/pages/ContractDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Box,
  Calendar,
  Repeat,
  RefreshCw,
  AlertCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Receipt,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { getManagerContracts } from '@/api/contract';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { StatusBadge } from '../components/StatusBadge';
import { OverdueAlertBanner } from '../components/OverdueAlertBanner';
import { CustomerInfoPanel } from '../components/CustomerInfoPanel';
import { PaymentInfoPanel } from '../components/PaymentInfoPanel';
import { ContractTimeline } from '../components/ContractTimeline';
import { ReassignUnitModal } from '../components/ReassignUnitModal';
import { ContractFinancialModal } from '../components/ContractFinancialModal';
import { SettlementApprovalModal } from '../components/SettlementApprovalModal';
import { ContractDetailModal } from '@/features/customer/components/ContractDetailModal';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

export const ContractDetailPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const contractIdNum = Number(contractId) || 0;

  const [contract, setContract] = useState<ManagerContractItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  // Modals state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [eContractModalOpen, setEContractModalOpen] = useState(false);

  const loadData = useCallback(
    async (isManual = false) => {
      if (!contractIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const all = await getManagerContracts({ status: 'ALL' });
        const found = (all || []).find((c) => c.id === contractIdNum) || null;
        if (!found) {
          setError(`Không tìm thấy hợp đồng #${contractIdNum} trong các cơ sở được phân công.`);
        } else {
          setContract(found);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết hợp đồng:', err);
        setError('Không thể tải dữ liệu chi tiết hợp đồng.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [contractIdNum]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-6 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy hợp đồng</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error || `Hợp đồng #${contractIdNum} không tồn tại hoặc đã bị xóa khỏi hệ thống.`}
        </p>
        <button
          onClick={() => navigate('/manager/contracts')}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors cursor-pointer"
        >
          Quay lại Tổng quan Hợp đồng
        </button>
      </div>
    );
  }

  const isOverdue = contract.status === 'OVERDUE';
  const isActive = contract.status === 'ACTIVE';
  const canRelocate = Boolean(contract.relocationEligible) && (isActive || contract.status === 'PENDING_CHECK_IN');
  const isSettlementReady =
    contract.status === 'PENDING_RETURN' ||
    (contract.status as string) === 'INSPECTED' ||
    (contract.status as string) === 'NOTICE_SUBMITTED';

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Cấp 3 */}
      <Breadcrumb
        items={[
          {
            label: contract.facilityName || `Cơ sở #${contract.facilityId}`,
            to: `/manager/contracts/facilities/${contract.facilityId}`,
            icon: Building2,
          },
          {
            label: `Hợp đồng ${contract.code}`,
            icon: FileText,
          },
        ]}
      />

      {/* Top Banner: Thông tin vắn tắt & Trạng thái */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-mono font-black text-slate-900 tracking-tight">
                {contract.code}
              </h1>
              <StatusBadge status={contract.status} size="md" />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {contract.facilityName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Khách thuê: <strong>{contract.customerName}</strong></span>
              <span>•</span>
              <span>Ô kho: <strong className="font-mono">{contract.storageUnitCode}</strong></span>
              <span>•</span>
              <span>Thời hạn: {contract.startDate} → {contract.endDateExclusive}</span>
            </p>
          </div>
        </div>

        {/* Nút Làm mới */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData(true)} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Banner Cảnh báo Quá hạn (Chỉ hiển thị khi hợp đồng Overdue) */}
      {isOverdue && (
        <OverdueAlertBanner
          contract={contract}
          onPayPenalty={() => setFinancialModalOpen(true)}
          onRequestReturn={() => {
            alert('Đã ghi nhận yêu cầu trả kho cho hợp đồng quá hạn này.');
          }}
        />
      )}

      {/* Banner Cảnh báo Di dời Sự cố (Chỉ hiển thị khi có sự cố được Staff xác nhận cần di dời - BR-SUP-02) */}
      {canRelocate && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Ô kho phát sinh sự cố — Nhân viên hiện trường đã đề xuất di dời khẩn cấp (BR-SUP-02)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Ô kho <span className="font-mono font-bold text-amber-900">{contract.storageUnitCode}</span> gặp sự cố kỹ thuật. Bạn có thể tiến hành đổi sang ô kho trống cùng loại cho khách hàng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReassignModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Repeat className="w-4 h-4" />
            <span>Tiến hành Đổi ô kho</span>
          </button>
        </div>
      )}

      {/* Main Grid: 2 Cột Đối xứng Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cột Trái: Thông tin Hợp đồng + Khách hàng */}
        <div className="space-y-6">
          {/* Panel Thông tin Hợp đồng */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <FileText className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Thông tin Hợp đồng
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-slate-900">{contract.code}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cơ sở lưu trữ:</span>
                <span className="font-semibold text-slate-800">{contract.facilityName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Trạng thái hợp đồng:</span>
                <StatusBadge status={contract.status} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ngày bắt đầu:</span>
                <span className="font-mono text-slate-800">{contract.startDate || '—'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ngày kết thúc thuê:</span>
                <span className="font-mono font-bold text-slate-900">
                  {contract.endDateExclusive || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số tháng thuê:</span>
                <span className="font-semibold text-slate-800">{contract.rentalMonths} tháng</span>
              </div>

              {contract.accessCode && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Mã PIN truy cập:</span>
                  <span className="font-mono font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {contract.accessCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Panel Thông tin Khách hàng */}
          <CustomerInfoPanel contract={contract} />
        </div>

        {/* Cột Phải: Thông tin Thanh toán + Thông tin Ô kho */}
        <div className="space-y-6">
          {/* Panel Thông tin Tài chính */}
          <PaymentInfoPanel contract={contract} />

          {/* Panel Thông tin Ô kho */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Box className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Thông tin Ô kho gắn kèm
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Mã ô kho:</span>
                <span className="font-mono font-bold text-brand-600 text-sm">
                  {contract.storageUnitCode || `Ô #${contract.storageUnitId}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Loại ô kho:</span>
                <span className="font-semibold text-slate-800">
                  {contract.unitTypeName || 'Kho tiêu chuẩn'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cơ sở:</span>
                <span className="text-slate-700">{contract.facilityName}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Xem trên Sơ đồ ô kho:</span>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/manager/facilities/${contract.facilityId}/unit-types/${contract.unitTypeId}/units/${contract.storageUnitId}`
                    )
                  }
                  className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Đi tới ô kho {contract.storageUnitCode}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Khối HÀNH ĐỘNG HỢP ĐỒNG */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3.5">
          Hành động quản lý
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Xem Hợp đồng điện tử */}
          <button
            type="button"
            onClick={() => setEContractModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Xem Hợp đồng điện tử</span>
          </button>

          {/* Chi tiết công nợ / Tài chính */}
          <button
            type="button"
            onClick={() => setFinancialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>Chi tiết công nợ</span>
          </button>

          {/* Đổi ô kho ngoại lệ: Chỉ khi có sự cố được Staff xác nhận cần di dời (BR-SUP-02 / BR-AVL-05) */}
          {canRelocate && (
            <button
              type="button"
              onClick={() => setReassignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Đổi ô cùng loại khi sự cố hư hỏng được nhân viên xác nhận cần di dời (BR-SUP-02)"
            >
              <Repeat className="w-4 h-4 text-amber-600" />
              <span>Đổi ô kho do sự cố</span>
            </button>
          )}

          {/* Duyệt quyết toán hoàn cọc (Khi PENDING_RETURN hoặc INSPECTED) */}
          {isSettlementReady && (
            <button
              type="button"
              onClick={() => setSettlementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Duyệt quyết toán & Hoàn cọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Accordion 1: LỊCH SỬ THANH TOÁN (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          onClick={() => setPaymentHistoryOpen(!paymentHistoryOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch sử thanh toán & Giao dịch
            </span>
          </div>
          {paymentHistoryOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {paymentHistoryOpen && (
          <div className="p-4 pt-0 border-t border-slate-100 space-y-3 text-xs">
            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Thanh toán cọc ban đầu</span>
                  <p className="text-[11px] text-slate-400">VietQR • {contract.startDate || 'Khởi tạo'}</p>
                </div>
                <span className="font-mono font-bold text-emerald-700">
                  +{fmt(contract.depositAmount || 0)}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">
                    Tiền thuê {contract.rentalMonths} tháng
                  </span>
                  <p className="text-[11px] text-slate-400">VietQR • {contract.startDate || 'Khởi tạo'}</p>
                </div>
                <span className="font-mono font-bold text-brand-600">
                  +{fmt((contract.monthlyPrice || 0) * (contract.rentalMonths || 1))}
                </span>
              </div>

              {contract.accruedOverdueFee !== undefined && contract.accruedOverdueFee > 0 && (
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-700">Phí phạt quá hạn tích lũy</span>
                    <p className="text-[11px] text-rose-500">Chưa tất toán</p>
                  </div>
                  <span className="font-mono font-bold text-rose-600">
                    -{fmt(contract.accruedOverdueFee)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: LỊCH SỬ HOẠT ĐỘNG (Timeline, Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lịch sử hoạt động & Dòng thời gian
            </span>
          </div>
          {timelineOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {timelineOpen && (
          <div className="p-5 border-t border-slate-100">
            <ContractTimeline contract={contract} />
          </div>
        )}
      </div>

      {/* Modals */}
      {reassignModalOpen && (
        <ReassignUnitModal
          isOpen={reassignModalOpen}
          contract={contract}
          onClose={() => setReassignModalOpen(false)}
          onSuccess={(_updated, _msg) => {
            setReassignModalOpen(false);
            loadData(true);
          }}
        />
      )}

      {financialModalOpen && (
        <ContractFinancialModal
          isOpen={financialModalOpen}
          contractId={contract.id}
          onClose={() => setFinancialModalOpen(false)}
        />
      )}

      {settlementModalOpen && (
        <SettlementApprovalModal
          isOpen={settlementModalOpen}
          contract={contract}
          onClose={() => setSettlementModalOpen(false)}
          onSuccess={() => {
            setSettlementModalOpen(false);
            loadData(true);
          }}
        />
      )}

      {eContractModalOpen && (
        <ContractDetailModal
          isOpen={eContractModalOpen}
          contract={{
            id: String(contract.id),
            contractNumber: contract.code,
            facilityId: String(contract.facilityId),
            facilityName: contract.facilityName,
            unitId: String(contract.storageUnitId),
            unitNumber: contract.storageUnitCode,
            unitTypeName: contract.unitTypeName,
            sizeCategory: 'M',
            storageType: 'STANDARD',
            monthlyRent: contract.monthlyPrice,
            startDate: contract.startDate,
            endDate: contract.endDateExclusive,
            status: (contract.status === 'PENDING_CHECK_IN' ? 'PENDING_CHECKIN' : contract.status) as any,
            depositHeld: contract.depositAmount,
            accessPin: contract.accessCode,
          }}
          onClose={() => setEContractModalOpen(false)}
        />
      )}
    </div>
  );
};
