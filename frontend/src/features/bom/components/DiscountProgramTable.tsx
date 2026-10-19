// frontend/src/features/bom/components/DiscountProgramTable.tsx
import React from 'react';
import { Percent, Building2, Calendar, Pencil, Power, AlertCircle } from 'lucide-react';
import type { DiscountProgramItem } from '@/api/discount';

interface DiscountProgramTableProps {
  programs: DiscountProgramItem[];
  onOpenModal: () => void;
  onEdit: (item: DiscountProgramItem) => void;
  onToggleStatus: (item: DiscountProgramItem) => void;
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatDiscountValue(type: 'PERCENT' | 'AMOUNT', value: number): string {
  if (type === 'PERCENT') {
    return `Giảm ${value}%`;
  }
  return `Giảm ${value.toLocaleString('vi-VN')} ₫`;
}

export const DiscountProgramTable: React.FC<DiscountProgramTableProps> = ({
  programs,
  onOpenModal,
  onEdit,
  onToggleStatus,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Chương trình khuyến mãi & Chiết khấu</h3>
            <p className="text-xs text-slate-500">
              Cấu hình các mức giảm giá theo kỳ hạn thuê (6 tháng giảm 5%, 12 tháng giảm 10%) và phạm vi áp dụng
            </p>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <span>+ Thêm chương trình</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên chương trình</th>
                <th className="py-3.5 px-4">Mức giảm</th>
                <th className="py-3.5 px-4 text-center">Thuê tối thiểu</th>
                <th className="py-3.5 px-4">Thời gian áp dụng</th>
                <th className="py-3.5 px-4">Phạm vi</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Đang tải danh sách chương trình khuyến mãi...
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p>Chưa có chương trình khuyến mãi nào được thiết lập.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                programs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {formatDiscountValue(item.discountType, item.discountValue)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                      ≥ {item.minRentalMonths} tháng
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {formatDate(item.startDate)} – {formatDate(item.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {item.scopeType === 'SYSTEM' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                          Toàn hệ thống
                        </span>
                      )}
                      {item.scopeType === 'FACILITY' && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                          <Building2 className="w-3 h-3" />
                          <span>{item.facilityName || `Cơ sở #${item.facilityId}`}</span>
                        </span>
                      )}
                      {item.scopeType === 'UNIT_TYPE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                          Loại kho: {item.unitTypeName || `#${item.unitTypeId}`}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={item.isActive ? 'Tạm dừng áp dụng' : 'Kích hoạt lại'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
