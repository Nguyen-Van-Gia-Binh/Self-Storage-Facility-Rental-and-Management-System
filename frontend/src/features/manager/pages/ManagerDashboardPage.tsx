import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, FileText, Users, ArrowRight, Wrench, BarChart3 } from 'lucide-react';

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

        {/* Card 3: Phân công nhân viên (T4.14 / SCR-FM-03) */}
        <Link
          to="/manager/staff-assignment"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
              Phân công Nhân sự (SCR-FM-03)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cân bằng tải nhân viên ca trực, điều phối bàn giao Check-in, Trả kho, Khóa ngoài Overlock.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold">
            <span>Mở Bàn phân công</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Xử lý sự cố kỹ thuật (T4.14 / SCR-FM-05) */}
        <Link
          to="/manager/incidents"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-amber-600 transition-colors">
              Xử lý Sự cố & Ticket (SCR-FM-05)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiếp nhận khiếu nại, giám sát thời hạn cam kết SLA 2 giờ và giao việc xử lý kẹt khóa, thấm dột.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>Mở Bàn điều phối</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 5: Báo cáo cơ sở & Hiệu suất (T5.5 / SCR-FM-04) */}
        <Link
          to="/manager/reports"
          className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
              Báo cáo Cơ sở & Hiệu suất (SCR-FM-04)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Giám sát tỷ lệ lấp đầy Usage Rate, phân tích doanh thu tháng và rủi ro nợ quá hạn theo 3 độ tuổi.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
            <span>Mở Dashboard Báo cáo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
