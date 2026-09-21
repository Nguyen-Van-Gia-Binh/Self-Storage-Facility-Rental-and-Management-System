// frontend/src/features/bom/components/BomFacilityTable.tsx
import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Edit2,
  Power,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { FacilityListItem } from '@/types';

interface BomFacilityTableProps {
  facilities: FacilityListItem[];
  onEdit: (facility: FacilityListItem) => void;
  onToggleStatus: (facility: FacilityListItem, targetStatus: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const BomFacilityTable: React.FC<BomFacilityTableProps> = ({
  facilities,
  onEdit,
  onToggleStatus,
  isLoading = false,
}) => {
  const [confirmTarget, setConfirmTarget] = useState<{
    facility: FacilityListItem;
    newStatus: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmToggle = async () => {
    if (!confirmTarget) return;
    setIsProcessing(true);
    try {
      await onToggleStatus(confirmTarget.facility, confirmTarget.newStatus);
      setConfirmTarget(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã / ID</th>
              <th className="py-3.5 px-4">Tên cơ sở</th>
              <th className="py-3.5 px-4">Địa chỉ</th>
              <th className="py-3.5 px-4">Liên hệ & Giờ mở</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {facilities.map((fac) => (
              <tr
                key={fac.id}
                className="hover:bg-amber-50/30 transition-colors group"
              >
                {/* ID */}
                <td className="py-4 px-4 font-mono font-medium text-slate-500 text-xs">
                  #{fac.id}
                </td>

                {/* Tên cơ sở */}
                <td className="py-4 px-4 font-medium text-slate-900">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {fac.name}
                      </p>
                      {fac.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {fac.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Địa chỉ */}
                <td className="py-4 px-4 max-w-xs">
                  <div className="flex items-start space-x-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{fac.address}</span>
                  </div>
                </td>

                {/* Liên hệ & Giờ mở */}
                <td className="py-4 px-4 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.phone || '028-1234-5678'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fac.openingHours || '06:00–22:00'}</span>
                  </div>
                </td>

                {/* Trạng thái */}
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      fac.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        fac.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {fac.isActive ? 'Đang khai thác' : 'Ngừng khai thác'}
                  </span>
                </td>

                {/* Thao tác */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEdit(fac)}
                      disabled={isLoading}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setConfirmTarget({
                          facility: fac,
                          newStatus: !fac.isActive,
                        })
                      }
                      disabled={isLoading}
                      className={`p-1.5 rounded-lg transition-colors ${
                        fac.isActive
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={fac.isActive ? 'Ngừng khai thác' : 'Mở lại cơ sở'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Toggle Status */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  confirmTarget.newStatus
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {confirmTarget.newStatus ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-base">
                  {confirmTarget.newStatus
                    ? 'Mở lại hoạt động cơ sở?'
                    : 'Ngừng khai thác cơ sở?'}
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  {confirmTarget.newStatus
                    ? `Cơ sở "${confirmTarget.facility.name}" sẽ hiển thị trở lại trên danh mục công khai và cho phép đặt chỗ.`
                    : `Cơ sở "${confirmTarget.facility.name}" sẽ ẩn khỏi trang đặt chỗ. Lưu ý: Chỉ được ngừng khai thác khi không còn hợp đồng thuê active hoặc overdue.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isProcessing}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center space-x-1.5 ${
                  confirmTarget.newStatus
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {confirmTarget.newStatus ? 'Kích hoạt lại' : 'Xác nhận ngừng'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
