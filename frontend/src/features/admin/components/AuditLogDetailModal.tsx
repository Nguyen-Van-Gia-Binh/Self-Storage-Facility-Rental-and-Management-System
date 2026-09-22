import React from 'react';
import { X, Calendar, User, Shield, Tag, ArrowRight, Copy, Check } from 'lucide-react';
import type { AuditLogItem } from '../types/audit';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logItem: AuditLogItem | null;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  logItem,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !logItem) return null;

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

  const renderJsonPretty = (val?: string | null) => {
    if (!val) return <span className="text-gray-400 italic">Không có dữ liệu (Khởi tạo mới / Rỗng)</span>;
    try {
      const obj = JSON.parse(val);
      return (
        <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto max-h-60 leading-relaxed">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return (
        <div className="text-xs font-mono bg-gray-50 text-gray-800 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
          {val}
        </div>
      );
    }
  };

  const handleCopy = () => {
    const text = JSON.stringify(logItem, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              #{logItem.id}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Chi tiết nhật ký thao tác nghiệp vụ</h3>
              <p className="text-xs text-gray-500">Mã kiểm toán SA-04 · Toàn vẹn dữ liệu</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              title="Sao chép thông tin log"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Thời điểm thao tác</p>
                <p className="font-medium text-gray-900">{formatDate(logItem.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Người thực hiện</p>
                <p className="font-medium text-gray-900">
                  {logItem.userFullName || 'Hệ thống'}
                  {logItem.userEmail && <span className="text-xs text-gray-500 font-normal block">{logItem.userEmail}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Loại hành động</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">
                  {logItem.action}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Đối tượng tác động</p>
                <p className="font-medium text-gray-900">
                  <span className="font-mono text-blue-600 font-semibold">{logItem.entityType}</span>
                  {logItem.entityId && <span className="text-xs text-gray-500 ml-1">#{logItem.entityId}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Before & After Comparison */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span>Đối chiếu dữ liệu trước & sau</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="border border-rose-100 rounded-xl p-3 bg-rose-50/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Trước khi đổi (Before)</span>
                </div>
                {renderJsonPretty(logItem.beforeValue)}
              </div>

              {/* After */}
              <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Sau khi đổi (After)</span>
                </div>
                {renderJsonPretty(logItem.afterValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
