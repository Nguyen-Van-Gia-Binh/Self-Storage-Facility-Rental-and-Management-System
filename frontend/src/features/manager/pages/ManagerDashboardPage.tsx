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
    label: 'Hợp đồng & Khách thuê',
    subtitle: 'SCR-FM-02',
    desc: 'Theo dõi hợp đồng đang thuê, danh sách chờ bàn giao, đổi ô kho ngoại lệ và quyết toán hoàn cọc.',
    cta: 'Mở Contracts Hub',
  },
  {
    to: '/manager/units',
    icon: Layers,
    color: 'emerald',
    iconBg: 'from-emerald-500 to-emerald-600',
    hoverBorder: 'hover:border-emerald-400',
    hoverShadow: 'hover:shadow-emerald-100',
    textColor: 'text-emerald-600',
    label: 'Danh mục Ô kho & Layout',
    subtitle: 'SCR-FM-01',
    desc: 'Quản lý danh sách ô kho vật lý, phân loại Type S/M/L/XL và kiểm soát trạng thái sẵn sàng.',
    cta: 'Mở Quản lý ô kho',
  },
  {
    to: '/manager/staff-assignment',
    icon: Users,
    color: 'purple',
    iconBg: 'from-purple-500 to-purple-600',
    hoverBorder: 'hover:border-purple-400',
    hoverShadow: 'hover:shadow-purple-100',
    textColor: 'text-purple-600',
    label: 'Phân công Nhân sự',
    subtitle: 'SCR-FM-03',
    desc: 'Cân bằng tải nhân viên ca trực, điều phối bàn giao Check-in, Trả kho, Khóa ngoài Overlock.',
    cta: 'Mở Bàn phân công',
  },
  {
    to: '/manager/incidents',
    icon: Wrench,
    color: 'amber',
    iconBg: 'from-amber-500 to-orange-500',
    hoverBorder: 'hover:border-amber-400',
    hoverShadow: 'hover:shadow-amber-100',
    textColor: 'text-amber-600',
    label: 'Xử lý Sự cố & Ticket',
    subtitle: 'SCR-FM-05',
    desc: 'Tiếp nhận khiếu nại, giám sát thời hạn cam kết SLA khẩn trên chính sách và giao việc xử lý kẹt khóa, thấm dột.',
    cta: 'Mở Bàn điều phối',
  },
  {
    to: '/manager/reports',
    icon: BarChart3,
    color: 'indigo',
    iconBg: 'from-indigo-500 to-indigo-600',
    hoverBorder: 'hover:border-indigo-400',
    hoverShadow: 'hover:shadow-indigo-100',
    textColor: 'text-indigo-600',
    label: 'Báo cáo Cơ sở & Hiệu suất',
    subtitle: 'SCR-FM-04',
    desc: 'Giám sát tỷ lệ lấp đầy Usage Rate, phân tích doanh thu tháng và rủi ro nợ quá hạn theo 3 độ tuổi.',
    cta: 'Mở Dashboard Báo cáo',
  },
];

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'];

export const ManagerDashboardPage: React.FC = () => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

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
            {greeting}! 👋
          </h1>
          <p className="text-blue-200 text-sm mt-1.5 max-w-lg">
            Tổng quan điều phối cơ sở kho. Chọn phân hệ bên dưới để bắt đầu quản lý vận hành hôm nay.
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs text-blue-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống đang hoạt động bình thường · {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
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
