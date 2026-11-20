// frontend/src/features/manager/pages/ContractDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Building2,
  Repeat,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Receipt,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  UserPlus,
  UserCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  getManagerContracts,
  getManagerContractById,
  reassignStorageUnit,
  getSettlementPreview,
  completeSettlementPayment,
} from '@/api/contract';
import type { ContractPaymentTransaction, ManagerContractItem } from '@/types/contractManager';
import type { StorageUnitResponse } from '@/types/unit';
import type { SettlementPreviewData } from '@/types';
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';
import { Breadcrumb } from '../components/Breadcrumb';
import { StatusBadge } from '../components/StatusBadge';
import { OverdueAlertBanner } from '../components/OverdueAlertBanner';
import { CustomerInfoPanel } from '../components/CustomerInfoPanel';
import { PaymentInfoPanel } from '../components/PaymentInfoPanel';
import { ContractTimeline } from '../components/ContractTimeline';
import { ReassignUnitModal } from '../components/ReassignUnitModal';
import { FacilityFloorPlanMapModal } from '../components/FacilityFloorPlanMapModal';
import { ContractFinancialModal } from '../components/ContractFinancialModal';
import { SettlementApprovalModal } from '../components/SettlementApprovalModal';
import { ForceRenewalModal } from '../components/ForceRenewalModal';
import { EmergencyCompensationModal } from '../components/EmergencyCompensationModal';
import { ContractDetailModal } from '@/features/customer/components/ContractDetailModal';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? formatDateVN(trimmed.slice(0, 10)) : trimmed;
}

