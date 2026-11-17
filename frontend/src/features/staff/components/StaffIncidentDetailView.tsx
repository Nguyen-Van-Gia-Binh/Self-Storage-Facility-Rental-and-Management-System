import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { DailyIncidentTask, SurchargeItem } from '@/types';
import {
  getStaffIncidentDetail,
  resolveStaffIncident,
  markStaffIncidentRelocation,
  isSupportTaskDone,
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

  const isResolved = isSupportTaskDone({
    status: ticketStatus,
    completed: incidentDetail.completed ?? task.completed,
    contractStatus: incidentDetail.contractStatus ?? task.contractStatus,
  });

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

    if (faultParty === 'CUSTOMER' && allSurcharges.length > 0 && selectedFeeIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 khoản phụ phí / bồi hoàn niêm yết để lập biên bản thu phí từ khách hàng.');
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
      const ticketCode = incidentDetail.code || task.code;
      if (faultParty === 'CUSTOMER' && selectedFeeIds.length > 0) {
        if (targetContractId == null || !ticketCode) {
          setErrorMsg('Phiếu chưa gắn hợp đồng hoặc mã sự cố, chưa ghi được phụ phí.');
          setSubmitting(false);
          return;
        }
        for (const feeId of selectedFeeIds) {
          const feeItem = allSurcharges.find((f) => f.id === feeId);
          const feeName = feeItem ? feeItem.name : `Phụ phí #${feeId}`;
          await applyCatalogFee(
            targetContractId,
            feeId,
            `[Sự cố ${ticketCode}] ${feeName} - Chưa thu`,
            false,
          );
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
        faultSummary = `\n[Trách nhiệm: Lỗi do khách hàng | Phụ phí: ${selectedFeeNames || 'Không phát sinh phụ phí'} | Tổng thu: ${totalFeeAmount.toLocaleString('vi-VN')} đ | Chưa thu — chờ Quản lý cơ sở thu tiền${relocationText}]`;
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
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    !isAgreed ||
    !resolutionNote.trim() ||
    faultParty === null ||
    (allSurcharges.length > 0 && selectedFeeIds.length === 0);

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
                  <span className="num font-medium text-slate-700">
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  <span>1. Phân định trách nhiệm <span className="text-rose-500">*</span></span>
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="faultParty"
                      checked={faultParty === 'COMPANY'}
                      onChange={() => {
                        setFaultParty('COMPANY');
                      }}
                      className="mt-1 w-4 h-4 accent-brand-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Lỗi do Công ty (Hạ tầng)</span>
                      <span className="block text-sm text-slate-500">Sự cố do cơ sở vật chất xuống cấp, thấm dột tự nhiên. Khách hàng miễn phí 0 đ, chi phí khắc phục trừ vào doanh thu cơ sở.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="faultParty"
                      checked={faultParty === 'CUSTOMER'}
                      onChange={() => setFaultParty('CUSTOMER')}
                      className="mt-1 w-4 h-4 accent-brand-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">Lỗi do Khách hàng</span>
                      <span className="block text-sm text-slate-500">Sử dụng sai quy cách, làm gãy khóa, bẩn tường. Khách hàng phải bồi hoàn theo biểu giá niêm yết.</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Danh mục hạng mục sửa chữa / vật tư khi Lỗi do Công ty */}
              {faultParty === 'COMPANY' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">Chọn hạng mục sửa chữa / vật tư khắc phục (Công ty chi trả):</span>
                    <span className="num text-sm text-slate-900 shrink-0">
                      Chi phí công ty chịu: {totalFeeAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {loadingSurcharges ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                      Đang tải danh mục sửa chữa / vật tư...
                    </div>
                  ) : allSurcharges.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Không có danh mục sửa chữa nào đang hoạt động trong hệ thống.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {allSurcharges.map((fee) => {
                        const isChecked = selectedFeeIds.includes(fee.id);
                        const cost = calculateFeeAmount(fee);
                        return (
                          <label
                            key={fee.id}
                            className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-200 cursor-pointer"
                          >
                            <span className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFee(fee.id)}
                                className="mt-0.5 w-4 h-4 accent-brand-500"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-slate-900">{fee.name}</span>
                                <span className="block text-xs text-slate-500">{feeCategoryLabel(fee.category)}</span>
                              </span>
                            </span>
                            <span className="num text-sm text-slate-900 shrink-0">
                              {cost.toLocaleString('vi-VN')} đ
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-sm text-slate-600">
                    Khách hàng thanh toán: <span className="num text-slate-900">0 đ (Miễn phí hoàn toàn theo BR-SUP-02)</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Chi phí sửa chữa <span className="num text-slate-900">{totalFeeAmount.toLocaleString('vi-VN')} đ</span> được ghi nhận vào Báo cáo cơ sở (FM-06) tại mục "4. Chi phí công ty chịu" và trừ vào Doanh thu thuần cơ sở.
                  </p>
                  {allSurcharges.length > 0 && selectedFeeIds.length === 0 && (
                    <p className="text-sm text-slate-600">Vui lòng tích chọn các hạng mục vật tư / sửa chữa đã thực hiện để hệ thống hạch toán chi phí cơ sở.</p>
                  )}
                </div>
              )}

              {/* Danh mục phụ phí niêm yết (Khi lỗi do khách hàng) */}
              {faultParty === 'CUSTOMER' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">Chọn phụ phí bồi hoàn từ danh mục niêm yết:</span>
                    <span className="text-sm text-slate-700 shrink-0">
                      Tổng thu: <span className="num text-rose-600">{totalFeeAmount.toLocaleString('vi-VN')} đ</span>
                    </span>
                  </div>

                  {loadingSurcharges ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                      Đang tải biểu giá phụ phí...
                    </div>
                  ) : allSurcharges.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Không có phụ phí nào đang hoạt động trong danh mục.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {allSurcharges.map((fee) => {
                        const isChecked = selectedFeeIds.includes(fee.id);
                        const cost = calculateFeeAmount(fee);
                        return (
                          <label
                            key={fee.id}
                            className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-200 cursor-pointer"
                          >
                            <span className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFee(fee.id)}
                                className="mt-0.5 w-4 h-4 accent-brand-500"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-slate-900">{fee.name}</span>
                                <span className="block text-xs text-slate-500">{feeCategoryLabel(fee.category)}</span>
                              </span>
                            </span>
                            <span className="num text-sm text-slate-900 shrink-0">
                              {cost.toLocaleString('vi-VN')} đ
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-sm text-slate-600">
                    Khoản <span className="num text-slate-900">{totalFeeAmount.toLocaleString('vi-VN')} đ</span> ghi nợ trên hợp đồng. Quản lý cơ sở bấm Đã nhận tiền thì số này mới vào doanh thu phụ phí.
                  </p>
                  {allSurcharges.length > 0 && selectedFeeIds.length === 0 && (
                    <p className="text-sm text-slate-600">Vui lòng tích chọn các khoản phụ phí bồi hoàn để hệ thống ghi nhận doanh thu dịch vụ cho cơ sở.</p>
                  )}
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
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
