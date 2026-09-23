import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  HelpCircle, 
  ChevronDown, 
  ShieldCheck, 
  PhoneCall, 
  Clock, 
  Zap
} from 'lucide-react';
import { mockSupportFaqs } from '../mockData';

export const SupportFaqSection: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<number | null>(1);

  const toggleFaq = (id: number) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Chính sách & Quy định hỗ trợ</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Câu Hỏi Thường Gặp & Cam Kết Dịch Vụ
          </h2>
        </div>

        {/* 24/7 Hotline Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-800">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-wider block">
              Tổng đài khẩn cấp 24/7
            </span>
            <strong className="text-sm font-black text-brand-950 tracking-wide">
              1900 8888
            </strong>
          </div>
        </div>
      </div>

      {/* Grid of SLA summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 text-amber-600 mb-1.5">
            <Zap className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">SLA Khẩn cấp 2 giờ</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sự cố kẹt khóa cơ, lỗi mã PIN mở cửa được nhân viên trực tiếp khắc phục tận nơi trong tối đa 2 giờ.
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 text-emerald-600 mb-1.5">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Hoàn cọc 7 ngày</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tiền đặt cọc được hoàn trả về tài khoản ngân hàng của bạn trong vòng tối đa 7 ngày làm việc sau khi nghiệm thu trả kho.
          </p>
        </Card>

        <Card className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 text-sky-600 mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wide">Hạ tầng bảo đảm 100%</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sự cố do trần dột hoặc lỗi kỹ thuật hạ tầng, cơ sở chịu 100% chi phí và hỗ trợ chuyển ô kho dự phòng nếu cần.
          </p>
        </Card>
      </div>

      {/* Accordion List */}
      <div className="space-y-2.5">
        {mockSupportFaqs.map((faq) => {
          const isOpen = openFaqId === faq.id;
          return (
            <Card
              key={faq.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOpen ? 'border-brand-300 shadow-xs' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none bg-white hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {faq.id}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    {faq.question}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {faq.category}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <p>{faq.answer}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
