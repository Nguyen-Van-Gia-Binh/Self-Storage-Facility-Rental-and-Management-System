import React from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Globe,
  Monitor,
} from 'lucide-react';
import type { LoginHistoryItem, LoginHistoryFilterParams } from '../types/audit';

interface LoginHistoryTableProps {
  histories: LoginHistoryItem[];
  loading: boolean;
  filter: LoginHistoryFilterParams;
  onFilterChange: (newFilter: LoginHistoryFilterParams) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
}

export const LoginHistoryTable: React.FC<LoginHistoryTableProps> = ({
  histories,
  loading,
  filter,
  onFilterChange,
  page,
  totalPages,
  totalElements,
  onPageChange,
}) => {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const simplifyUserAgent = (ua?: string | null) => {
    if (!ua) return 'Không xác định';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Safari';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('Windows')) {
      if (ua.includes('Edg/')) return 'Windows Edge';
      if (ua.includes('Chrome/')) return 'Windows Chrome';
      if (ua.includes('Firefox/')) return 'Windows Firefox';
      return 'Windows PC';
    }
    if (ua.includes('Macintosh')) return 'macOS Chrome/Safari';
    if (ua.includes('Python') || ua.includes('curl') || ua.includes('Postman')) return 'API Script/Bot';
    return ua.slice(0, 30);
  };

  const handleResetFilters = () => {
    onFilterChange({
      email: '',
      isSuccess: undefined,
      from: '',
      to: '',
      page: 0,
      size: filter.size || 10,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter Toolbar */}
      <div className="p-5 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900">Lịch sử đăng nhập hệ thống (US-SA-04.1)</h3>
            <p className="text-xs text-gray-500">Giám sát các phiên xác thực thành công và cảnh báo nỗ lực xâm nhập bất thường</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Tìm kiếm Email */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo email..."
              value={filter.email || ''}
              onChange={(e) => onFilterChange({ ...filter, email: e.target.value, page: 0 })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Trạng thái kết quả */}
          <div>
            <select
              value={filter.isSuccess === undefined ? 'ALL' : filter.isSuccess ? 'SUCCESS' : 'FAILED'}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange({
                  ...filter,
                  isSuccess: val === 'ALL' ? undefined : val === 'SUCCESS',
                  page: 0,
                });
              }}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công (SUCCESS)</option>
              <option value="FAILED">Thất bại (FAILED)</option>
            </select>
          </div>

          {/* Từ ngày - Đến ngày */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filter.from || ''}
              onChange={(e) => onFilterChange({ ...filter, from: e.target.value, page: 0 })}
              className="w-1/2 px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              title="Từ ngày"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="date"
              value={filter.to || ''}
              onChange={(e) => onFilterChange({ ...filter, to: e.target.value, page: 0 })}
              className="w-1/2 px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              title="Đến ngày"
            />
          </div>

          {/* Nút Reset */}
          <div>
            <button
              onClick={handleResetFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-12">#</th>
              <th className="py-3 px-4 w-44">Thời điểm (ICT)</th>
              <th className="py-3 px-4 w-60">Tài khoản Email</th>
              <th className="py-3 px-4 w-32 text-center">Kết quả</th>
              <th className="py-3 px-4">Lý do thất bại / Ghi chú</th>
              <th className="py-3 px-4 w-36">Địa chỉ IP</th>
              <th className="py-3 px-4 w-44">Thiết bị / Trình duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span>Đang tải lịch sử đăng nhập...</span>
                  </div>
                </td>
              </tr>
            ) : histories.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <ShieldAlert className="w-8 h-8 text-gray-300" />
                    <p className="font-medium text-gray-600">Không tìm thấy phiên đăng nhập nào</p>
                    <p className="text-xs text-gray-400">Thử thay đổi email hoặc điều chỉnh bộ lọc kết quả</p>
                  </div>
                </td>
              </tr>
            ) : (
              histories.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {page * (filter.size || 10) + index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                    {formatDate(item.loggedInAt)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900 font-mono text-xs">{item.email}</div>
                    {item.userId && (
                      <div className="text-[11px] text-gray-400">User ID: #{item.userId}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.isSuccess ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Thành công</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Thất bại</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {item.failureReason ? (
                      <span className="text-rose-700 font-medium bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100">
                        {item.failureReason}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Đăng nhập hợp lệ qua JWT</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span>{item.ipAddress || '127.0.0.1'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600 max-w-xs truncate" title={item.userAgent || ''}>
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{simplifyUserAgent(item.userAgent)}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <div>
          Hiển thị <span className="font-semibold text-gray-700">{histories.length}</span> / <span className="font-semibold text-gray-700">{totalElements}</span> phiên đăng nhập
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2">
            Trang <span className="font-semibold text-gray-800">{page + 1}</span> / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
