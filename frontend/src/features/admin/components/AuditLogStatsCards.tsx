import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import type { AuditStats } from '../types/audit';

interface AuditLogStatsCardsProps {
  stats: AuditStats;
  loading?: boolean;
}

export const AuditLogStatsCards: React.FC<AuditLogStatsCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse flex items-center justify-between">
            <div className="space-y-3 w-3/4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-7 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Tổng thao tác */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng thao tác ghi nhận</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">{stats.totalActivities.toLocaleString('vi-VN')}</span>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Toàn hệ thống</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Phục vụ kiểm toán SA-04</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
          <Activity className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Thao tác quyền & tài khoản */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thay đổi quyền / Trạng thái</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-600">{stats.roleOrStatusChanges.toLocaleString('vi-VN')}</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Quyền hạn</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Vai trò & Khóa tài khoản</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Đăng nhập thất bại */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đăng nhập thất bại</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${stats.failedLoginsToday > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {stats.failedLoginsToday.toLocaleString('vi-VN')}
            </span>
            {stats.failedLoginsToday > 0 ? (
              <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Cảnh báo</span>
            ) : (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">An toàn</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Cần theo dõi bất thường</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.failedLoginsToday > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* 4. Tổng đăng nhập hôm nay */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lượt đăng nhập hôm nay</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{stats.totalLoginsToday.toLocaleString('vi-VN')}</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Phiên truy cập</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Ghi nhận từ JWT session</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <KeyRound className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
