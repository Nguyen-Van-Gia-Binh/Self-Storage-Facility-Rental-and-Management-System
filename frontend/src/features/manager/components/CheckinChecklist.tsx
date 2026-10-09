// frontend/src/features/manager/components/CheckinChecklist.tsx
import React from 'react';
import { CheckCircle2, ShieldCheck, Key, FileText, Printer } from 'lucide-react';

interface CheckinChecklistProps {
  pinCode?: string;
  isSigned?: boolean;
  onViewContract?: () => void;
  onPrintHandover?: () => void;
}

export const CheckinChecklist: React.FC<CheckinChecklistProps> = ({
  pinCode = '123456',
  isSigned = true,
  onViewContract,
  onPrintHandover,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Biên bản bàn giao ô kho (Check-in)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <span className="text-slate-600 font-medium">1. Vệ sinh sàn & vách kho:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đạt chuẩn
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <span className="text-slate-600 font-medium">2. Cửa cuốn / Bản lề khóa:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đạt chuẩn
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <span className="text-slate-600 font-medium">3. Chống ẩm & Cảm biến PCCC:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hoạt động tốt
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <span className="text-slate-600 font-medium">4. Khóa điện tử / Đầu đọc thẻ:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đạt chuẩn
          </span>
        </div>
      </div>

      {/* Thông tin mã PIN & Chữ ký */}
      <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Key className="w-5 h-5 text-brand-600" />
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Mã PIN mở cửa đã kích hoạt:</span>
            <span className="font-mono text-base font-bold text-brand-700 tracking-wider">
              {pinCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Chữ ký điện tử:</span>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            {isSigned ? '✓ Đã ký nhận bàn giao' : 'Chưa ký'}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        {onViewContract && (
          <button
            type="button"
            onClick={onViewContract}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem Hợp đồng điện tử</span>
          </button>
        )}

        {onPrintHandover && (
          <button
            type="button"
            onClick={onPrintHandover}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In biên bản bàn giao</span>
          </button>
        )}
      </div>
    </div>
  );
};
