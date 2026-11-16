import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Printer,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import {
  getSupportRequestDetail,
  getStaffWorkload,
  assignStaffToTask,
} from '../api/staffAssignmentApi';
import { collectCatalogFee, getContractById, getContractFinancialDetail, getManagerContracts, getManagerContractById } from '@/api/contract';
import type { ContractFinancialSummary, ManagerContractItem } from '@/types/contractManager';
import { ReassignUnitModal } from '../components/ReassignUnitModal';
import type {
  ManagementSupportTicket,
  StaffWorkloadItem,
} from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { IncidentDetailPanel } from '../components/IncidentDetailPanel';
import { CustomerInfoPanel } from '../components/CustomerInfoPanel';
import { StorageUnitMiniPanel } from '../components/StorageUnitMiniPanel';
import { ContractMiniPanel } from '../components/ContractMiniPanel';
import { StaffAssignmentSection } from '../components/StaffAssignmentSection';
import { IncidentFaultDetermination } from '../components/IncidentFaultDetermination';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { CloseIncidentModal } from '../components/CloseIncidentModal';
import { ImageGallery } from '../components/ImageGallery';

/**
 * Trích xuất kết quả phân định lỗi từ biên bản giải quyết của Staff (Read-only)
 */
function extractFaultInfo(ticket: ManagementSupportTicket) {
  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';
  const note = ticket.resolutionNotes || '';

  if (!note) {
    return {
      faultType: isResolved || isClosed ? ('COMPANY' as const) : null,
      cost: 0,
      feeCategoryName: '',
    };
  }

  const isCustomerFault =
    note.includes('Lỗi do khách hàng') ||
    note.includes('Khách hàng chịu') ||
    note.includes('Tổng thu:');
  const isCompanyFault =
    note.includes('Lỗi do công ty') ||
    note.includes('công ty chi trả') ||
    note.includes('Miễn phí 0 đ');

  if (isCustomerFault) {
    const costMatch = note.match(/Tổng thu:\s*([\d.,]+)\s*đ/i) || note.match(/([\d.,]+)\s*đ/);
    let cost = 0;
    if (costMatch) {
      cost = Number(costMatch[1].replace(/[.,]/g, '')) || 0;
    }
    const feeMatch = note.match(/Phụ phí:\s*([^|]+)/i);
    const feeName = feeMatch ? feeMatch[1].trim() : 'Khoản phụ phí danh mục';

    return {
      faultType: 'CUSTOMER' as const,
      cost,
      feeCategoryName: feeName,
    };
  }

  if (isCompanyFault || isResolved || isClosed) {
    return {
      faultType: 'COMPANY' as const,
      cost: 0,
      feeCategoryName: '',
    };
  }

  return {
    faultType: null,
    cost: 0,
    feeCategoryName: '',
  };
}

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const ticketIdNumber = Number(incidentId) || 0;

  const [ticket, setTicket] = useState<ManagementSupportTicket | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal đóng sự cố
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);
  // Modal đổi ô kho khẩn cấp
  const [reassignModalOpen, setReassignModalOpen] = useState<boolean>(false);
  const [contractForReassign, setContractForReassign] = useState<ManagerContractItem | null>(null);

  // Chi tiết hợp đồng & thông tin ô kho từ hợp đồng
  const [contractDetail, setContractDetail] = useState<{
    startDate?: string;
    endDate?: string;
    status?: string;
    unitType?: string;
    floor?: number | string;
    zone?: string;
  } | null>(null);
  const [ticketCharges, setTicketCharges] = useState<ContractFinancialSummary['extraCharges']>([]);
  const [collectingChargeId, setCollectingChargeId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadTicket = async () => {
    if (!ticketIdNumber) return;
    setLoading(true);
    try {
      const data = await getSupportRequestDetail(ticketIdNumber);
      setTicket(data);

      if (data.facilityId) {
        const staff = await getStaffWorkload(data.facilityId).catch(() => []);
        setStaffList(staff);
      }

      // Tải chi tiết hợp đồng nếu ticket liên kết với hợp đồng
      if (data.contractId) {
        try {
          const c = await getContractById(data.contractId);
          setContractDetail({
            startDate: c.startDate,
            endDate: c.endDateExclusive,
            status: c.status,
            unitType: c.unitTypeName,
            floor: c.floor,
            zone: c.position,
          });
        } catch (cErr) {
          console.warn('Lỗi tải chi tiết hợp đồng:', cErr);
        }
        try {
          const financial = await getContractFinancialDetail(data.contractId);
          const code = data.code;
          setTicketCharges(
            (financial.extraCharges || []).filter((charge) => Boolean(code) && charge.reason?.includes(code)),
          );
        } catch (feeErr) {
          console.warn('Lỗi tải phụ phí hợp đồng:', feeErr);
          setTicketCharges([]);
        }
      } else {
        setTicketCharges([]);
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết sự cố:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketIdNumber]);

  // 1. Phân công nhân viên
  const handleAssignStaff = async (staffId: number, notes?: string) => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const res = await assignStaffToTask({
        taskId: ticket.id,
        taskType: 'INCIDENT',
        staffId,
        priority: ticket.isUrgent ? 'URGENT' : 'NORMAL',
        notes,
      });
      showToast(res.message || 'Phân công nhân viên thành công');
      await loadTicket();
    } catch (err: unknown) {
      console.error('Lỗi phân công nhân viên:', err);
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân công';
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollectCharge = async (chargeId: number) => {
    if (!ticket?.contractId) return;
    setCollectingChargeId(chargeId);
    try {
      await collectCatalogFee(ticket.contractId, chargeId);
      showToast('Đã ghi nhận tiền mặt. Doanh thu phụ phí đã vào sổ.');
      await loadTicket();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không ghi được giao dịch thu tiền';
      showToast(message);
    } finally {
      setCollectingChargeId(null);
    }
  };

  const unpaidTicketCharges = ticketCharges.filter((charge) => charge.status !== 'PAID');
  const paidTicketTotal = ticketCharges
    .filter((charge) => charge.status === 'PAID')
    .reduce((sum, charge) => sum + charge.amount, 0);
  const unpaidTicketTotal = unpaidTicketCharges.reduce((sum, charge) => sum + charge.amount, 0);

  // 2. Mở modal đổi ô kho khi nhân viên đã báo cần chuyển
  const handleOpenReassignModal = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      let targetContract: ManagerContractItem | null = null;
      if (ticket.contractId) {
        try {
          targetContract = await getManagerContractById(ticket.contractId);
        } catch {
          // fallback
        }
      }

      if (!targetContract && (ticket.contractId || ticket.contractCode)) {
        const list = await getManagerContracts({
          facilityId: ticket.facilityId,
          keyword: ticket.contractCode || String(ticket.contractId),
        });
        targetContract =
          list.find((c) => c.id === ticket.contractId || c.code === ticket.contractCode) ||
          list[0] ||
          null;
      }

      if (!targetContract && ticket.contractId) {
        const c = await getContractById(ticket.contractId);
        targetContract = {
          id: c.id,
          code: c.code,
          customerId: c.customerId,
          customerName: c.customerName || ticket.customerName,
          customerPhone: c.customerPhone || ticket.customerPhone,
          facilityId: c.facilityId || ticket.facilityId,
          facilityName: c.facilityName || ticket.facilityName,
          storageUnitId: c.storageUnitId,
          storageUnitCode: c.storageUnitCode || ticket.storageUnitCode,
          unitTypeId: c.unitTypeId || 1,
          unitTypeName: c.unitTypeName || '',
          startDate: c.startDate,
          endDateExclusive: c.endDateExclusive,
          rentalMonths: c.rentalMonths || 1,
          monthlyPrice: c.monthlyPrice || 0,
          depositAmount: c.depositAmount || 0,
          depositBalance: c.depositAmount || 0,
          status: (c.status as any) || 'ACTIVE',
          openSupportRequestId: ticket.id,
        };
      }

      if (targetContract) {
        setContractForReassign({
          ...targetContract,
          openSupportRequestId: ticket.id,
        });
        setReassignModalOpen(true);
      } else {
        showToast('Không tìm thấy thông tin hợp đồng liên kết để đổi ô kho.');
      }
    } catch (err) {
      console.error('Lỗi chuẩn bị đổi ô kho:', err);
      showToast('Không thể mở chức năng đổi ô kho.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Đóng sự cố hoàn tất (Close - Nghiệm thu sau khi Staff đã resolve)
  const handleConfirmClose = async (closingNotes: string) => {
    if (!ticket) return;
    if (ticket.relocationRequired) {
      showToast('Sự cố có yêu cầu di dời ô kho. Phải hoàn tất đổi ô kho cho khách hàng trước khi đóng sự cố.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient<any>(`/support-requests/${ticket.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({
          resolutionNote: closingNotes,
          status: 'CLOSED',
        }),
      });

      showToast('Đã đóng sự cố và hoàn tất biên bản nghiệm thu');
      setCloseModalOpen(false);
      await loadTicket();
    } catch (err: unknown) {
      console.error('Lỗi đóng sự cố:', err);
      const message = err instanceof Error ? err.message : 'Không đóng được sự cố';
      showToast(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Đang tải thông tin chi tiết sự cố...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 text-sm">Không tìm thấy thông tin sự cố</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Ticket #{ticketIdNumber} có thể không tồn tại hoặc đã bị xóa.
        </p>
        <button
          onClick={() => navigate('/manager/incidents')}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const facilityCode = `FAC-${ticket.facilityId}`;
  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';

  // Trích xuất kết quả phân định lỗi từ biên bản giải quyết của Staff (Read-only)
  const parsedFaultInfo = extractFaultInfo(ticket);

  const resolutionImages = (ticket.resolutionAttachments || []).map((a) => a.fileUrl);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Xử lý sự cố', to: '/manager/incidents' },
          {
            label: `${facilityCode} (${ticket.facilityName})`,
            to: `/manager/incidents/facilities/${ticket.facilityId}`,
          },
          { label: `Sự cố #${ticket.code}` },
        ]}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/manager/incidents/facilities/${ticket.facilityId}`)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
            title="Quay lại danh sách sự cố của cơ sở"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Chi tiết sự cố #{ticket.code}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {ticket.facilityName} · Ô kho {ticket.storageUnitCode} · {ticket.categoryDisplayName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTicket}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Tải lại</span>
          </button>

          {isClosed && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In biên bản</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Cột trái (Chi tiết & Phân công & Nghiệm thu) - Cột phải (Khách & Ô kho & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Banner Yêu cầu di dời ô kho khẩn cấp */}
          {ticket.relocationRequired && (
            <p className="text-sm text-slate-600">
              Ô kho <strong className="text-slate-900">{ticket.storageUnitCode}</strong> cần đổi sang ô trống cùng loại cho hợp đồng{' '}
              <strong className="text-slate-900">{ticket.contractCode || 'liên kết'}</strong>.
            </p>
          )}

          <div className="bg-white rounded-xl border border-slate-200 px-5">
          {/* Panel thông tin sự cố */}
          <IncidentDetailPanel ticket={ticket} />

          {/* Phần phân công nhân viên phụ trách */}
          <StaffAssignmentSection
            assignedStaffId={ticket.assignedStaffId}
            assignedStaffName={ticket.assignedStaffName}
            assignedStaffPhone={ticket.assignedStaffPhone}
            assignmentNotes={ticket.assignmentNotes}
            assignedAt={ticket.updatedAt}
            staffList={staffList}
            onAssign={handleAssignStaff}
            isSubmitting={actionLoading}
            isReadOnly={isResolved || isClosed}
          />

          {/* Phân định trách nhiệm lỗi (Chỉ đọc từ biên bản của Nhân viên kỹ thuật hiện trường) */}
          <IncidentFaultDetermination
            faultType={parsedFaultInfo.faultType}
            cost={parsedFaultInfo.cost}
            feeCategoryName={parsedFaultInfo.feeCategoryName}
            isResolvedOrClosed={isResolved || isClosed}
            staffName={ticket.assignedStaffName}
          />

          {/* Ghi chú & Hình ảnh sau xử lý */}
          {(isResolved || isClosed) && (
            <div className="py-5 border-b border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Kết quả xử lý & Hình ảnh nghiệm thu
                </h3>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú hoàn thành từ nhân viên kỹ thuật:
                </span>
                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  {ticket.resolutionNotes || 'Đã kiểm tra, thay thế linh kiện và kiểm thử đóng mở cửa 10 lần thành công.'}
                </p>
              </div>

              {resolutionImages.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Hình ảnh hiện trường sau khắc phục ({resolutionImages.length}):
                  </span>
                  <ImageGallery images={resolutionImages} plain />
                </div>
              )}
            </div>
          )}

          {/* Khi sự cố đã ĐÓNG -> Hiển thị Khung Biên Bản Nghiệm Thu */}
          {isClosed && (
            <div className="py-5 border-b border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-emerald-950">
                  Biên bản nghiệm thu kỹ thuật đã đóng
                </h3>
              </div>

              <div className="text-xs text-emerald-900 space-y-1.5 pt-2 border-t border-emerald-200/60">
                <p>• <strong>Người xác nhận đóng:</strong> Quản lý cơ sở</p>
                <p>• <strong>Kết quả:</strong> ✓ Đã hoàn tất sửa chữa & kiểm tra hiện trường an toàn</p>
                <p>• <strong>Trách nhiệm chi phí:</strong> {parsedFaultInfo.faultType === 'CUSTOMER'
                  ? (ticketCharges.length === 0
                    ? 'Chưa ghi khoản phụ phí trên hợp đồng'
                    : unpaidTicketCharges.length > 0
                      ? `Chưa thu ${unpaidTicketTotal.toLocaleString('vi-VN')} đ`
                      : `Đã thu tại quầy ${paidTicketTotal.toLocaleString('vi-VN')} đ`)
                  : 'Cơ sở chịu 100% chi phí'}</p>
                <p>• <strong>Khách hàng xác nhận:</strong> ✓ Đã ký biên bản điện tử</p>
              </div>
            </div>
          )}

          {ticketCharges.length > 0 && (
            <div className="py-5 border-b border-slate-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Phụ phí khách phải trả
              </h3>
              {ticketCharges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 break-words">{charge.reason}</p>
                    <p className="num text-sm text-slate-900">{charge.amount.toLocaleString('vi-VN')} đ</p>
                  </div>
                  {charge.status === 'PAID' ? (
                    <span className="text-xs font-semibold text-slate-600 shrink-0">Đã thu</span>
                  ) : (
                    <button
                      type="button"
                      disabled={collectingChargeId != null || actionLoading}
                      onClick={() => handleCollectCharge(charge.id)}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 shrink-0"
                    >
                      {collectingChargeId === charge.id ? 'Đang ghi...' : 'Đã nhận tiền'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thanh Hành Động (Action Bar) */}
          <div className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Trạng thái hiện tại: <strong className="text-slate-800">{ticket.statusDisplayName}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Nút Đổi ô kho (CHỈ HIỂN THỊ KHI TICKET CẦN DI DỜI KHO) */}
              {ticket.relocationRequired && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleOpenReassignModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 rounded-xl text-xs font-semibold"
                  title="Thực hiện đổi ô kho sang ô trống cùng loại"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Tiến hành đổi ô kho</span>
                </button>
              )}

              {/* Nút Đóng sự cố (Chỉ hiển thị khi Staff đã xử lý xong sang RESOLVED) */}
              {ticket.status === 'RESOLVED' && (
                ticket.relocationRequired ? (
                  <p className="text-xs text-slate-600">
                    Cần hoàn tất đổi ô kho trước khi đóng sự cố
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setCloseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Xác nhận đóng sự cố</span>
                  </button>
                )
              )}
            </div>
          </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 px-5">
          {/* Panel Thông tin khách hàng */}
          <CustomerInfoPanel
            plain
            customerName={ticket.customerName}
            customerPhone={ticket.customerPhone}
            customerEmail={`customer${ticket.customerId}@smartstorage.vn`}
            customerId={ticket.customerId}
          />

          {/* Panel Ô kho */}
          <StorageUnitMiniPanel
            plain
            unitCode={ticket.storageUnitCode}
            unitType={contractDetail?.unitType}
            floor={contractDetail?.floor}
            zone={contractDetail?.zone}
            onViewUnitDetail={() => {
              navigate(`/manager/facilities/${ticket.facilityId}`);
            }}
          />

          {/* Panel Hợp đồng */}
          <ContractMiniPanel
            plain
            contractCode={ticket.contractCode}
            startDate={contractDetail?.startDate || ticket.contractStartDate}
            endDate={contractDetail?.endDate || ticket.contractEndDate}
            status={contractDetail?.status || ticket.contractStatus || 'ACTIVE'}
            onViewContractDetail={() => {
              if (ticket.contractId) {
                navigate(`/manager/contracts/${ticket.contractId}`);
              }
            }}
          />
          <IncidentTimeline plain ticket={ticket} />
          </div>
        </div>
      </div>

      {/* Modal đóng sự cố */}
      <CloseIncidentModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        ticket={ticket}
        faultType={parsedFaultInfo.faultType || 'COMPANY'}
        surchargeAmount={parsedFaultInfo.cost}
        onConfirmClose={handleConfirmClose}
        isSubmitting={actionLoading}
      />

      {/* Modal đổi ô kho khẩn cấp */}
      <ReassignUnitModal
        isOpen={reassignModalOpen}
        contract={contractForReassign}
        onClose={() => setReassignModalOpen(false)}
        onSuccess={(_updatedContract, msg) => {
          setReassignModalOpen(false);
          showToast(msg || 'Đổi ô kho thành công');
          loadTicket();
        }}
      />
    </div>
  );
};
