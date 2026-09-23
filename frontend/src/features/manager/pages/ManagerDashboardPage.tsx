import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileText, Users, ArrowRight, Wrench, BarChart3, Building2 } from 'lucide-react';

const NAV_CARDS = [
  {
    to: '/manager/contracts',
    icon: FileText,
    color: 'blue',
    iconBg: 'from-blue-500 to-blue-600',
    hoverBorder: 'hover:border-blue-400',
    hoverShadow: 'hover:shadow-blue-100',
    textColor: 'text-blue-600',
    label: 'Há»£p Ä‘á»“ng & KhÃ¡ch thuÃª',
    subtitle: 'SCR-FM-02',
    desc: 'Theo dÃµi há»£p Ä‘á»“ng Ä‘ang thuÃª, danh sÃ¡ch chá» bÃ n giao, Ä‘á»•i Ã´ kho ngoáº¡i lá»‡ vÃ  quyáº¿t toÃ¡n hoÃ n cá»c.',
    cta: 'Má»Ÿ Contracts Hub',
  },
  {
    to: '/manager/units',
    icon: Layers,
    color: 'emerald',
    iconBg: 'from-emerald-500 to-emerald-600',
    hoverBorder: 'hover:border-emerald-400',
    hoverShadow: 'hover:shadow-emerald-100',
    textColor: 'text-emerald-600',
    label: 'Danh má»¥c Ã” kho & Layout',
    subtitle: 'SCR-FM-01',
    desc: 'Quáº£n lÃ½ danh sÃ¡ch Ã´ kho váº­t lÃ½, phÃ¢n loáº¡i Type S/M/L/XL vÃ  kiá»ƒm soÃ¡t tráº¡ng thÃ¡i sáºµn sÃ ng.',
    cta: 'Má»Ÿ Quáº£n lÃ½ Ã´ kho',
  },
  {
    to: '/manager/staff-assignment',
    icon: Users,
    color: 'purple',
    iconBg: 'from-purple-500 to-purple-600',
    hoverBorder: 'hover:border-purple-400',
    hoverShadow: 'hover:shadow-purple-100',
    textColor: 'text-purple-600',
    label: 'PhÃ¢n cÃ´ng NhÃ¢n sá»±',
    subtitle: 'SCR-FM-03',
    desc: 'CÃ¢n báº±ng táº£i nhÃ¢n viÃªn ca trá»±c, Ä‘iá»u phá»‘i bÃ n giao Check-in, Tráº£ kho, KhÃ³a ngoÃ i Overlock.',
    cta: 'Má»Ÿ BÃ n phÃ¢n cÃ´ng',
  },
  {
    to: '/manager/incidents',
    icon: Wrench,
    color: 'amber',
    iconBg: 'from-amber-500 to-orange-500',
    hoverBorder: 'hover:border-amber-400',
    hoverShadow: 'hover:shadow-amber-100',
    textColor: 'text-amber-600',
    label: 'Xá»­ lÃ½ Sá»± cá»‘ & Ticket',
    subtitle: 'SCR-FM-05',
    desc: 'Tiáº¿p nháº­n khiáº¿u náº¡i, giÃ¡m sÃ¡t thá»i háº¡n cam káº¿t SLA 2 giá» vÃ  giao viá»‡c xá»­ lÃ½ káº¹t khÃ³a, tháº¥m dá»™t.',
    cta: 'Má»Ÿ BÃ n Ä‘iá»u phá»‘i',
  },
  {
    to: '/manager/reports',
    icon: BarChart3,
    color: 'indigo',
    iconBg: 'from-indigo-500 to-indigo-600',
    hoverBorder: 'hover:border-indigo-400',
    hoverShadow: 'hover:shadow-indigo-100',
    textColor: 'text-indigo-600',
    label: 'BÃ¡o cÃ¡o CÆ¡ sá»Ÿ & Hiá»‡u suáº¥t',
    subtitle: 'SCR-FM-04',
    desc: 'GiÃ¡m sÃ¡t tá»· lá»‡ láº¥p Ä‘áº§y Usage Rate, phÃ¢n tÃ­ch doanh thu thÃ¡ng vÃ  rá»§i ro ná»£ quÃ¡ háº¡n theo 3 Ä‘á»™ tuá»•i.',
    cta: 'Má»Ÿ Dashboard BÃ¡o cÃ¡o',
  },
];

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'];

export const ManagerDashboardPage: React.FC = () => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'ChÃ o buá»•i sÃ¡ng' : hour < 18 ? 'ChÃ o buá»•i chiá»u' : 'ChÃ o buá»•i tá»‘i';

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
          <Building2 className="w-full h-full" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 text-blue-200 px-3 py-1 rounded-full border border-white/20">
              <Building2 className="w-3.5 h-3.5" />
              Facility Manager Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {greeting}! ðŸ‘‹
          </h1>
          <p className="text-blue-200 text-sm mt-1.5 max-w-lg">
            Tá»•ng quan Ä‘iá»u phá»‘i cÆ¡ sá»Ÿ kho. Chá»n phÃ¢n há»‡ bÃªn dÆ°á»›i Ä‘á»ƒ báº¯t Ä‘áº§u quáº£n lÃ½ váº­n hÃ nh hÃ´m nay.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-blue-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Há»‡ thá»‘ng Ä‘ang hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng Â· {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {NAV_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className={[
                'p-5 rounded-2xl border border-slate-200 bg-white',
                'hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group flex flex-col justify-between',
                card.hoverBorder,
                card.hoverShadow,
                STAGGER[idx] || '',
              ].join(' ')}
            >
              <div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.iconBg} text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className={`font-bold text-slate-900 text-sm group-hover:${card.textColor} transition-colors`}>
                    {card.label}
                  </h3>
                </div>
                <span className={`text-[10px] font-mono ${card.textColor} bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100`}>
                  {card.subtitle}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  {card.desc}
                </p>
              </div>
              <div className={`mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs ${card.textColor} font-semibold`}>
                <span>{card.cta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
