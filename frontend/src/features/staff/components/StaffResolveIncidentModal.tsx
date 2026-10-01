import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  Clock,
  User,
  Phone,
  Building2,
  Lock,
  CheckCircle2,
  Camera,
  FileText,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
  Receipt,
} from 'lucide-react';
import type { DailyIncidentTask, SurchargeItem } from '@/types';
import { startStaffIncident, resolveStaffIncident, markStaffIncidentRelocation } from '@/api/staff';
import { fetchSurcharges } from '@/api/pricing';
import { applyCatalogFee } from '@/api/contract';
import { feeCategoryLabel } from '@/features/pricing/feeCategory';

interface StaffResolveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: DailyIncidentTask | null;
  onSuccess: () => void;
}

export const StaffResolveIncidentModal: React.FC<StaffResolveIncidentModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for resolution
  const [resolutionNote, setResolutionNote] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [isAgreed, setIsAgreed] = useState(false);
  const [needsRelocation, setNeedsRelocation] = useState(false);
  const [savingRelocation, setSavingRelocation] = useState(false);

  // BOM surcharges list and selection states
  const [allSurcharges, setAllSurcharges] = useState<SurchargeItem[]>([]);
  const [loadingSurcharges, setLoadingSurcharges] = useState(false);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);

  // Fault attribution states: COMPANY vs CUSTOMER
  const [faultParty, setFaultParty] = useState<'COMPANY' | 'CUSTOMER' | null>(null);
  const [isCustomerPaidConfirmed, setIsCustomerPaidConfirmed] = useState(false);

  useEffect(() => {
    if (ticket) {
      setErrorMsg(null);
      setResolutionNote(ticket.resolutionNote || '');
      setAttachmentUrls(ticket.resolutionAttachmentUrls || []);
      setImageUrlInput('');
      setIsAgreed(false);
      setNeedsRelocation(Boolean(ticket.relocationRequired));
      setSelectedFeeIds([]);
      setFaultParty(null);
      setIsCustomerPaidConfirmed(false);
    }
  }, [ticket]);

  // Lấy toàn bộ danh mục phụ phí đang active từ BOM API
  useEffect(() => {
    if (!isOpen) return;
    setLoadingSurcharges(true);
    fetchSurcharges({ isActive: true })
      .then((list) => {
        const validFees = list.filter(
          (fee) =>
            fee.isActive &&
            (fee.facilityId == null || fee.facilityId === ticket?.facilityId),
        );
        setAllSurcharges(validFees);
      })
      .catch(() => setAllSurcharges([]))
      .finally(() => setLoadingSurcharges(false));
  }, [isOpen, ticket?.facilityId]);

  if (!isOpen || !ticket) return null;

  const isPending =
    ticket.status === 'PENDING' || ticket.status === 'ASSIGNED' || ticket.status === 'NEW';
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

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

  const handleRelocationChange = async (checked: boolean) => {
    if (ticket.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setSavingRelocation(true);
    setErrorMsg(null);
    try {
      await markStaffIncidentRelocation(ticket.ticketId, checked);
      setNeedsRelocation(checked);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không cập nhật được nhu cầu di dời.');
    } finally {
      setSavingRelocation(false);
    }
  };

  // Thêm ảnh nghiệm thu vào danh sách
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
    if (ticket.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await startStaffIncident(ticket.ticketId);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể tiếp nhận sự cố. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
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

    if (ticket.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Nếu lỗi do khách hàng và có phụ phí chọn + có contractId: ghi nhận phụ phí vào hợp đồng
      if (faultParty === 'CUSTOMER' && selectedFeeIds.length > 0 && ticket.contractId != null) {
        for (const feeId of selectedFeeIds) {
          try {
            const feeItem = allSurcharges.find((f) => f.id === feeId);
            const feeName = feeItem ? feeItem.name : `Phụ phí #${feeId}`;
            await applyCatalogFee(
              ticket.contractId,
              feeId,
              `[Sự cố ${ticket.code || `SUP-${ticket.ticketId}`}] ${feeName} - Khách đã thanh toán`,
            );
          } catch (feeErr) {
            console.warn('Lỗi ghi nhận phụ phí vào hợp đồng:', feeErr);
          }
        }
      }

      // Đảm bảo trạng thái cờ di dời kho được đồng bộ với backend
      if (needsRelocation !== Boolean(ticket.relocationRequired)) {
        try {
          await markStaffIncidentRelocation(ticket.ticketId, needsRelocation);
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

      await resolveStaffIncident(ticket.ticketId, {
        resolutionNote: fullResolutionNote,
        resolutionAttachmentUrls: attachmentUrls,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu biên bản giải quyết sự cố. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
          Mới được giao (Chờ xử lý)
        </span>
      );
    }
    if (isInProgress) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
          Đang xử lý tại hiện trường
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">
        Đã khắc phục xong
      </span>
    );
  };

  const isSubmitDisabled =
    submitting ||
    !isAgreed ||
    !resolutionNote.trim() ||
    faultParty === null ||
    (faultParty === 'CUSTOMER' && !isCustomerPaidConfirmed);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              {ticket.isOverlockTask ? (
                <Lock className="w-5 h-5 text-purple-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {ticket.code || `SUP-${ticket.ticketId}`}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{ticket.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thông tin ô kho & khách hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Cơ sở:</span>
                <strong className="text-slate-800">{ticket.facilityName || 'Cơ sở hiện tại'}</strong>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Mã ô kho:</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {ticket.unitCode || '---'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Khách hàng:</span>
                <strong className="text-slate-800">{ticket.customerName || 'Khách thuê kho'}</strong>
              </div>
              {ticket.customerPhone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Điện thoại:</span>
                  <a
                    href={`tel:${ticket.customerPhone}`}
                    className="font-mono text-teal-700 hover:underline font-semibold"
                  >
                    {ticket.customerPhone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Thời gian gửi:</span>
                <span className="font-medium text-slate-800">
                  {ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })
                    : 'Gần đây'}
                </span>
              </div>
            </div>
          </div>

          {/* Mô tả sự cố từ khách hàng */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Mô tả sự cố từ khách hàng
            </label>
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
              {ticket.description || ticket.title}
            </div>
          </div>

          {/* Ảnh hiện trường ban đầu (nếu khách đính kèm) */}
          {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                Ảnh chụp hiện trạng ban đầu ({ticket.attachmentUrls.length})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ticket.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 block"
                  >
                    <img
                      src={url}
                      alt={`Hiện trường ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isResolved && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 space-y-2 text-xs text-amber-950">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsRelocation}
                  disabled={savingRelocation}
                  onChange={(e) => handleRelocationChange(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4 shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-900 block">
                    Không sửa tại chỗ được — Cần kích hoạt di dời sang ô kho khác
                  </span>
                  <span className="text-[11px] text-amber-800 block leading-relaxed">
                    Bật cờ này khi kiểm tra hiện trường phát hiện hư hại nghiêm trọng. Quản lý cơ sở sẽ nhận thông báo để thực hiện đổi ô kho tương đương cho khách.
                  </span>
                </div>
              </label>

              {needsRelocation && (
                <div className="pt-2 border-t border-amber-200/80 text-[11px] space-y-1">
                  {faultParty === 'COMPANY' && (
                    <p className="text-emerald-800 font-semibold">
                      ✓ Di dời do lỗi kỹ thuật / cơ sở: Khách hàng được đổi ô kho dự phòng <strong>hoàn toàn miễn phí (0 đ)</strong> theo quy tắc BR-SUP-02.
                    </p>
                  )}
                  {faultParty === 'CUSTOMER' && (
                    <p className="text-rose-800 font-semibold">
                      ⚠️ Di dời do lỗi khách hàng: Phụ phí sửa chữa, công di chuyển (chọn từ danh mục BOM bên dưới) sẽ do khách hàng thanh toán 100%.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI 1: MỚI ĐƯỢC GIAO */}
          {isPending && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-sky-900">Nhiệm vụ mới được phân công cho ca trực của bạn</h4>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Bàn điều phối cơ sở đã giao sự cố này cho bạn. Bấm <strong>"Bắt đầu xử lý"</strong> khi bạn di chuyển tới hiện trường, hoặc bạn có thể điền ngay biên bản xử lý bên dưới nếu đã khắc phục xong.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartInProgress}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Bắt đầu xử lý tại hiện trường (In Progress)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* FORM NGHIỆM THU & GIẢI QUYẾT: Cho phép khi Đang xử lý hoặc Mới được giao */}
          {(isInProgress || isPending) && (
            <form onSubmit={handleResolveSubmit} className="space-y-5 pt-2 border-t border-slate-200">
              {/* 1. DANH MỤC PHỤ PHÍ TỪ BOM (CHECKBOX MULTI-SELECT) */}
              <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-teal-600" />
                    <span>Danh mục phụ phí phát sinh (Biểu phí BOM)</span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                    {selectedFeeIds.length} khoản đã chọn
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Chọn các khoản phụ phí tương ứng nếu sự cố có phát sinh vật tư, thay khóa cơ, vệ sinh hoặc sửa chữa theo bảng giá BOM.
                </p>

                {loadingSurcharges ? (
                  <div className="flex items-center justify-center py-4 text-xs text-slate-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    <span>Đang tải biểu phí BOM...</span>
                  </div>
                ) : allSurcharges.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Chưa có danh mục phụ phí đang hiệu lực tại cơ sở.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {allSurcharges.map((fee) => {
                      const isChecked = selectedFeeIds.includes(fee.id);
                      const feePrice = calculateFeeAmount(fee);
                      return (
                        <label
                          key={fee.id}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFee(fee.id)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 truncate block">
                                {fee.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 inline-block font-medium">
                                {feeCategoryLabel(fee.category)}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-800 shrink-0 ml-2">
                            {fee.type === 'PERCENTAGE'
                              ? `${fee.amount}% (${feePrice.toLocaleString('vi-VN')} đ)`
                              : `${feePrice.toLocaleString('vi-VN')} đ`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedFeeIds.length > 0 && (
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs font-semibold">
                    <span className="text-slate-600">Tổng phụ phí phát sinh:</span>
                    <span className="font-mono text-teal-700 text-sm font-bold">
                      {totalFeeAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>

              {/* 2. PHÂN ĐỊNH TRÁCH NHIỆM: 2 NÚT CHỌN */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Phân định trách nhiệm sự cố *</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Quy tắc BR-SUP-02</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Nhân viên hiện trường bắt buộc chọn 1 trong 2 nút bên dưới để xác định trách nhiệm chi trả.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nút 1: Lỗi do công ty */}
                  <button
                    type="button"
                    onClick={() => {
                      setFaultParty('COMPANY');
                      setIsCustomerPaidConfirmed(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      faultParty === 'COMPANY'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        faultParty === 'COMPANY'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Lỗi do công ty / cơ sở</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Hạ tầng, kỹ thuật, hao mòn tự nhiên. Công ty chịu 100% chi phí.
                      </p>
                    </div>
                  </button>

                  {/* Nút 2: Lỗi do khách hàng */}
                  <button
                    type="button"
                    onClick={() => {
                      setFaultParty('CUSTOMER');
                      setIsCustomerPaidConfirmed(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      faultParty === 'CUSTOMER'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        faultParty === 'CUSTOMER'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Lỗi do khách hàng</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Làm mất chìa cơ, làm hỏng ổ khóa. Khách hàng thanh toán phụ phí.
                      </p>
                    </div>
                  </button>
                </div>

                {/* KHI CHỌN: LỖI DO CÔNG TY */}
                {faultParty === 'COMPANY' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-emerald-900">
                        100% Chi phí do công ty chi trả (Quy tắc BR-SUP-02)
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Khách hàng <strong>hoàn toàn không phải chịu bất kỳ khoản phí nào (0 VNĐ)</strong>. Toàn bộ chi phí vật tư, thay khóa hoặc sửa chữa sẽ do công ty thanh toán vào chi phí bảo dưỡng cơ sở.
                      </p>
                    </div>
                  </div>
                )}

                {/* KHI CHỌN: LỖI DO KHÁCH HÀNG */}
                {faultParty === 'CUSTOMER' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Khoản phụ phí khách hàng cần thanh toán:
                      </span>
                      <span className="font-mono font-bold text-sm text-rose-700">
                        {totalFeeAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {/* CHECKBOX MÔ PHỎNG XÁC NHẬN THANH TOÁN BẮT BUỘC */}
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 bg-white cursor-pointer hover:bg-rose-50/50 transition">
                      <input
                        type="checkbox"
                        checked={isCustomerPaidConfirmed}
                        onChange={(e) => setIsCustomerPaidConfirmed(e.target.checked)}
                        className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-rose-900">
                          Khách hàng đã thanh toán toàn bộ số phí cần phải trả
                        </span>
                        {totalFeeAmount > 0 && (
                          <span className="font-mono font-bold text-rose-700 ml-1">
                            ({totalFeeAmount.toLocaleString('vi-VN')} đ)
                          </span>
                        )}
                        <p className="text-[11px] text-rose-600 mt-0.5 font-normal leading-relaxed">
                          * Nhân viên bắt buộc thu đủ tiền (tiền mặt / chuyển khoản) và tick xác nhận vào ô này mới có thể hoàn tất nghiệm thu sự cố.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* 3. NỘI DUNG KHẮC PHỤC & BIÊN BẢN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Nội dung khắc phục & Biên bản xử lý hiện trường *</span>
                  <span className="text-[11px] font-normal text-slate-400">Tối thiểu 5 ký tự</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Mô tả cụ thể thao tác kỹ thuật đã thực hiện: ví dụ Đã thay ổ khóa cơ mới, tra dầu bản lề cửa cuốn và kiểm tra đóng mở bình thường..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  required
                />
              </div>

              {/* 4. TẢI / NHẬP LINK ẢNH NGHIỆM THU */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Ảnh chụp nghiệm thu sau khắc phục (Tối đa 5 ảnh)</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {attachmentUrls.length}/5 ảnh
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Dán link ảnh chụp (ví dụ: https://...)"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!imageUrlInput.trim() || attachmentUrls.length >= 5}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm ảnh
                  </button>
                </div>

                {/* Danh sách ảnh đã thêm */}
                {attachmentUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                    {attachmentUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group bg-slate-100"
                      >
                        <img src={url} alt="Nghiệm thu" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-90 hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. CAM KẾT QUY TRÌNH BÀN GIAO */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-amber-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    Tôi xác nhận đã hoàn tất khắc phục sự cố tại hiện trường theo đúng quy trình bàn
                    giao (US-FS-05.2) và chịu trách nhiệm về thông tin ghi chú.
                  </span>
                </label>
              </div>

              {/* NÚT SUBMIT NGHIỆM THU */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi biên bản...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận hoàn thành & Gửi khách nghiệm thu</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TRẠNG THÁI 3: ĐÃ XỬ LÝ XONG */}
          {isResolved && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sự cố đã được khắc phục hoàn tất</span>
                </div>
                {ticket.resolutionNote && (
                  <p className="text-emerald-800/90 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-100 whitespace-pre-line">
                    <strong>Biên bản khắc phục:</strong> {ticket.resolutionNote}
                  </p>
                )}
              </div>

              {ticket.resolutionAttachmentUrls && ticket.resolutionAttachmentUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">
                    Ảnh nghiệm thu sau sửa chữa:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ticket.resolutionAttachmentUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 block"
                      >
                        <img
                          src={url}
                          alt="Ảnh nghiệm thu"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
