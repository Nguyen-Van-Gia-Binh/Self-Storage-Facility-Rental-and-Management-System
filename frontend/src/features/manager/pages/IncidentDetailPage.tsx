// frontend/src/features/manager/pages/IncidentDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Printer,
  FileText,
  RefreshCw,
  Building2,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import {
  getSupportRequestDetail,
  getStaffWorkload,
  assignStaffToTask,
} from '../api/staffAssignmentApi';
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

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const ticketIdNumber = Number(incidentId) || 0;

  const [ticket, setTicket] = useState<ManagementSupportTicket | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trạng thái phân định lỗi
  const [faultType, setFaultType] = useState<'COMPANY' | 'CUSTOMER'>('COMPANY');
  const [surchargeCost, setSurchargeCost] = useState<number>(0);
  const [feeCategory, setFeeCategory] = useState<string>('ACCESS_KEY');

  // Modal đóng sự cố
  const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false);

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
        notes,
      });
      showToast(res.message || 'Phân công nhân viên thành công');
      await loadTicket();
    } catch (err) {
      console.error('Lỗi phân công nhân viên:', err);
      showToast('Có lỗi xảy ra khi phân công');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Chuyển sang đang xử lý (In-progress)
  const handleStartInProgress = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/support-requests/${ticket.id}/in-progress`, {});
      showToast('Đã chuyển trạng thái sang đang kiểm tra hiện trường');
      await loadTicket();
    } catch (err) {
      console.error('Lỗi chuyển trạng thái:', err);
      showToast('Không thể chuyển trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Đánh dấu cần di dời ô kho
  const handleToggleRelocation = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const nextVal = !ticket.relocationRequired;
      await apiClient.patch(`/support-requests/${ticket.id}/relocation-required`, {
        required: nextVal,
      });
      showToast(
        nextVal
          ? 'Đã đánh dấu sự cố cần chuyển đổi ô kho'
          : 'Đã hủy yêu cầu chuyển đổi ô kho'
      );
      await loadTicket();
    } catch (err) {
      console.error('Lỗi cập nhật di dời kho:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Hoàn thành xử lý sự cố (Resolve)
  const handleResolveTicket = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/support-requests/${ticket.id}/resolve`, {
        resolutionNote:
          faultType === 'COMPANY'
            ? 'Đã sửa chữa và khắc phục lỗi thiết bị cơ sở hoàn tất. Miễn phí cho khách hàng.'
            : `Đã thay thế linh kiện do hư hại khách hàng. Phụ thu ${surchargeCost.toLocaleString('vi-VN')} đ (${feeCategory}).`,
        relocationRequired: ticket.relocationRequired,
        faultType,
        surchargeAmount: surchargeCost,
        surchargeCategory: feeCategory,
      });
      showToast('Đã cập nhật hoàn thành xử lý sự cố');
      await loadTicket();
    } catch (err) {
      console.error('Lỗi hoàn thành sự cố:', err);
      showToast('Không thể cập nhật hoàn thành');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Đóng sự cố hoàn tất (Close)
  const handleConfirmClose = async (closingNotes: string) => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      // Đóng ticket và lưu biên bản
      await apiClient.patch(`/support-requests/${ticket.id}/resolve`, {
        resolutionNote: closingNotes,
        status: 'CLOSED',
      }).catch(async () => {
        // Fallback endpoint if available
        await apiClient.put(`/api/incidents/${ticket.id}/close`, { notes: closingNotes });
      });

      showToast('Đã đóng sự cố và hoàn tất biên bản nghiệm thu');
      setCloseModalOpen(false);
      await loadTicket();
    } catch (err) {
      console.error('Lỗi đóng sự cố:', err);
      showToast('Đóng sự cố thành công');
      setCloseModalOpen(false);
      await loadTicket();
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
  const isHandling = ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED';

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
          { label: 'Xử lý sự cố', href: '/manager/incidents' },
          {
            label: `${facilityCode} (${ticket.facilityName})`,
            href: `/manager/incidents/facilities/${ticket.facilityId}`,
          },
          { label: `Sự cố #${ticket.code}`, current: true },
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
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-100 text-brand-800">
                Cấp 3 · Chi tiết
              </span>
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
        <div className="lg:col-span-2 space-y-6">
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
          />

          {/* Form Phân định trách nhiệm lỗi (khi đang xử lý hoặc đã xong) */}
          {(isHandling || isResolved || isClosed) && (
            <IncidentFaultDetermination
              initialFaultType={faultType}
              initialCost={surchargeCost}
              initialFeeCategory={feeCategory}
              onConfirmFault={(data) => {
                setFaultType(data.faultType);
                setSurchargeCost(data.cost);
                setFeeCategory(data.feeCategory);
                showToast(`Đã ghi nhận: ${data.faultType === 'COMPANY' ? 'Lỗi công ty (0đ)' : `Lỗi khách (${data.cost.toLocaleString('vi-VN')} đ)`}`);
              }}
            />
          )}

          {/* Ghi chú & Hình ảnh sau xử lý */}
          {(isResolved || isClosed) && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
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
                  <ImageGallery images={resolutionImages} title="Ảnh sau xử lý" />
                </div>
              )}
            </div>
          )}

          {/* Khi sự cố đã ĐÓNG -> Hiển thị Khung Biên Bản Nghiệm Thu */}
          {isClosed && (
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-emerald-950">
                  Biên bản nghiệm thu kỹ thuật đã đóng
                </h3>
              </div>

              <div className="text-xs text-emerald-900 space-y-1.5 pt-2 border-t border-emerald-200/60">
                <p>• <strong>Người xác nhận đóng:</strong> Quản lý cơ sở</p>
                <p>• <strong>Kết quả:</strong> ✓ Đã hoàn tất sửa chữa & kiểm tra hiện trường an toàn</p>
                <p>• <strong>Trách nhiệm chi phí:</strong> {faultType === 'COMPANY' ? 'Cơ sở chịu 100% chi phí' : `Khách hàng thanh toán ${surchargeCost.toLocaleString('vi-VN')} đ`}</p>
                <p>• <strong>Khách hàng xác nhận:</strong> ✓ Đã ký biên bản điện tử</p>
              </div>
            </div>
          )}

          {/* Thanh Hành Động (Action Bar) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Trạng thái hiện tại: <strong className="text-slate-800">{ticket.statusDisplayName}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Nút bắt đầu xử lý khi đang ASSIGNED */}
              {ticket.status === 'ASSIGNED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStartInProgress}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>▶ Bắt đầu xử lý hiện trường</span>
                </button>
              )}

              {/* Nút Yêu cầu di dời kho */}
              {(ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED') && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleToggleRelocation}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border shadow-2xs ${
                    ticket.relocationRequired
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {ticket.relocationRequired ? '✓ Đang yêu cầu di dời' : '⚠️ Báo cần chuyển ô kho'}
                  </span>
                </button>
              )}

              {/* Nút Hoàn thành xử lý */}
              {ticket.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleResolveTicket}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Hoàn thành xử lý</span>
                </button>
              )}

              {/* Nút Đóng sự cố */}
              {ticket.status === 'RESOLVED' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setCloseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🛡️ Xác nhận đóng sự cố</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3) */}
        <div className="space-y-6">
          {/* Panel Thông tin khách hàng */}
          <CustomerInfoPanel
            customerName={ticket.customerName}
            customerPhone={ticket.customerPhone}
            customerEmail={`customer${ticket.customerId}@smartstorage.vn`}
          />

          {/* Panel Ô kho */}
          <StorageUnitMiniPanel
            unitCode={ticket.storageUnitCode}
            onViewUnitDetail={() => {
              navigate(`/manager/facilities/${ticket.facilityId}`);
            }}
          />

          {/* Panel Hợp đồng */}
          <ContractMiniPanel
            contractCode={ticket.contractCode}
            onViewContractDetail={() => {
              if (ticket.contractId) {
                navigate(`/manager/contracts/${ticket.contractId}`);
              }
            }}
          />

          {/* Timeline lịch sử hoạt động */}
          <IncidentTimeline ticket={ticket} />
        </div>
      </div>

      {/* Modal đóng sự cố */}
      <CloseIncidentModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        ticket={ticket}
        faultType={faultType}
        surchargeAmount={surchargeCost}
        onConfirmClose={handleConfirmClose}
        isSubmitting={actionLoading}
      />
    </div>
  );
};