function formatDateTimeVN(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return formatDisplayDate(iso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function isRefundTransaction(type?: string | null): boolean {
  return type === 'REFUND' || type === 'RENT_REFUND' || type === 'DEPOSIT_REFUND';
}

function formatPaymentMethodLabel(method?: string | null): string {
  switch ((method || '').toUpperCase()) {
    case 'VNPAY':
      return 'VNPay';
    case 'CASH':
      return 'Tiền mặt';
    case 'BANK_TRANSFER':
    case 'TRANSFER':
      return 'Chuyển khoản';
    case 'PAYOS':
      return 'PayOS';
    case 'DEPOSIT_DEDUCTION':
      return 'Khấu trừ cọc';
    case 'SYSTEM':
    case 'MANUAL':
      return 'Hệ thống';
    default:
      return method || 'Khác';
  }
}

function formatTransactionLabel(tx: ContractPaymentTransaction): string {
  switch (tx.transactionType) {
    case 'INITIAL_PAYMENT':
      return 'Thanh toán hợp đồng ban đầu';
    case 'CONTRACT_RENEWAL':
    case 'RENEWAL_PAYMENT': {
      const monthsLabel = tx.renewalMonths ? ` (+${tx.renewalMonths} tháng)` : '';
      const forceSuffix = tx.providerReference?.startsWith('FORCE_') ? ' — T-20' : '';
      return `Gia hạn hợp đồng${monthsLabel}${forceSuffix}`;
    }
    case 'OVERDUE_PENALTY':
      return 'Thanh toán phí phạt quá hạn';
    case 'EXTRA_FEE_PAYMENT':
      return 'Thanh toán phụ phí phát sinh';
    case 'RESCHEDULE_FEE':
      return 'Phí dời lịch nhận kho';
    case 'SETTLEMENT':
      return 'Tất toán quyết toán hợp đồng';
    case 'DEPOSIT_REFUND':
      return 'Hoàn trả tiền cọc';
    case 'RENT_REFUND':
      return 'Hoàn trả tiền thuê';
    case 'REFUND':
      return 'Hoàn tiền giao dịch';
    default:
      return tx.transactionType || 'Giao dịch thanh toán';
  }
}

function getTransactionStatusMeta(status?: string | null): {
  label: string;
  dotClass: string;
  textClass: string;
} {
  switch ((status || '').toUpperCase()) {
    case 'SUCCESS':
      return { label: 'Thành công', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
    case 'PENDING':
      return { label: 'Chờ thanh toán', dotClass: 'bg-amber-500', textClass: 'text-amber-700' };
    case 'PENDING_REFUND':
      return { label: 'Chờ hoàn tiền', dotClass: 'bg-amber-500', textClass: 'text-amber-700' };
    case 'FAILED':
      return { label: 'Thất bại', dotClass: 'bg-rose-500', textClass: 'text-rose-700' };
    case 'REFUND_FAILED':
      return { label: 'Hoàn tiền lỗi', dotClass: 'bg-rose-500', textClass: 'text-rose-700' };
    case 'EXPIRED':
      return { label: 'Hết hạn', dotClass: 'bg-gray-400', textClass: 'text-gray-600' };
    case 'CANCELLED':
      return { label: 'Đã hủy', dotClass: 'bg-gray-400', textClass: 'text-gray-600' };
    default:
      return { label: status || 'Không rõ', dotClass: 'bg-gray-400', textClass: 'text-gray-600' };
  }
}

export const ContractDetailPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const contractIdNum = Number(contractId) || 0;

  const [contract, setContract] = useState<ManagerContractItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collapsible sections (mở mặc định để nắm bắt thông tin ngay lập tức)
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [pinVisible, setPinVisible] = useState(false);

  // Modals state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [eContractModalOpen, setEContractModalOpen] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [forceRenewalModalOpen, setForceRenewalModalOpen] = useState(false);
  const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);

  // Feedback & Settlement Debt state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreviewData | null>(null);
  const [confirmingCash, setConfirmingCash] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const loadData = useCallback(
    async (isManual = false) => {
      if (!contractIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        let loadedContract: ManagerContractItem | null = null;
        try {
          const direct = await getManagerContractById(contractIdNum);
          if (direct && direct.id) {
            loadedContract = direct;
          }
        } catch (singleErr) {
          console.warn('Lỗi getManagerContractById, fallback qua danh mục:', singleErr);
        }

        if (!loadedContract) {
          const all = await getManagerContracts({ status: 'ALL' });
          loadedContract = (all || []).find((c) => c.id === contractIdNum) || null;
        }

        if (!loadedContract) {
          setError(`Không tìm thấy hợp đồng #${contractIdNum} trong các cơ sở được phân công.`);
        } else {
          setContract(loadedContract);
          // Nạp bảng tính quyết toán nếu hợp đồng đang ở chu trình trả kho / quá hạn / chấm dứt / hủy nhận kho
          if (
            loadedContract.status !== 'CLOSED' &&
            (loadedContract.isInspected ||
              loadedContract.status === 'PENDING_RETURN' ||
              (loadedContract.status as string) === 'INSPECTED' ||
              loadedContract.status === 'OVERDUE' ||
              loadedContract.status === 'TERMINATED' ||
              loadedContract.status === 'CANCELLED')
          ) {
            getSettlementPreview(loadedContract.id)
              .then(setSettlementPreview)
              .catch(() => setSettlementPreview(null));
          } else {
            setSettlementPreview(null);
          }
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

  const handleCashConfirm = async () => {
    if (!settlementPreview?.pendingSettlementOrderCode || !contract) return;
    try {
      setConfirmingCash(true);
      await completeSettlementPayment(settlementPreview.pendingSettlementOrderCode);
      showToast(
        `Đã xác nhận thu tiền mặt ${settlementPreview.payableAmount.toLocaleString('vi-VN')} đ tại quầy! Hợp đồng đã hoàn tất thanh lý (CLOSED).`
      );
      loadData(true);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể xác nhận thanh toán tiền mặt.');
    } finally {
      setConfirmingCash(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCloseSettlementModal = useCallback(() => {
    setSettlementModalOpen(false);
    if (searchParams.get('action') === 'settlement') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('action');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  // Tự động mở modal duyệt quyết toán nếu URL có tham số action=settlement
  useEffect(() => {
    if (contract && searchParams.get('action') === 'settlement') {
      if (contract.status !== 'CLOSED') {
        setSettlementModalOpen(true);
      } else {
        // Hợp đồng đã đóng (CLOSED), xóa query param action để tránh vòng lặp mở lại popup
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('action');
            return next;
          },
          { replace: true }
        );
      }
    }
  }, [contract, searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-6 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
          <div className="lg:col-span-1 h-64 bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Không tìm thấy hợp đồng</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {error || `Hợp đồng #${contractIdNum} không tồn tại hoặc đã bị xóa khỏi hệ thống.`}
        </p>
        <button
          onClick={() => navigate('/manager/contracts')}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors cursor-pointer"
        >
          Quay lại Tổng quan Hợp đồng
        </button>
      </div>
    );
  }

  const isOverdue = contract.status === 'OVERDUE';
  const isActive = contract.status === 'ACTIVE';
  const isPendingCheckIn =
    contract.status === 'PENDING_CHECK_IN' || (contract.status as string) === 'PENDING_CHECKIN';
  const isPendingReturn =
    contract.status === 'PENDING_RETURN' || (contract.status as string) === 'INSPECTED';
  const isInspected =
    Boolean(contract.isInspected) || (contract.status as string) === 'INSPECTED';
  const isTerminated = contract.status === 'TERMINATED';
  const isCancelled =
    contract.status === 'CANCELLED' || settlementPreview?.settlementType === 'CANCELLED_CHECKIN';
  const isOverdueTerminated =
    isTerminated &&
    !isCancelled &&
    (Boolean(contract.checkinDate) ||
      (contract.overdueDays ?? 0) > 0 ||
      contract.depositBalance === 0);
  const canRelocate =
    !isTerminated &&
    !isCancelled &&
    Boolean(contract.relocationEligible) &&
    (isActive || isPendingCheckIn);
  const canCompensate = Boolean(
    contract &&
      !isTerminated &&
      !isCancelled &&
      contract.status !== 'CLOSED' &&
      (canRelocate ||
        contract.status === 'RELOCATION_PENDING' ||
        contract.storageUnitCode === 'Chờ gán lại ô kho' ||
        contract.relocationEligible ||
        (isPendingCheckIn && (!contract.storageUnitId || contract.storageUnitCode === 'Chưa gán')))
  );
  // Cho phép duyệt quyết toán khi nhân viên ĐÃ nghiệm thu hoặc hợp đồng ở trạng thái TERMINATED / CANCELLED
  const isSettlementReady =
    (isInspected || isTerminated || isCancelled) && contract.status !== 'CLOSED';

  // Điều kiện Force Renewal (FM-01, BR-REN-01, BR-REN-10): Hợp đồng ACTIVE và còn < 20 ngày
  const daysRemaining = contract.endDateExclusive
    ? Math.ceil(
        (new Date(contract.endDateExclusive).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : 999;
  const canForceRenew = isActive && daysRemaining >= 0 && daysRemaining < 20;

  const startDateDisplay = formatDisplayDate(contract.startDate);
  const endDateDisplay = formatDisplayDate(contract.endDateExclusive);

  const primarySettlementLabel = isOverdueTerminated
    ? 'Quyết toán Kho Tổng & Đóng HĐ'
    : settlementPreview && settlementPreview.payableAmount > 0
      ? `Chờ khách nộp bù (+${settlementPreview.payableAmount.toLocaleString('vi-VN')} đ)`
      : isTerminated && !isOverdueTerminated
        ? 'Duyệt quyết toán & Hoàn tiền 100%'
        : 'Duyệt quyết toán & Hoàn cọc';

  const handleFloorPlanReassign = async (unit: StorageUnitResponse) => {
    if (!contract) return;
    try {
      setRefreshing(true);
      await reassignStorageUnit({
        contractId: contract.id,
        currentUnitId: contract.storageUnitId,
        newUnitId: unit.id,
        newUnitCode: unit.code,
        reason: 'Đổi ô kho do phát hiện sự cố lúc bàn giao tiếp đón',
        supportRequestId: contract.openSupportRequestId ?? undefined,
        customerConsent: true,
      });
      setFloorPlanOpen(false);
      loadData(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Lỗi khi đổi ô kho.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

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

      {/* Page Header: Tiêu đề Hợp đồng + Toàn bộ Action Buttons ở góc trên bên phải */}
      <header
        data-testid="contract-detail-header"
        className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 pb-5 border-b border-gray-200"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-gray-900 tracking-tight">
              {contract.code}
            </h1>
            <StatusBadge
              status={canRelocate && isPendingCheckIn ? 'RELOCATION_PENDING' : contract.status}
              size="md"
            />
          </div>

          <p className="text-sm text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Khách thuê: <span className="font-medium text-gray-900">{contract.customerName}</span>
            </span>
            <span className="text-gray-300">·</span>
            <span>
              Ô kho:{' '}
              {canRelocate && isPendingCheckIn ? (
                <span className="font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Chờ cấp ô mới
                </span>
              ) : (
                <span className="font-mono font-medium text-gray-900">
                  {contract.storageUnitCode || 'Chưa gán'}
                </span>
              )}
            </span>
            <span className="text-gray-300">·</span>
            <span>
              Thời hạn:{' '}
              <span className="font-medium text-gray-900 tabular-nums">
                {startDateDisplay} - {endDateDisplay}
              </span>
            </span>
          </p>
        </div>

        {/* Action Buttons — Phân cấp chuẩn Enterprise SaaS: Outline Gray (Secondary) + Brand Mint (Primary) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEContractModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>Xem HĐ điện tử</span>
          </button>

          <button
            type="button"
            onClick={() => setFinancialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-gray-500" />
            <span>Chi tiết công nợ</span>
          </button>

          {canRelocate && (
            <button
              type="button"
              onClick={() => setReassignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              title="Đổi ô cùng loại khi sự cố hư hỏng được nhân viên xác nhận cần di dời"
            >
              <Repeat className="w-4 h-4 text-gray-500" />
              <span>Đổi ô kho do sự cố</span>
            </button>
          )}

          {canCompensate && (
            <button
              type="button"
              data-testid="btn-contract-emergency-compensation"
              onClick={() => setIsCompensationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-700 text-sm font-bold rounded-lg hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs"
              title="Kích hoạt bồi thường phạt cọc gấp đôi nếu cơ sở cháy kho 100% (Điều 328 BLDS & BR-BMP-02)"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>🚨 Phạt cọc 2x (BR-BMP-02)</span>
            </button>
          )}

          {canForceRenew && (
            <button
              type="button"
              onClick={() => setForceRenewalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
              <span>Gia hạn Ngoại lệ (T-20)</span>
            </button>
          )}

          {isPendingReturn && !isInspected && !contract.assignedStaffId && (
            <button
              type="button"
              onClick={() => navigate(`/manager/staff-schedule/facilities/${contract.facilityId}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-gray-500" />
              <span>Phân công kiểm tra kho</span>
            </button>
          )}

          {isSettlementReady && (
            <button
              type="button"
              onClick={() => setSettlementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{primarySettlementLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Banner Cảnh báo Chốt chặn T-20 & Quyền Gia hạn Ngoại lệ (BR-REN-01, BR-REN-10) */}
      {canForceRenew && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-amber-950">
                  Hợp đồng bước vào mốc Chốt chặn T-20 ngày (Còn {daysRemaining} ngày)
                </h4>
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                  Cổng online đã khóa · Thu phụ phí 200k
                </span>
              </div>
              <div className="text-xs text-amber-800 mt-1 space-y-0.5 max-w-2xl leading-relaxed">
                <p>
                  Khách hàng không thể tự gia hạn trực tuyến. Quản lý cơ sở có thể thực hiện{' '}
                  <strong>Gia hạn Ngoại lệ (Force Renewal)</strong> tại quầy nếu ô kho chưa có khách mới đặt cọc.
                </p>
                <p className="text-amber-700">
                  Hệ thống tự động cộng phụ phí trễ hạn <strong>200.000 VNĐ</strong> theo{' '}
                  <span className="whitespace-nowrap font-medium">BR-REN-10</span>.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForceRenewalModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thực hiện Force Renewal</span>
          </button>
        </div>
      )}

      {/* Banner Cảnh báo Quá hạn (Chỉ hiển thị khi hợp đồng Overdue) */}
      {isOverdue && (
        <OverdueAlertBanner
          contract={contract}
          onPayPenalty={() => setFinancialModalOpen(true)}
        />
      )}

      {/* Banner Cảnh báo Di dời Sự cố (Chỉ hiển thị khi có sự cố được Staff xác nhận cần di dời - BR-SUP-02) */}
      {canRelocate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-950">
                {isPendingCheckIn
                  ? 'Yêu cầu Đổi ô kho — Phát hiện sự cố lúc bàn giao tiếp đón'
                  : 'Ô kho phát sinh sự cố — Nhân viên hiện trường đã đề xuất di dời khẩn cấp'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {isPendingCheckIn
                  ? `Ô kho ${contract.storageUnitCode} phát sinh sự cố và đã bị khóa bảo trì. Khách hàng đã đồng ý đổi sang ô khác cùng loại. Quản lý cần chọn ô mới trên sơ đồ 2D để nhân viên tiếp tục bàn giao cho khách.`
                  : `Ô kho ${contract.storageUnitCode} gặp sự cố kỹ thuật. Bạn có thể tiến hành đổi sang ô kho trống cùng loại cho khách hàng.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCompensationModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              title="Kích hoạt bồi thường phạt cọc gấp đôi nếu cơ sở cháy kho 100% (Điều 328 BLDS)"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span>🚨 Phạt cọc 2x (BR-BMP-02)</span>
            </button>
            <button
              type="button"
              onClick={() => setFloorPlanOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Tiến hành Đổi ô kho (Sơ đồ 2D)</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Hợp đồng Bồi thường Phạt cọc Gấp đôi theo Điều 328 BLDS & BR-BMP-02 */}
      {contract.isDoubleDepositCompensation && (
        <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
              <Flame className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-rose-950">
                  Hợp đồng Bồi thường Phạt cọc Gấp đôi (Điều 328 BLDS · BR-BMP-02)
                </h4>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                  Đã thanh lý &amp; Lệnh chuyển khoản 3 ngày
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed max-w-3xl">
                Cơ sở đã hết 100% ô khả dụng cùng loại và không có ô lớn hơn để nâng hạng miễn phí.
                Ban quản lý đã hoàn tất thủ tục bồi thường phạt cọc gấp đôi theo đúng quy định pháp luật.
                {contract.compensationReason && (
                  <span className="block mt-0.5 font-medium italic">
                    Lý do: {contract.compensationReason}
                  </span>
                )}
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-rose-900 border-t border-rose-200/80">
                <span>Hoàn tiền thuê: <strong>{fmt(contract.totalRentalFee || (contract.monthlyPrice * contract.rentalMonths) || 0)}</strong></span>
                <span>Hoàn cọc gốc: <strong>{fmt(contract.depositAmount || 0)}</strong></span>
                <span>Tiền phạt đền bù: <strong>+{fmt(contract.compensationAmount || contract.depositAmount || 0)}</strong></span>
                <span className="font-bold text-rose-700 text-sm">Tổng tiền hoàn trả: <strong>{fmt(contract.totalPayoutAmount || ((contract.totalRentalFee || 0) + (contract.depositAmount || 0) * 2))}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Khách hàng Hủy nhận kho trước bàn giao (Chờ FM duyệt quyết toán hoàn tiền) */}
      {isCancelled && contract.status !== 'CLOSED' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-amber-100 text-amber-700">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-amber-950">
                  Khách hàng đã hủy nhận kho trước bàn giao — Chờ Quản lý duyệt quyết toán hoàn tiền
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 tabular-nums">
                  {settlementPreview
                    ? `Hoàn trả dự kiến: ${fmt(settlementPreview.depositRefundAmount)}`
                    : 'Chờ duyệt hoàn tiền theo chính sách 3 mức'}
                </span>
              </div>
              <p className="text-xs mt-1 text-amber-800">
                Ô kho{' '}
                <span className="font-mono font-semibold">{contract.storageUnitCode || 'Chưa gán'}</span>{' '}
                đã được tự động giải phóng về trạng thái trống.{' '}
                {contract.damageNotes ? (
                  <>
                    Ghi nhận: <strong>{contract.damageNotes}</strong>.{' '}
                  </>
                ) : null}
                Quản lý cơ sở vui lòng kiểm tra bảng tính hoàn tiền và chốt đóng hợp đồng (CLOSED).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettlementModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Duyệt quyết toán & Hoàn tiền</span>
          </button>
        </div>
      )}

      {/* Banner Hợp đồng Chấm dứt (do Cưỡng chế quá hạn D+7 hoặc do Sự cố bàn giao) */}
      {isTerminated && !isCancelled && (
        <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-rose-950">
                {isOverdueTerminated
                  ? 'Cưỡng chế niêm phong về Kho Tổng'
                  : 'Hợp đồng đã chấm dứt do sự cố bàn giao / khách từ chối nhận'}
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {isOverdueTerminated
                  ? 'Mốc D+7 · Khấu trừ 100% cọc'
                  : 'Chờ hoàn tiền 100%'}
              </span>
            </div>
            <p className="text-xs mt-1 text-rose-800">
              {isOverdueTerminated ? (
                <>
                  Ô kho <span className="font-mono font-semibold">{contract.storageUnitCode}</span> đã
                  niêm phong về Kho Tổng và giải phóng ô kho tại{' '}
                  <strong className="font-semibold">D+8</strong>. Quản lý đối soát phí lưu kho nếu
                  chuộc đồ (trong 30 ngày) hoặc thanh lý để đóng hợp đồng.
                </>
              ) : (
                <>
                  Ô kho{' '}
                  <span className="font-mono font-semibold text-rose-950">
                    {contract.storageUnitCode}
                  </span>{' '}
                  phát sinh sự cố. Quản lý duyệt quyết toán để hoàn trả toàn bộ cọc và tiền thuê cho
                  khách.
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSettlementModalOpen(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <span>
                {isOverdueTerminated
                  ? 'Quyết toán Kho Tổng & Đóng HĐ'
                  : 'Duyệt quyết toán & Hoàn tiền 100%'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Tiếp đón nhận kho (BR-CHK-01..05, FM-05) */}
      {isPendingCheckIn && !canRelocate && !isTerminated && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-blue-950">
                  {contract.assignedStaffId
                    ? `Đã phân công nhân viên tiếp đón: ${contract.assignedStaffName || 'Nhân viên phụ trách'}`
                    : 'Hợp đồng chờ nhận kho — Chưa phân công nhân viên tiếp đón'}
                </h4>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                  Tiếp đón Check-in
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-1">
                {contract.assignedStaffId
                  ? `Nhân viên cơ sở sẽ tiếp đón khách hàng, dẫn khách đi kiểm tra hiện trường ô kho ${contract.storageUnitCode} và hỗ trợ ký biên bản bàn giao số.`
                  : 'Khách hàng đã thanh toán cọc thành công và sẵn sàng nhận kho. Bạn cần phân công nhân viên cơ sở tiếp đón hoặc kiểm tra vị trí ô trên sơ đồ 2D.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFloorPlanOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span>Sơ đồ 2D</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/manager/staff-schedule/facilities/${contract.facilityId}`)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{contract.assignedStaffId ? 'Điều chuyển nhân viên' : 'Phân công ngay'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner Trả kho chờ nghiệm thu hiện trường (BR-RET-02) */}
      {isPendingReturn && !isInspected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-950">
                {contract.assignedStaffId
                  ? `Đang chờ nhân viên ${contract.assignedStaffName || 'phụ trách'} nghiệm thu hiện trường`
                  : 'Đơn trả kho chưa phân công nhân viên kiểm tra'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {contract.assignedStaffId
                  ? `Nhiệm vụ kiểm tra ô kho ${contract.storageUnitCode} đã được phân công. Quản lý chỉ có thể duyệt quyết toán & hoàn cọc sau khi nhân viên hoàn tất kiểm tra và nộp biên bản nghiệm thu hiện trạng.`
                  : `Khách hàng đã gửi yêu cầu trả kho. Bạn cần phân công nhân viên cơ sở đến kiểm tra hiện trạng ô kho ${contract.storageUnitCode} trước khi thực hiện quyết toán.`}
              </p>
            </div>
          </div>
          {!contract.assignedStaffId && (
            <button
              type="button"
              onClick={() => navigate(`/manager/staff-schedule/facilities/${contract.facilityId}`)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Phân công ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Banner Quyết toán phát sinh công nợ thiếu (BR-RET-04) */}
      {isSettlementReady &&
        settlementPreview &&
        settlementPreview.payableAmount > 0 &&
        contract.status !== 'CLOSED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-amber-950 tabular-nums">
                    Phát sinh công nợ bồi thường vượt cọc (+
                    {settlementPreview.payableAmount.toLocaleString('vi-VN')} đ)
                  </h4>
                  {settlementPreview.pendingSettlementOrderCode ? (
                    <span className="font-mono text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      Mã thu nợ PayOS/VietQR: #{settlementPreview.pendingSettlementOrderCode}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                      Chưa duyệt chốt nợ
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Chi phí khắc phục ({settlementPreview.unpaidExtraCharges.toLocaleString('vi-VN')}{' '}
                  đ) vượt tiền cọc ({settlementPreview.depositAmount.toLocaleString('vi-VN')} đ).
                  Theo quy tắc <strong>BR-RET-04</strong>, hợp đồng được giữ mở để chờ khách thanh
                  toán qua VietQR/VNPay trên ứng dụng hoặc xác nhận thu tiền mặt tại quầy.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {settlementPreview.pendingSettlementOrderCode && (
                <button
                  type="button"
                  onClick={handleCashConfirm}
                  disabled={confirmingCash}
                  className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Khách thanh toán tiền mặt hoặc quẹt thẻ trực tiếp tại quầy"
                >
                  {confirmingCash ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang chốt...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Thu tiền mặt tại quầy & Đóng HĐ</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSettlementModalOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Xem chi tiết quyết toán</span>
              </button>
            </div>
          </div>
        )}

      {/* Main Layout: 2/3 Cột Trái (Thông tin chung + Lịch sử) & 1/3 Cột Phải (Tài chính + Ô kho) */}
      <div
        data-testid="contract-detail-grid"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        {/* CỘT TRÁI (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Phẳng: Thông tin Hợp đồng & Khách hàng */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Thông tin Hợp đồng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Thời hạn thuê</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {startDateDisplay} - {endDateDisplay}{' '}
                  <span className="text-gray-500 font-normal">({contract.rentalMonths} tháng)</span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Trạng thái</span>
                <div>
                  <StatusBadge
                    status={canRelocate && isPendingCheckIn ? 'RELOCATION_PENDING' : contract.status}
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Mã PIN truy cập</span>
                <div>
                  {contract.accessCode ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900 tracking-widest">
                        {pinVisible ? contract.accessCode : '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPinVisible((v) => !v)}
                        aria-label={pinVisible ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 cursor-pointer"
                      >
                        {pinVisible ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hiện</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : isOverdue ? (
                    <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Đã khóa (Quá hạn)
                    </span>
                  ) : (
                    <span className="text-gray-400">Chưa cấp</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Cơ sở lưu trữ</span>
                <span className="font-medium text-gray-900">{contract.facilityName}</span>
              </div>
            </div>

            <hr className="my-5 border-gray-100" />

            {/* Thông tin Khách hàng phẳng (không bọc card lồng card) */}
            <CustomerInfoPanel contract={contract} plain />
          </div>

          {/* Card Phẳng: Lịch sử thanh toán & Giao dịch */}
          {(() => {
            const transactions = contract.paymentTransactions ?? [];
            const unpaidExtraCharges = contract.unpaidExtraCharges ?? [];
            const overdueFee = contract.accruedOverdueFee ?? 0;
            const unpaidExtraTotal = unpaidExtraCharges.reduce((s, c) => s + (c.amount || 0), 0);
            const totalOutstanding = overdueFee + unpaidExtraTotal;
            const totalCollected = transactions.reduce(
              (s, tx) => (tx.status === 'SUCCESS' && !isRefundTransaction(tx.transactionType) ? s + (tx.amount || 0) : s),
              0
            );
            const totalRefunded = transactions.reduce(
              (s, tx) => (tx.status === 'SUCCESS' && isRefundTransaction(tx.transactionType) ? s + (tx.amount || 0) : s),
              0
            );
            const initialRentalTotal =
              contract.totalRentalFee && contract.totalRentalFee > 0
                ? contract.totalRentalFee
                : (contract.monthlyPrice || 0) * (contract.rentalMonths || 1);

            return (
              <div
                data-testid="payment-history-card"
                className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setPaymentHistoryOpen(!paymentHistoryOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Lịch sử thanh toán & Giao dịch
                    </span>
                    <span className="text-xs font-medium text-gray-400 tabular-nums">
                      ({transactions.length} giao dịch)
                    </span>
                  </div>
                  {paymentHistoryOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {paymentHistoryOpen && (
                  <div className="px-6 pb-5 pt-1 border-t border-gray-100">
                    {transactions.length === 0 ? (
                      <p className="py-4 text-sm text-gray-500">
                        Chưa có giao dịch thanh toán nào được ghi nhận trên hệ thống.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {transactions.map((tx) => {
                          const refund = isRefundTransaction(tx.transactionType);
                          const statusMeta = getTransactionStatusMeta(tx.status);
                          const isSuccess = tx.status === 'SUCCESS';
                          const isStrike =
                            tx.status === 'FAILED' || tx.status === 'CANCELLED' || tx.status === 'EXPIRED';
                          const amountSign = refund ? '-' : '+';
                          const amountClass = isSuccess
                            ? refund
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                            : isStrike
                              ? 'text-gray-400 line-through'
                              : 'text-gray-500';
                          const refLabel = tx.orderCode
                            ? `#${tx.orderCode}`
                            : tx.providerReference || null;

                          return (
                            <div
                              key={tx.id}
                              className="py-3 flex items-start justify-between gap-4 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {formatTransactionLabel(tx)}
                                </p>
                                {tx.transactionType === 'INITIAL_PAYMENT' && (
                                  <p className="text-xs text-gray-500 tabular-nums mt-0.5">
                                    Gồm tiền thuê {contract.rentalMonths} tháng ({fmt(initialRentalTotal)}) + cọc{' '}
                                    {fmt(contract.depositAmount || 0)}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 tabular-nums mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                  <span>{formatPaymentMethodLabel(tx.paymentMethod)}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{formatDateTimeVN(tx.paidAt || tx.createdAt)}</span>
                                  {refLabel && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-mono text-gray-400">{refLabel}</span>
                                    </>
                                  )}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <p className={`font-semibold tabular-nums ${amountClass}`}>
                                  {amountSign} {fmt(tx.amount || 0)}
                                </p>
                                <p className="inline-flex items-center justify-end gap-1.5 text-xs font-medium mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                                  <span className={statusMeta.textClass}>{statusMeta.label}</span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {totalOutstanding > 0 && (
                      <div className="mt-2 pt-3 border-t border-gray-100">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 mb-1">
                          Khoản công nợ chưa tất toán
                        </p>
                        <div className="divide-y divide-gray-100">
                          {overdueFee > 0 && (
                            <div className="py-2.5 flex items-start justify-between gap-4 text-sm">
                              <div>
                                <p className="font-medium text-rose-700">Phí phạt quá hạn tích lũy</p>
                                <p className="text-xs text-gray-500 mt-0.5">Chưa tất toán</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold text-rose-600 tabular-nums">
                                  - {fmt(overdueFee)}
                                </p>
                                <p className="inline-flex items-center justify-end gap-1.5 text-xs font-medium mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span className="text-rose-700">Chưa thu</span>
                                </p>
                              </div>
                            </div>
                          )}

                          {unpaidExtraCharges.map((charge) => (
                            <div
                              key={charge.id}
                              className="py-2.5 flex items-start justify-between gap-4 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-rose-700">
                                  {charge.reason || 'Phụ phí phát sinh'}
                                </p>
                                <p className="text-xs text-gray-500 tabular-nums mt-0.5">
                                  Chưa tất toán
                                  {charge.createdAt ? ` · ${formatDateTimeVN(charge.createdAt)}` : ''}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold text-rose-600 tabular-nums">
                                  - {fmt(charge.amount || 0)}
                                </p>
                                <p className="inline-flex items-center justify-end gap-1.5 text-xs font-medium mt-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span className="text-rose-700">Chưa thu</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(transactions.length > 0 || totalOutstanding > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-600">
                        <div>
                          Tổng đã thu:{' '}
                          <span className="font-semibold text-emerald-700 tabular-nums">
                            {fmt(totalCollected)}
                          </span>
                        </div>
                        {totalRefunded > 0 && (
                          <div>
                            Đã hoàn trả:{' '}
                            <span className="font-semibold text-gray-800 tabular-nums">
                              {fmt(totalRefunded)}
                            </span>
                          </div>
                        )}
                        {totalOutstanding > 0 && (
                          <div>
                            Còn nợ:{' '}
                            <span className="font-semibold text-rose-600 tabular-nums">
                              {fmt(totalOutstanding)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Card Phẳng: Lịch sử hoạt động & Dòng thời gian */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setTimelineOpen(!timelineOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/60 transition-colors cursor-pointer"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Lịch sử hoạt động & Dòng thời gian
              </span>
              {timelineOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {timelineOpen && (
              <div className="px-6 py-5 border-t border-gray-100">
                <ContractTimeline contract={contract} />
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (1/3): Tài chính + Thông tin Ô kho */}
        <div className="lg:col-span-1 space-y-6">
          {/* Panel Thông tin Tài chính (Đã làm phẳng) */}
          <PaymentInfoPanel contract={contract} />

          {/* Panel Thông tin Ô kho */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              Thông tin Ô kho
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Mã ô kho:</span>
                {canRelocate && isPendingCheckIn ? (
                  <span className="font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                    Chờ cấp ô mới
                  </span>
                ) : (
                  <span className="font-mono font-semibold text-gray-900">
                    {contract.storageUnitCode || `Ô #${contract.storageUnitId}`}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Loại ô kho:</span>
                <span className="font-medium text-gray-900 text-right">
                  {contract.unitTypeName || 'Kho tiêu chuẩn'}
                  {contract.isUpgradedCompensation && (
                    <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Nâng hạng đền bù
                    </span>
                  )}
                  {canRelocate && isPendingCheckIn ? ' (Đang điều phối đổi ô)' : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Cơ sở:</span>
                <span className="text-gray-700 text-right">{contract.facilityName}</span>
              </div>
            </div>

            <hr className="my-4 border-gray-100" />

            {canRelocate && isPendingCheckIn ? (
              <button
                type="button"
                onClick={() => setFloorPlanOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-gray-500" />
                <span>Chọn ô mới trên Sơ đồ 2D</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/manager/facilities/${contract.facilityId}/unit-types/${contract.unitTypeId}/units/${contract.storageUnitId}?contractId=${contract.id}`
                  )
                }
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>Xem sơ đồ ô kho {contract.storageUnitCode}</span>
              </button>
            )}
          </div>
        </div>
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
          onClose={handleCloseSettlementModal}
          onSuccess={(_contractId, message) => {
            handleCloseSettlementModal();
            showToast(message || 'Đã ghi nhận quyết toán thành công!');
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
            facilityAddress: contract.facilityAddress,
            facilityPhone: contract.facilityPhone,
            unitId: String(contract.storageUnitId),
            unitNumber: contract.storageUnitCode,
            unitTypeName: contract.unitTypeName,
            sizeCategory: 'M',
            storageType: 'STANDARD',
            floor: contract.floor,
            position: contract.position,
            unitDimensions: contract.unitDimensions,
            monthlyRent: contract.monthlyPrice,
            startDate: contract.startDate,
            endDate: contract.endDateExclusive,
            status: (contract.status === 'PENDING_CHECK_IN'
              ? 'PENDING_CHECKIN'
              : contract.status) as any,
            depositHeld: contract.depositAmount,
            accessPin: contract.accessCode,
            customerName: contract.customerName,
            customerPhone: contract.customerPhone,
            customerEmail: contract.customerEmail,
            customerIdentityNumber: contract.customerIdentityNumber,
          }}
          onClose={() => setEContractModalOpen(false)}
        />
      )}

      {floorPlanOpen && (
        <FacilityFloorPlanMapModal
          isOpen={floorPlanOpen}
          onClose={() => setFloorPlanOpen(false)}
          facilityId={contract.facilityId}
          facilityName={contract.facilityName}
          highlightUnitId={contract.storageUnitId}
          allowedUnitTypeId={canRelocate ? contract.unitTypeId : undefined}
          targetUnitTypeName={canRelocate ? contract.unitTypeName : undefined}
          onSelectUnit={canRelocate ? handleFloorPlanReassign : undefined}
          onTriggerDoubleDepositCompensation={() => {
            setFloorPlanOpen(false);
            setIsCompensationModalOpen(true);
          }}
        />
      )}

      {/* Modal Bồi thường Phạt cọc Gấp đôi (BR-BMP-02 / Điều 328 BLDS) */}
      {isCompensationModalOpen && contract && (
        <EmergencyCompensationModal
          isOpen={isCompensationModalOpen}
          onClose={() => setIsCompensationModalOpen(false)}
          contract={{
            id: contract.id,
            code: contract.code,
            customerName: contract.customerName,
            customerPhone: contract.customerPhone,
            customerEmail: contract.customerEmail,
            facilityName: contract.facilityName,
            unitTypeName: contract.unitTypeName,
            rentalMonths: contract.rentalMonths,
            totalRentalFee: contract.totalRentalFee,
            depositAmount: contract.depositAmount,
            monthlyPrice: contract.monthlyPrice,
          }}
          onSuccess={(res) => {
            showToast(
              `Đã kích hoạt bồi thường phạt cọc gấp đôi cho HĐ ${res.contractCode}. Tổng tiền hoàn trả: ${fmt(res.totalPayoutAmount)}!`
            );
            loadData(true);
          }}
        />
      )}

      {forceRenewalModalOpen && (
        <ForceRenewalModal
          isOpen={forceRenewalModalOpen}
          contract={contract}
          onClose={() => setForceRenewalModalOpen(false)}
          onSuccess={(_cid, msg) => {
            showToast(msg);
            loadData(true);
          }}
        />
      )}
    </div>
  );
};
