import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileSpreadsheet, Printer, ShieldCheck, CheckCircle2, Calendar, Building2 } from 'lucide-react';
import type { ReportFilterParams, ReportExportParams } from '@/types';
import { exportSystemReport } from '@/api/report';
import { downloadBlobFile, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/Button';

export interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (facilityId?: number) => void;
  currentFilters: ReportFilterParams;
  facilities: { id: number; name: string }[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  currentFilters,
  facilities,
}) => {
  const [reportType, setReportType] = useState<ReportExportParams['type']>('REVENUE');
  const [format, setFormat] = useState<ReportExportParams['format']>('CSV');
  const [facilityId, setFacilityId] = useState<number | undefined>(currentFilters.facilityId);
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sinh mã phiên xuất ngẫu nhiên để phục vụ Audit Trail
  const [sessionId] = useState(() => `EXP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  const now = new Date();
  const exportTimestamp = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setSuccessMessage(null);

    try {
      if (format === 'PDF') {
        setIsExporting(false);
        onPrint(facilityId);
        return;
      }

      // Gọi API xuất file CSV / XLSX
      const blob = await exportSystemReport({
        type: reportType,
        from: currentFilters.from,
        to: currentFilters.to,
        facilityId: facilityId,
        format: format,
      });

      const extension = format === 'CSV' ? 'csv' : 'xlsx';
      const facilityTag = facilityId ? `_facility_${facilityId}` : '_system_wide';
      const filename = `report_${reportType.toLowerCase()}${facilityTag}_${currentFilters.from}_${currentFilters.to}.${extension}`;

      downloadBlobFile(blob, filename);

      setSuccessMessage(`Đã kết xuất thành công tệp ${filename}!`);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Lỗi khi kết xuất file báo cáo:', error);
      setIsExporting(false);
    }
  };

  return createPortal(
    <div
      className="no-print fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-enter animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden modal-panel-enter animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Trích Xuất Báo Cáo Đối Soát & BI
              </h3>
              <p className="text-xs text-slate-500">
                Chuẩn hóa dữ liệu toàn hệ thống theo thời gian thực
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung form */}
        <div className="p-5 space-y-4">
          {/* 1. Chọn loại báo cáo — CSV/Excel. PDF luôn in cả bộ trình ký. */}
          {format === 'PDF' ? (
            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/40 text-xs text-slate-700 leading-relaxed">
              Bản in là bộ báo cáo trình ký đủ 3 phần của kỳ{' '}
              <strong>{formatDate(currentFilters.from)} → {formatDate(currentFilters.to)}</strong>
              {' '}và phạm vi{' '}
              <strong>
                {facilityId
                  ? facilities.find((fac) => fac.id === facilityId)?.name || 'Cơ sở đã chọn'
                  : 'toàn bộ hệ thống'}
              </strong>
              : doanh thu, tỷ lệ lấp đầy và nợ quá hạn. CSV và Excel vẫn xuất từng danh mục riêng.
            </div>
          ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Chọn danh mục số liệu báo cáo:
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'REVENUE',
                  title: 'Báo cáo Doanh thu & Cơ cấu Dòng tiền',
                  desc: 'Bóc tách tiền thuê, cọc, phí gia hạn, phụ phí, hoàn tiền',
                },
                {
                  id: 'OCCUPANCY',
                  title: 'Báo cáo Tỷ lệ Lấp đầy & Tải Kho',
                  desc: 'Tỷ lệ sử dụng ô kho từng cơ sở và chi tiết số lượng ô kho theo các trạng thái',
                },
                {
                  id: 'OVERDUE',
                  title: 'Báo cáo Danh sách Hợp đồng Quá hạn',
                  desc: 'Số ngày trễ hạn, tiền phạt lũy kế và tiến trình xử lý quá hạn',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    reportType === item.id
                      ? 'border-brand-500 bg-brand-50/30 ring-1 ring-brand-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    checked={reportType === item.id}
                    onChange={() => setReportType(item.id as ReportExportParams['type'])}
                    className="mt-0.5 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          )}

          {/* 2. Phạm vi & Kỳ báo cáo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Phạm vi chi nhánh:
              </label>
              <select
                value={facilityId || ''}
                onChange={(e) =>
                  setFacilityId(e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">🏢 Toàn bộ hệ thống</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Kỳ số liệu:
              </label>
              <div className="px-3 py-2 bg-slate-100/70 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                {formatDate(currentFilters.from)} → {formatDate(currentFilters.to)}
              </div>
            </div>
          </div>

          {/* 3. Định dạng xuất file */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Định dạng tệp kết xuất:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'CSV',
                  label: 'CSV (Bảng tính)',
                  sub: 'UTF-8 with BOM',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'XLSX',
                  label: 'Excel (.xlsx)',
                  sub: 'Microsoft Office',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'PDF',
                  label: 'In ấn / PDF',
                  sub: 'Báo cáo Ban Giám Đốc',
                  icon: Printer,
                },
              ].map((fmt) => {
                const isSelected = format === fmt.id;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as ReportExportParams['format'])}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/40 text-brand-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{fmt.label}</span>
                    <span className="text-[10px] text-slate-400">{fmt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Audit Trail Metadata (US-BM-05.1 AC-2, AC-5) */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Nhật Ký Kiểm Toán (Audit Trail Metadata):</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-slate-500 pt-0.5">
              <div>Người xuất: <strong className="text-slate-800">BOM (Business Operations)</strong></div>
              <div>Múi giờ: <strong className="text-slate-800">Asia/Ho_Chi_Minh</strong></div>
              <div>Thời điểm: <strong className="text-slate-800">{exportTimestamp}</strong></div>
              <div>Mã phiên: <strong className="text-slate-800">{sessionId}</strong></div>
            </div>
          </div>

          {/* Thông báo kết xuất thành công */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {format === 'PDF' ? 'Xem & In Báo Cáo' : 'Tải File Về Máy'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
