import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Camera,
  Plus,
  Trash2,
  Receipt,
  ShieldCheck,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { DailyIncidentTask, SurchargeItem } from '@/types';
import {
  startStaffIncident,
  resolveStaffIncident,
  markStaffIncidentRelocation,
} from '@/api/staff';
import { fetchSurcharges } from '@/api/pricing';
import { applyCatalogFee } from '@/api/contract';
import { feeCategoryLabel } from '@/features/pricing/feeCategory';

export interface StaffIncidentDetailViewProps {
  task: DailyIncidentTask;
  onBack: () => void;
  onSuccess: () => void;
}

export const StaffIncidentDetailView: React.FC<StaffIncidentDetailViewProps> = ({
  task,
  onBack,
  onSuccess,
}) => {
  const [ticketStatus, setTicketStatus] = useState<string>(task.status || 'PENDING');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [startingProgress, setStartingProgress] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for resolution
  const [resolutionNote, setResolutionNote] = useState<string>(task.resolutionNote || '');
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(task.resolutionAttachmentUrls || []);
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [needsRelocation, setNeedsRelocation] = useState<boolean>(Boolean(task.relocationRequired));
  const [savingRelocation, setSavingRelocation] = useState<boolean>(false);

  // BOM surcharges list and selection states
  const [allSurcharges, setAllSurcharges] = useState<SurchargeItem[]>([]);
  const [loadingSurcharges, setLoadingSurcharges] = useState<boolean>(false);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);

  // Fault attribution states: COMPANY vs CUSTOMER
  const [faultParty, setFaultParty] = useState<'COMPANY' | 'CUSTOMER' | null>(null);
  const [isCustomerPaidConfirmed, setIsCustomerPaidConfirmed] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    setTicketStatus(task.status || 'PENDING');
    setResolutionNote(task.resolutionNote || '');
    setAttachmentUrls(task.resolutionAttachmentUrls || []);
    setNeedsRelocation(Boolean(task.relocationRequired));
  }, [task]);

  // Nạp danh mục phụ phí từ BOM API
  const loadSurcharges = useCallback(async () => {
    setLoadingSurcharges(true);
    try {
      const list = await fetchSurcharges({ isActive: true });
      const validFees = list.filter(
        (fee) =>
          fee.isActive &&
          (fee.facilityId == null || fee.facilityId === task.facilityId),
      );
      setAllSurcharges(validFees);
    } catch (err) {
      console.warn('Lỗi nạp phụ phí BOM:', err);
      setAllSurcharges([]);
    } finally {
      setLoadingSurcharges(false);
    }
  }, [task.facilityId]);

  useEffect(() => {
    loadSurcharges();
  }, [loadSurcharges]);

  const isPending =
    ticketStatus === 'PENDING' || ticketStatus === 'ASSIGNED' || ticketStatus === 'NEW';
  const isInProgress = ticketStatus === 'IN_PROGRESS';
  const isResolved = ticketStatus === 'RESOLVED' || ticketStatus === 'CLOSED';

  // Tính số tiền của từng phụ phí
  const calculateFeeAmount = (fee: SurchargeItem): number => {
    if (fee.type === 'PERCENTAGE') {
      return Math.round((1_000_000 * (fee.amount / 100)) / 1000) * 1000;
    }
    return fee.amount || 0;
  };

  // Tổng số tiền phụ phí được chọn
  const totalFeeAmount = allSurcharges
    .filter((fee) => selectedFeeIds.includes(fee.id))
    .reduce((sum, fee) => sum + calculateFeeAmount(fee), 0);

  const toggleFee = (feeId: number) => {
    setSelectedFeeIds((current) =>
      current.includes(feeId) ? current.filter((id) => id !== feeId) : [...current, feeId],
    );
  };

  // Cập nhật nhu cầu di dời khẩn cấp
  const handleRelocationChange = async (checked: boolean) => {
    if (task.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setSavingRelocation(true);
    setErrorMsg(null);
    try {
      await markStaffIncidentRelocation(task.ticketId, checked);
      setNeedsRelocation(checked);
      showToast('success', checked ? 'Đã kích hoạt cờ di dời kho khẩn cấp!' : 'Đã hủy cờ di dời kho.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không cập nhật được nhu cầu di dời.');
      showToast('error', 'Không cập nhật được nhu cầu di dời.');
    } finally {
      setSavingRelocation(false);
    }
  };

  // Thêm ảnh hiện trường
  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    if (attachmentUrls.length >= 5) {
      setErrorMsg('Tối đa 5 ảnh hiện trường sau khắc phục');
      return;
    }
    setAttachmentUrls([...attachmentUrls, imageUrlInput.trim()]);
    setImageUrlInput('');
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    setAttachmentUrls(attachmentUrls.filter((_, i) => i !== index));
  };

  // Bước 1: Tiếp nhận xử lý sự cố (chuyển sang IN_PROGRESS)
  const handleStartInProgress = async () => {
    if (task.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setStartingProgress(true);
    setErrorMsg(null);
    try {
      await startStaffIncident(task.ticketId);
      setTicketStatus('IN_PROGRESS');
      showToast('success', 'Đã tiếp nhận xử lý sự cố tại hiện trường!');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tiếp nhận sự cố. Vui lòng thử lại.');
      showToast('error', err?.message || 'Không thể tiếp nhận sự cố.');
    } finally {
      setStartingProgress(false);
    }
  };

  // Bước 2: Hoàn tất khắc phục sự cố (chuyển sang RESOLVED)
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setErrorMsg('Vui lòng nhập chi tiết kết quả xử lý (tối thiểu 5 ký tự)');
      return;
    }

    if (!faultParty) {
      setErrorMsg('Vui lòng chọn phân định trách nhiệm: Lỗi do công ty hay Lỗi do khách hàng.');
      return;
    }

    if (faultParty === 'CUSTOMER' && !isCustomerPaidConfirmed) {
      setErrorMsg('Khách hàng chưa thanh toán toàn bộ số phí. Vui lòng xác nhận đã thu đủ phí trước khi hoàn tất nghiệm thu.');
      return;
    }

    if (task.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Nếu lỗi do khách hàng và có phụ phí chọn + có contractId: ghi nhận phụ phí vào hợp đồng
      if (faultParty === 'CUSTOMER' && selectedFeeIds.length > 0 && task.contractId != null) {
        for (const feeId of selectedFeeIds) {
          try {
            const feeItem = allSurcharges.find((f) => f.id === feeId);
            const feeName = feeItem ? feeItem.name : `Phụ phí #${feeId}`;
            await applyCatalogFee(
              task.contractId,
              feeId,
              `[Sự cố ${task.code || `SUP-${task.ticketId}`}] ${feeName} - Khách đã thanh toán`,
            );
          } catch (feeErr) {
            console.warn('Lỗi ghi nhận phụ phí vào hợp đồng:', feeErr);
          }
        }
      }

      // Đảm bảo trạng thái cờ di dời kho được đồng bộ với backend
      if (needsRelocation !== Boolean(task.relocationRequired)) {
        try {
          await markStaffIncidentRelocation(task.ticketId, needsRelocation);
        } catch (rErr) {
          console.warn('Lỗi cập nhật cờ di dời kho:', rErr);
        }
      }

      // Soạn nội dung biên bản hoàn chỉnh kèm phân định trách nhiệm & phụ phí
      let faultSummary = '';
      const relocationText = needsRelocation ? ' | Phương án: Kích hoạt di dời sang ô kho khác do hư hại nặng' : '';
      if (faultParty === 'COMPANY') {
        faultSummary = `\n[Trách nhiệm: Lỗi do công ty (100% công ty chi trả theo BR-SUP-02) - Khách hàng miễn phí 0 đ${relocationText}]`;
      } else {
        const selectedFeeNames = allSurcharges
          .filter((f) => selectedFeeIds.includes(f.id))
          .map((f) => f.name)
          .join(', ');
        faultSummary = `\n[Trách nhiệm: Lỗi do khách hàng | Phụ phí: ${selectedFeeNames || 'Không phát sinh phụ phí'} | Tổng thu: ${totalFeeAmount.toLocaleString('vi-VN')} đ | Đã thanh toán đầy đủ 100%${relocationText}]`;
      }

      const fullResolutionNote = `${resolutionNote.trim()} ${faultSummary}`;

      await resolveStaffIncident(task.ticketId, {
        resolutionNote: fullResolutionNote,
        resolutionAttachmentUrls: attachmentUrls,
      });

      setTicketStatus('RESOLVED');
      showToast('success', 'Đã lưu biên bản và hoàn tất giải quyết sự cố thành công!');
      onSuccess();
      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu biên bản giải quyết sự cố. Vui lòng thử lại.');
      showToast('error', err?.message || 'Không thể lưu biên bản giải quyết sự cố.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    !isAgreed ||
    !resolutionNote.trim() ||
    faultParty === null ||
    (faultParty === 'CUSTOMER' && !isCustomerPaidConfirmed);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Điều hướng quay lại & Tiêu đề */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer hover:border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Quay lại danh sách ca trực</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                {task.code || `SUP-${task.ticketId}`}
              </span>
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                Ô {task.unitCode || '---'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {task.title || 'Xử lý sự cố thực địa'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ sở {task.facilityName || 'Cơ sở hiện tại'} · Khách hàng {task.customerName || 'Khách thuê kho'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isResolved ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã khắc phục xong</span>
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Đang xử lý tại hiện trường</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Chờ tiếp nhận xử lý</span>
            </span>
          )}

          <button
            type="button"
            onClick={loadSurcharges}
            disabled={loadingSurcharges}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Làm mới bảng phụ phí"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSurcharges ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="font-bold underline hover:text-rose-900 ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Nội dung chi tiết 2 cột (Tràn màn hình in-place) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4/12): Thông tin phiếu sự cố, khách hàng & hành động tiếp nhận */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Phiếu yêu cầu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Thông tin phản ánh
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-500">
                {task.code || `SUP-${task.ticketId}`}
              </span>
            </div>

            {/* Mô tả sự cố */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700">Tiêu đề: {task.title}</span>
              {task.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                  "{task.description}"
                </p>
              )}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Mã ô kho:</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {task.unitCode || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Cơ sở:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {task.facilityName || 'Cơ sở hiện tại'}
                </span>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{task.customerName || 'Khách thuê kho'}</span>
              </div>

              {task.customerPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{task.customerPhone}</span>
                  </div>
                  <a
                    href={`tel:${task.customerPhone}`}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
                  >
                    <span>Gọi điện</span>
                  </a>
                </div>
              )}
            </div>

            {/* Bước 1: Tiếp nhận xử lý sự cố (nếu chưa IN_PROGRESS) */}
            {isPending && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 pt-3">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Bước 1: Tiếp nhận xử lý</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Bấm nút bên dưới để chuyển trạng thái sang <strong>Đang xử lý</strong> trước khi tiến hành can thiệp tại hiện trường.
                </p>
                <button
                  type="button"
                  onClick={handleStartInProgress}
                  disabled={startingProgress}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {startingProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tiếp nhận...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Tiếp nhận xử lý tại hiện trường</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Cờ chuyển ô kho khẩn cấp (Emergency Relocation) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Cần di dời ô kho khẩn cấp:</span>
                <input
                  type="checkbox"
                  id="relocation-checkbox"
                  checked={needsRelocation}
                  disabled={savingRelocation || isResolved}
                  onChange={(e) => handleRelocationChange(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tích chọn khi ô kho bị hư hại nặng (thấm dột, chập điện) không thể tiếp tục lưu trữ, hệ thống sẽ đề xuất ô kho mới cho Quản lý phê duyệt.
              </p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8/12): Biên bản & Form giải quyết sự cố */}
        <div className="lg:col-span-8 space-y-4">
          {isResolved ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Sự cố #{task.code || task.ticketId} đã được khắc phục hoàn tất
              </h3>
              <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700">Biên bản kết quả xử lý:</span>
                <p className="text-slate-800 whitespace-pre-wrap">{task.resolutionNote || resolutionNote || 'Không có ghi chú thêm.'}</p>
              </div>
              {attachmentUrls.length > 0 && (
                <div className="text-left space-y-2">
                  <span className="text-xs font-bold text-slate-700">Ảnh nghiệm thu hiện trường:</span>
                  <div className="flex flex-wrap gap-2">
                    {attachmentUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 block hover:opacity-80"
                      >
                        <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại danh sách ca trực</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResolveSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Biên bản giải quyết hiện trường (FS-05)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xác nhận khắc phục, phân định trách nhiệm chi phí theo BR-SUP-02 và lưu ảnh bằng chứng.
                  </p>
                </div>
              </div>

              {/* Phân định trách nhiệm (BẮT BUỘC) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>1. Phân định trách nhiệm (BR-SUP-02) <span className="text-rose-500">*</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFaultParty('COMPANY');
                      setSelectedFeeIds([]);
                      setIsCustomerPaidConfirmed(false);
                    }}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      faultParty === 'COMPANY'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Lỗi do Công ty (Hạ tầng)</span>
                      <span className="font-bold text-xs text-emerald-700 font-mono">0 đ (Miễn phí)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sự cố do cơ sở vật chất xuống cấp, thấm dột tự nhiên. Công ty chịu 100% chi phí khắc phục.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFaultParty('CUSTOMER')}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      faultParty === 'CUSTOMER'
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Lỗi do Khách hàng</span>
                      <span className="font-bold text-xs text-amber-700">Áp dụng phụ phí BOM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sử dụng sai quy cách, làm gãy khóa, bẩn tường. Khách hàng phải bồi hoàn theo biểu giá niêm yết.
                    </p>
                  </button>
                </div>
              </div>

              {/* Danh mục phụ phí BOM (Khi lỗi do khách hàng) */}
              {faultParty === 'CUSTOMER' && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-700" />
                      <span>Chọn phụ phí bồi hoàn từ danh mục BOM:</span>
                    </label>
                    <span className="font-mono font-bold text-xs text-amber-900">
                      Tổng thu: {totalFeeAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {loadingSurcharges ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-amber-600" />
                      Đang tải biểu giá phụ phí...
                    </div>
                  ) : allSurcharges.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Không có phụ phí nào đang hoạt động trong danh mục.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {allSurcharges.map((fee) => {
                        const isChecked = selectedFeeIds.includes(fee.id);
                        const cost = calculateFeeAmount(fee);
                        return (
                          <label
                            key={fee.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                              isChecked
                                ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFee(fee.id)}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                              />
                              <div>
                                <p className="font-semibold">{fee.name}</p>
                                <span className="text-[10px] text-slate-500">{feeCategoryLabel(fee.category)}</span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-amber-800">
                              {cost.toLocaleString('vi-VN')} đ
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Checkbox xác nhận đã thu đủ tiền */}
                  <div className="pt-2 border-t border-amber-200/80 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="customer-paid-checkbox"
                      checked={isCustomerPaidConfirmed}
                      onChange={(e) => setIsCustomerPaidConfirmed(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="customer-paid-checkbox" className="text-xs font-semibold text-amber-950 cursor-pointer">
                      Xác nhận: Khách hàng đã thanh toán đủ số tiền {totalFeeAmount.toLocaleString('vi-VN')} đ (hoặc đồng ý khấu trừ cọc khi thanh lý).
                    </label>
                  </div>
                </div>
              )}

              {/* Chi tiết kết quả xử lý */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>2. Nội dung biên bản khắc phục hiện trường <span className="text-rose-500">*</span></span>
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Mô tả cụ thể các công việc đã thực hiện: thay thế ổ khóa, hàn gắn bản lề, quét dọn hiện trường, kiểm tra vận hành..."
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-hidden"
                />
              </div>

              {/* Ảnh nghiệm thu hiện trường */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span>3. Ảnh chụp hiện trường sau nghiệm thu (tối đa 5 ảnh)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">{attachmentUrls.length}/5 ảnh</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Dán đường dẫn ảnh hiện trường (https://...)"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!imageUrlInput.trim() || attachmentUrls.length >= 5}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ảnh</span>
                  </button>
                </div>

                {attachmentUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachmentUrls.map((url, index) => (
                      <div key={index} className="relative group w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs">
                        <img src={url} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cam kết của nhân viên */}
              <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="incident-agree"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <label htmlFor="incident-agree" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                  Tôi cam kết đã trực tiếp kiểm tra và nghiệm thu xử lý tại hiện trường cơ sở. Biên bản này phản ánh đúng sự thật và tuân thủ quy định vận hành của hệ thống.
                </label>
              </div>

              {/* Nút hoàn tất */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy / Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu biên bản...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn tất giải quyết sự cố</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
