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
} from 'lucide-react';
import type { DailyIncidentTask, SurchargeItem } from '@/types';
import { startStaffIncident, resolveStaffIncident, markStaffIncidentRelocation } from '@/api/staff';
import { fetchSurcharges } from '@/api/pricing';
import { applyCatalogFee } from '@/api/contract';
import { catalogFeePriceLabel } from '@/features/pricing/feeCategory';

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
  const [accessFees, setAccessFees] = useState<SurchargeItem[]>([]);
  const [lostKey, setLostKey] = useState(false);
  const [selectedKeyFeeId, setSelectedKeyFeeId] = useState<number | ''>('');
  const [keyFeeRecorded, setKeyFeeRecorded] = useState(false);
  const [recordingKeyFee, setRecordingKeyFee] = useState(false);

  useEffect(() => {
    if (ticket) {
      setErrorMsg(null);
      setResolutionNote(ticket.resolutionNote || '');
      setAttachmentUrls(ticket.resolutionAttachmentUrls || []);
      setImageUrlInput('');
      setIsAgreed(false);
      setNeedsRelocation(Boolean(ticket.relocationRequired));
      setLostKey(false);
      setSelectedKeyFeeId('');
      setKeyFeeRecorded(false);
    }
  }, [ticket]);

  useEffect(() => {
    if (!isOpen) return;
    fetchSurcharges({ isActive: true })
      .then((list) =>
        setAccessFees(
          list.filter(
            (fee) =>
              fee.isActive &&
              fee.category === 'ACCESS_KEY' &&
              (fee.facilityId == null || fee.facilityId === ticket?.facilityId),
          ),
        ),
      )
      .catch(() => setAccessFees([]));
  }, [isOpen, ticket?.facilityId]);

  if (!isOpen || !ticket) return null;

  const isPending =
    ticket.status === 'PENDING' || ticket.status === 'ASSIGNED' || ticket.status === 'NEW';
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  const isUnitDamage = ticket.category === 'UNIT_DAMAGE';
  const isLockAccess = ticket.category === 'LOCK_ACCESS';

  const handleRecordKeyFee = async () => {
    if (ticket.contractId == null) {
      setErrorMsg('Phiếu chưa gắn hợp đồng nên không ghi được phí cấp lại khóa.');
      return;
    }
    if (selectedKeyFeeId === '') {
      setErrorMsg('Chọn khoản cấp lại khóa cơ đang hiệu lực.');
      return;
    }
    setRecordingKeyFee(true);
    setErrorMsg(null);
    try {
      await applyCatalogFee(ticket.contractId, selectedKeyFeeId, 'Mất chìa khóa cơ, đã đối chiếu CCCD');
      setKeyFeeRecorded(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không ghi được phí cấp lại khóa.');
    } finally {
      setRecordingKeyFee(false);
    }
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
    if (lostKey && !keyFeeRecorded) {
      setErrorMsg('Đã đánh dấu mất chìa khóa cơ thì ghi nhận khoản ACCESS_KEY trước, hoặc bỏ đánh dấu nếu chỉ cấp lại PIN.');
      return;
    }

    if (ticket.ticketId == null) {
      setErrorMsg('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await resolveStaffIncident(ticket.ticketId, {
        resolutionNote: resolutionNote.trim(),
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
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed">
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

          {isUnitDamage && !isResolved && (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
              Hư do cơ sở không tạo phụ phí. Nếu hư do khách, khoản bồi thường được chọn lúc nghiệm thu trả kho.
            </p>
          )}

          {isLockAccess && !isResolved && (
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-600">
                Cấp lại PIN/QR là miễn phí và khách tự làm trên ứng dụng. Chỉ mất chìa khóa cơ mới thu phí, sau khi đối chiếu CCCD.
              </p>
              <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lostKey}
                  onChange={(e) => {
                    setLostKey(e.target.checked);
                    setKeyFeeRecorded(false);
                  }}
                  className="mt-0.5"
                />
                <span>Khách mất chìa khóa cơ và đã đối chiếu CCCD</span>
              </label>
              {lostKey && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedKeyFeeId}
                    onChange={(e) => setSelectedKeyFeeId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-2 bg-white"
                  >
                    <option value="">Chọn khoản cấp lại khóa</option>
                    {accessFees.map((fee) => (
                      <option key={fee.id} value={fee.id}>
                        {fee.name} — {catalogFeePriceLabel(fee)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleRecordKeyFee}
                    disabled={recordingKeyFee || keyFeeRecorded || ticket.contractId == null}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white disabled:opacity-50"
                  >
                    {keyFeeRecorded ? 'Đã ghi phí' : recordingKeyFee ? 'Đang ghi...' : 'Ghi nhận phí'}
                  </button>
                </div>
              )}
              {lostKey && accessFees.length === 0 && (
                <p className="text-[11px] text-amber-700">Chưa có khoản ACCESS_KEY đang hiệu lực.</p>
              )}
              {lostKey && ticket.contractId == null && (
                <p className="text-[11px] text-rose-700">Phiếu chưa gắn hợp đồng.</p>
              )}
            </div>
          )}

          {isUnitDamage && !isResolved && (
            <label className="flex items-start gap-2 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={needsRelocation}
                disabled={savingRelocation}
                onChange={(e) => handleRelocationChange(e.target.checked)}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <span>
                <strong>Không sửa tại chỗ được — cần di dời.</strong> Quản lý cơ sở chỉ đổi sang ô cùng loại khi cờ này được bật. Giá thuê và tiền cọc giữ nguyên.
              </span>
            </label>
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
            <form onSubmit={handleResolveSubmit} className="space-y-4 pt-2 border-t border-slate-200">
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

              {/* Tải / nhập link ảnh nghiệm thu */}
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

              <button
                type="submit"
                disabled={submitting || !isAgreed || !resolutionNote.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
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
                  <p className="text-emerald-800/90 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-100">
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
