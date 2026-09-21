import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileText, Users, ArrowRight } from 'lucide-react';

export const ManagerDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Facility Manager Portal — Điều phối cơ sở
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Giám sát vận hành mặt bằng kho, hợp đồng thuê, điều phối nhân sự và giải quyết sự cố
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Hợp đồng & Khách thuê (T3.12) */}
        <Link
          to="/manager/contracts"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
              Hợp đồng & Khách thuê (SCR-FM-02)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Theo dõi hợp đồng đang thuê, danh sách chờ bàn giao, đổi ô kho ngoại lệ và quyết toán hoàn cọc.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Mở Contracts Hub</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Quản lý danh mục ô kho */}
        <Link
          to="/manager/units"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors">
              Danh mục Ô kho & Layout (SCR-FM-01)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quản lý danh sách ô kho vật lý, phân loại Type S/M/L/XL và kiểm soát trạng thái sẵn sàng.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>Mở Quản lý ô kho</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Phân công nhân viên */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between opacity-80">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Phân công nhân viên (SCR-FM-03)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Điều phối lịch trực ca hàng ngày và giao nhiệm vụ kiểm tra ô kho cho nhân viên cơ sở.
            </p>
          </div>
          <span className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-400 font-medium">
            (Module Giai đoạn 4 - Flow 5)
          </span>
        </div>
      </div>
    </div>
  );
};
