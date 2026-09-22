import React, { useState } from 'react';
import {
  Search,
  Download,
  Eye,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { AuditLogItem, AuditLogFilterParams } from '../types/audit';
import { AuditLogDetailModal } from './AuditLogDetailModal';

interface ActivityLogsTableProps {
  logs: AuditLogItem[];
  loading: boolean;
  filter: AuditLogFilterParams;
  onFilterChange: (newFilter: AuditLogFilterParams) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onExportCsv: () => void;
  exporting?: boolean;
}

const ACTION_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  UPDATE_ROLE: { label: 'Đổi vai trò', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  UPDATE_STATUS: { label: 'Đổi trạng thái', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ASSIGN_FACILITIES: { label: 'Gán cơ sở', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  UPDATE_POLICY: { label: 'Sửa chính sách', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  UPDATE_PRICE: { label: 'Chỉnh biểu giá', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  CREATE_USER: { label: 'Tạo tài khoản', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  UPDATE_UNIT_STATUS: { label: 'Bảo trì ô kho', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({
  logs,
  loading,
  filter,
  onFilterChange,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onExportCsv,
  exporting,
}) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

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

  const getActionBadge = (action: string) => {
    const config = ACTION_BADGES[action] || {
      label: action,
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const summarizeChange = (log: AuditLogItem) => {
    if (log.afterValue) {
      try {
        const obj = JSON.parse(log.afterValue);
        if (obj.role) return `Vai trò mới: ${obj.role}`;
        if (obj.status) return `Trạng thái mới: ${obj.status}`;
        if (obj.monthlyPrice) return `Giá mới: ${Number(obj.monthlyPrice).toLocaleString('vi-VN')} ₫`;
        if (obj.note) return obj.note;
        if (obj.reason) return obj.reason;
      } catch {
        return log.afterValue.slice(0, 50);
      }
    }
    return 'Cập nhật đối tượng hệ thống';
  };

  const handleResetFilters = () => {
    onFilterChange({
      action: 'ALL',
      entityType: 'ALL',
      from: '',
      to: '',
      search: '',
      page: 0,
      size: filter.size || 10,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filter Toolbar */}
      <div className="p-5 border-b border-gray-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Nhật ký thao tác người dùng (US-SA-04.2)</h3>
            <p className="text-xs text-gray-500">Giám sát các thay đổi quyền hạn, trạng thái tài khoản, chính sách và cơ cấu cơ sở</p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              onClick={onExportCsv}
              disabled={exporting || logs.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Xuất CSV (UTF-8)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Tìm kiếm */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm người dùng, email..."
              value={filter.search || ''}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value, page: 0 })}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Loại hành động */}
          <div>
            <select
              value={filter.action || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, action: e.target.value, page: 0 })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="UPDATE_ROLE">Đổi vai trò (UPDATE_ROLE)</option>
              <option value="UPDATE_STATUS">Đổi trạng thái (UPDATE_STATUS)</option>
              <option value="ASSIGN_FACILITIES">Gán cơ sở (ASSIGN_FACILITIES)</option>
              <option value="UPDATE_POLICY">Sửa chính sách (UPDATE_POLICY)</option>
              <option value="UPDATE_PRICE">Chỉnh biểu giá (UPDATE_PRICE)</option>
              <option value="CREATE_USER">Tạo người dùng (CREATE_USER)</option>
              <option value="UPDATE_UNIT_STATUS">Bảo trì ô kho (UPDATE_UNIT_STATUS)</option>
            </select>
          </div>

          {/* Loại đối tượng */}
          <div>
            <select
              value={filter.entityType || 'ALL'}
              onChange={(e) => onFilterChange({ ...filter, entityType: e.target.value, page: 0 })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-white"
            >
              <option value="ALL">Tất cả đối tượng</option>
              <option value="USER">Người dùng (USER)</option>
              <option value="POLICY">Chính sách (POLICY)</option>
              <option value="FACILITY_UNIT_TYPE_PRICE">Biểu giá kho (PRICE)</option>
              <option value="STORAGE_UNIT">Ô kho vật lý (UNIT)</option>
              <option value="FACILITY">Cơ sở (FACILITY)</option>
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
              <th className="py-3 px-4 w-52">Người thực hiện</th>
              <th className="py-3 px-4 w-36">Hành động</th>
              <th className="py-3 px-4 w-40">Đối tượng tác động</th>
              <th className="py-3 px-4">Tóm lược thay đổi</th>
              <th className="py-3 px-4 w-28 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span>Đang tải nhật ký thao tác...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                    <ShieldAlert className="w-8 h-8 text-gray-300" />
                    <p className="font-medium text-gray-600">Không tìm thấy nhật ký thao tác nào</p>
                    <p className="text-xs text-gray-400">Thử thay đổi từ khóa hoặc điều chỉnh khoảng ngày lọc</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {page * (filter.size || 10) + index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">{log.userFullName || 'Hệ thống'}</div>
                    <div className="text-gray-400 text-[11px] font-mono">{log.userEmail || 'system@internal'}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-blue-600 font-semibold bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100">
                      {log.entityType}
                    </span>
                    {log.entityId && <span className="text-gray-500 ml-1 font-mono">#{log.entityId}</span>}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate" title={log.afterValue || ''}>
                    {summarizeChange(log)}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
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
          Hiển thị <span className="font-semibold text-gray-700">{logs.length}</span> / <span className="font-semibold text-gray-700">{totalElements}</span> bản ghi
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

      {/* Detail Modal */}
      <AuditLogDetailModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        logItem={selectedLog}
      />
    </div>
  );
};
