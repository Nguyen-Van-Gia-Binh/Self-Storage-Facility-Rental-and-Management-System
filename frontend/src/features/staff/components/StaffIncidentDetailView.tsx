import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  Receipt,
  ShieldCheck,
  Loader2,
  FileText,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import type { DailyIncidentTask, SurchargeItem } from '@/types';
import {
  getStaffIncidentDetail,
  resolveStaffIncident,
  markStaffIncidentRelocation,
} from '@/api/staff';
import { fetchSurcharges } from '@/api/pricing';
import { applyCatalogFee, getContractById } from '@/api/contract';
import { catalogLineAmount, feeCategoryLabel } from '@/features/pricing/feeCategory';
import { EvidencePhotoCapture } from './EvidencePhotoCapture';

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
  const [incidentDetail, setIncidentDetail] = useState<DailyIncidentTask>(task);
  const [ticketStatus, setTicketStatus] = useState<string>(task.status || 'PENDING');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for resolution
  const [resolutionNote, setResolutionNote] = useState<string>(task.resolutionNote || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>(task.resolutionAttachmentUrls || []);
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [needsRelocation, setNeedsRelocation] = useState<boolean>(Boolean(task.relocationRequired));
  const [savingRelocation, setSavingRelocation] = useState<boolean>(false);

  // BOM surcharges list and selection states
  const [allSurcharges, setAllSurcharges] = useState<SurchargeItem[]>([]);
  const [loadingSurcharges, setLoadingSurcharges] = useState<boolean>(false);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);
  const [contractMonthlyPrice, setContractMonthlyPrice] = useState<number>(0);

  // Fault attribution states: COMPANY vs CUSTOMER
  const [faultParty, setFaultParty] = useState<'COMPANY' | 'CUSTOMER' | null>(null);
  const [isCustomerPaidConfirmed, setIsCustomerPaidConfirmed] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Nạp chi tiết phiếu sự cố từ Backend GET /management/support-requests/{id}
  useEffect(() => {
    setIncidentDetail(task);
    setTicketStatus(task.status || 'PENDING');
    setResolutionNote(task.resolutionNote || '');
    setAttachmentUrls(task.resolutionAttachmentUrls || []);
    setNeedsRelocation(Boolean(task.relocationRequired));

    if (!task.ticketId) return;
    let active = true;
    getStaffIncidentDetail(task.ticketId)
      .then((detail) => {
        if (!active || !detail) return;
        setIncidentDetail((prev) => ({
          ...prev,
          ...detail,
          title: detail.title || prev.title,
          description: detail.description || prev.description,
          unitCode: detail.unitCode && detail.unitCode !== '---' ? detail.unitCode : prev.unitCode,
          facilityName: detail.facilityName || prev.facilityName,
          customerName: detail.customerName || prev.customerName,
          customerPhone: detail.customerPhone || prev.customerPhone,
        }));
        if (detail.status) setTicketStatus(detail.status);
        if (detail.resolutionNote) setResolutionNote(detail.resolutionNote);
        if (detail.resolutionAttachmentUrls && detail.resolutionAttachmentUrls.length > 0) {
          setAttachmentUrls(detail.resolutionAttachmentUrls);
        }
        if (detail.relocationRequired !== undefined) {
          setNeedsRelocation(Boolean(detail.relocationRequired));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [task]);

  // Nạp giá thuê hàng tháng thực tế từ hợp đồng trên Backend để tính phụ phí theo % (nếu có)
  useEffect(() => {
    const targetContractId = incidentDetail.contractId ?? task.contractId;
    if (!targetContractId) return;
    let active = true;
    getContractById(targetContractId)
      .then((contract) => {
        if (active && contract?.monthlyPrice) {
          setContractMonthlyPrice(contract.monthlyPrice);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [incidentDetail.contractId, task.contractId]);

  // Nạp danh mục phụ phí từ BOM API
  const loadSurcharges = useCallback(async () => {
    setLoadingSurcharges(true);
    try {
      const targetFacilityId = incidentDetail.facilityId ?? task.facilityId;
      const list = await fetchSurcharges({ isActive: true });
      const validFees = list.filter(
        (fee) =>
          fee.isActive &&
          (fee.facilityId == null || fee.facilityId === targetFacilityId),
      );
      setAllSurcharges(validFees);
    } catch (err) {
      console.warn('Lỗi nạp phụ phí BOM:', err);
      setAllSurcharges([]);
    } finally {
      setLoadingSurcharges(false);
    }
  }, [incidentDetail.facilityId, task.facilityId]);

  useEffect(() => {
    loadSurcharges();
  }, [loadSurcharges]);

  const isResolved = ticketStatus === 'RESOLVED' || ticketStatus === 'CLOSED';

  // Tính số tiền của từng phụ phí theo công thức chuẩn catalogLineAmount từ Backend
  const calculateFeeAmount = (fee: SurchargeItem): number => {
    return catalogLineAmount(fee, contractMonthlyPrice);
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

  // Hoàn tất khắc phục sự cố trực tiếp (1 bước duy nhất)
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

    if (faultParty === 'COMPANY' && allSurcharges.length > 0 && selectedFeeIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 hạng mục sửa chữa/vật tư để hệ thống hạch toán chi phí bảo trì cơ sở.');
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
      const targetContractId = incidentDetail.contractId ?? task.contractId;
      // Nếu lỗi do khách hàng và có phụ phí chọn + có contractId: ghi nhận phụ phí vào hợp đồng
      if (faultParty === 'CUSTOMER' && selectedFeeIds.length > 0 && targetContractId != null) {
        for (const feeId of selectedFeeIds) {
          try {
            const feeItem = allSurcharges.find((f) => f.id === feeId);
            const feeName = feeItem ? feeItem.name : `Phụ phí #${feeId}`;
            await applyCatalogFee(
              targetContractId,
              feeId,
              `[Sự cố ${incidentDetail.code || `SUP-${task.ticketId}`}] ${feeName} - Khách đã thanh toán`,
            );
          } catch (feeErr) {
            console.warn('Lỗi ghi nhận phụ phí vào hợp đồng:', feeErr);
          }
        }
      }

      // Đảm bảo trạng thái cờ di dời kho được đồng bộ với backend
      if (needsRelocation !== Boolean(incidentDetail.relocationRequired)) {
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
        const selectedFeeNames = allSurcharges
          .filter((f) => selectedFeeIds.includes(f.id))
          .map((f) => `${f.name} (${calculateFeeAmount(f).toLocaleString('vi-VN')} đ)`)
          .join(', ');
        faultSummary = `\n[Trách nhiệm: Lỗi do công ty | Hạng mục sửa chữa: ${selectedFeeNames || 'Không có'} | Chi phí công ty chịu: ${totalFeeAmount.toLocaleString('vi-VN')} đ | Khách hàng miễn phí: 0 đ${relocationText}]`;
      } else {
        const selectedFeeNames = allSurcharges
          .filter((f) => selectedFeeIds.includes(f.id))
          .map((f) => `${f.name} (${calculateFeeAmount(f).toLocaleString('vi-VN')} đ)`)
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
    (faultParty === 'COMPANY' && allSurcharges.length > 0 && selectedFeeIds.length === 0) ||
    (faultParty === 'CUSTOMER' && !isCustomerPaidConfirmed);

  const rawTitle = incidentDetail.title || 'Xử lý sự cố thực địa';
  const colonIdx = rawTitle.indexOf(':');
  const shortTitle = colonIdx !== -1 ? rawTitle.slice(0, colonIdx).trim() : rawTitle;
  const detailDescription =
    incidentDetail.description || (colonIdx !== -1 ? rawTitle.slice(colonIdx + 1).trim() : '');

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

      {/* Nội dung chi tiết 2 cột (Tràn màn hình tại chỗ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4/12): Thông tin phiếu sự cố, khách hàng & hành động tiếp nhận */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Phiếu yêu cầu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Quay lại Nhiệm vụ ca trực"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Thông tin phản ánh
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-500">
                {incidentDetail.code || `SUP-${task.ticketId}`}
              </span>
            </div>

            {/* Mô tả sự cố */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">{shortTitle}</span>
              {detailDescription && (
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                  {detailDescription}
                </p>
              )}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Mã ô kho:</span>
                <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  {incidentDetail.unitCode || 'Chưa gán'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Cơ sở:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {incidentDetail.facilityName || 'Cơ sở hiện tại'}
                </span>
              </div>
              {incidentDetail.createdAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Thời gian báo:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {new Date(incidentDetail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Thông tin khách hàng */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2.5 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-900 text-sm">{incidentDetail.customerName || 'Khách thuê kho'}</span>
              </div>

              {incidentDetail.customerPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 text-xs">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono">{incidentDetail.customerPhone}</span>
                  </div>
                  <a
                    href={`tel:${incidentDetail.customerPhone}`}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
                  >
                    <span>Gọi điện</span>
                  </a>
                </div>
              )}
            </div>

            {/* Cờ chuyển ô kho khẩn cấp */}
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
                Sự cố #{incidentDetail.code || task.ticketId} đã được khắc phục hoàn tất
              </h3>
              <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-700">Biên bản kết quả xử lý:</span>
                <p className="text-slate-800 whitespace-pre-wrap">{incidentDetail.resolutionNote || resolutionNote || 'Không có ghi chú thêm.'}</p>
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
                    <span>Biên bản giải quyết hiện trường</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xác nhận khắc phục, phân định trách nhiệm chi phí và lưu ảnh bằng chứng.
                  </p>
                </div>
              </div>

              {/* Phân định trách nhiệm (BẮT BUỘC) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>1. Phân định trách nhiệm <span className="text-rose-500">*</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFaultParty('COMPANY');
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
                      <span className="font-bold text-xs text-emerald-700 font-mono">
                        {faultParty === 'COMPANY' && totalFeeAmount > 0
                          ? `${totalFeeAmount.toLocaleString('vi-VN')} đ (Công ty chịu)`
                          : 'Công ty chịu 100%'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sự cố do cơ sở vật chất xuống cấp, thấm dột tự nhiên. Khách hàng miễn phí 0 đ, chi phí khắc phục trừ vào doanh thu cơ sở.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFaultParty('CUSTOMER');
                    }}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      faultParty === 'CUSTOMER'
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Lỗi do Khách hàng</span>
                      <span className="font-bold text-xs text-amber-700 font-mono">
                        {faultParty === 'CUSTOMER' && totalFeeAmount > 0
                          ? `${totalFeeAmount.toLocaleString('vi-VN')} đ (Khách trả)`
                          : 'Áp dụng phụ phí niêm yết'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sử dụng sai quy cách, làm gãy khóa, bẩn tường. Khách hàng phải bồi hoàn theo biểu giá niêm yết.
                    </p>
                  </button>
                </div>
              </div>

              {/* Danh mục hạng mục sửa chữa / vật tư khi Lỗi do Công ty */}
              {faultParty === 'COMPANY' && (
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-emerald-700" />
                      <span>Chọn hạng mục sửa chữa / vật tư khắc phục (Công ty chi trả):</span>
                    </label>
                    <span className="font-mono font-bold text-xs text-emerald-900">
                      Chi phí công ty chịu: {totalFeeAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {loadingSurcharges ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-600" />
                      Đang tải danh mục sửa chữa / vật tư...
                    </div>
                  ) : allSurcharges.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Không có danh mục sửa chữa nào đang hoạt động trong hệ thống.</p>
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
                                ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFee(fee.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                              />
                              <div>
                                <p className="font-semibold">{fee.name}</p>
                                <span className="text-[10px] text-slate-500">{feeCategoryLabel(fee.category)}</span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-emerald-800">
                              {cost.toLocaleString('vi-VN')} đ
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Giải thích hạch toán vào báo cáo cơ sở FM-06 */}
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-emerald-950 font-semibold">
                      <span>Khách hàng thanh toán:</span>
                      <span className="font-mono text-emerald-700 font-bold">0 đ (Miễn phí hoàn toàn theo BR-SUP-02)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-300/80">
                      💡 <strong>Hạch toán kế toán vận hành:</strong> Chi phí sửa chữa{' '}
                      <span className="font-mono font-bold text-emerald-900">{totalFeeAmount.toLocaleString('vi-VN')} đ</span> này được ghi nhận trực tiếp vào{' '}
                      <strong>Báo cáo cơ sở (FM-06)</strong> tại mục <em>"4. Chi phí công ty chịu"</em> và trừ thẳng vào <em>Doanh thu thuần cơ sở</em>.
                    </p>
                    {allSurcharges.length > 0 && selectedFeeIds.length === 0 && (
                      <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Vui lòng tích chọn các hạng mục vật tư / sửa chữa đã thực hiện để hệ thống hạch toán chi phí cơ sở.</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Danh mục phụ phí niêm yết (Khi lỗi do khách hàng) */}
              {faultParty === 'CUSTOMER' && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-amber-700" />
                      <span>Chọn phụ phí bồi hoàn từ danh mục niêm yết:</span>
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

              {/* Ảnh nghiệm thu hiện trường bằng Camera */}
              <EvidencePhotoCapture
                photos={attachmentUrls}
                onChange={setAttachmentUrls}
                maxPhotos={5}
                label="3. Ảnh chụp hiện trường sau nghiệm thu"
                helperText="Bấm Mở Camera để kích hoạt cam trước chụp trực tiếp hiện trường sau khi khắc phục hoặc tải ảnh từ máy"
              />

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
