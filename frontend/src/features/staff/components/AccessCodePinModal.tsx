import React, { useState } from 'react';
import { KeyRound, Copy, Check, Printer, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import type { CheckInContract } from '../../../types';
import { Button } from '../../../components/ui/Button';

export interface AccessCodePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessCode: string;
  contract: CheckInContract;
}

export const AccessCodePinModal: React.FC<AccessCodePinModalProps> = ({
  isOpen,
  onClose,
  accessCode,
  contract,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header chúc mừng */}
        <div className="bg-gradient-to-r from-emerald-600 via-brand-600 to-teal-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">BÀN GIAO Ô KHO THÀNH CÔNG!</h2>
          <p className="text-xs text-white/90 mt-1">
            Hợp đồng <span className="font-mono font-bold text-white">{contract.code}</span> đã chính thức chuyển sang trạng thái <strong className="underline">ACTIVE</strong>
          </p>
        </div>

        {/* Thân Modal */}
        <div className="p-6 space-y-5">
          {/* Thông tin ô kho & Khách */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Khách hàng nhận kho:</span>
              <span className="font-bold text-slate-900 text-sm">{contract.customerName}</span>
              <span className="text-slate-500 font-mono block text-[11px] mt-0.5">{contract.customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Ô kho bàn giao:</span>
              <span className="font-extrabold text-base font-mono text-brand-700">{contract.storageUnitCode}</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">{contract.unitTypeName}</span>
            </div>
          </div>

          {/* Hộp mã PIN 6 số lớn (BR-ACC-01) */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <KeyRound className="w-4 h-4 text-brand-600" />
              Mã PIN Mở Cửa Bảo Mật 24/7 (BR-ACC-01)
            </div>

            <div className="relative flex items-center justify-center bg-brand-50/70 border-2 border-brand-300 rounded-2xl p-4 shadow-inner">
              <span className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-brand-700 select-all">
                {accessCode.split('').join(' ')}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-white rounded-xl border border-brand-200 text-brand-700 hover:bg-brand-50 shadow-xs transition-all cursor-pointer"
                title="Sao chép mã PIN"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
              Mã PIN gồm 6 số duy nhất dùng để mở cổng chính cơ sở và cửa ô kho <strong className="text-slate-800">{contract.storageUnitCode}</strong>. Có hiệu lực ngay lập tức.
            </p>
          </div>

          {/* Thông báo tự động gửi biên bản */}
          <div className="space-y-2 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Hệ thống kích hoạt tự động theo BR-CHK-04 & BR-ACC-02:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 pl-1">
              <li>Ô kho <strong className="font-mono">{contract.storageUnitCode}</strong> đã chuyển từ <em>Reserved</em> sang <em>Occupied</em>.</li>
              <li>Hợp đồng đã chốt ngày bắt đầu thuê và gửi mã kích hoạt lên app của khách.</li>
              <li>Đã tự động gửi SMS và đính kèm bản sao PDF biên bản bàn giao điện tử về email.</li>
            </ul>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              In biên bản bàn giao
            </button>

            <Button
              type="button"
              onClick={onClose}
              variant="primary"
              size="md"
              className="flex-1 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Hoàn tất ca tiếp đón
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
