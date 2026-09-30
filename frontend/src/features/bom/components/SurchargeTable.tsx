// frontend/src/features/bom/components/SurchargeTable.tsx
import React from 'react';
import { Tag, Building2, Calendar, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import type { SurchargeItem } from '@/types';
import { feeCategoryLabel } from '@/features/pricing/feeCategory';

interface SurchargeTableProps {
  surcharges: SurchargeItem[];
  onOpenModal: () => void;
  onEdit: (item: SurchargeItem) => void;
  onDeactivate: (item: SurchargeItem) => void;
  isLoading?: boolean;
}

function feeAmountLabel(item: SurchargeItem): string {
  if (item.type === 'PERCENTAGE') {
    return `${item.amount}%`;
  }
  return `${item.amount.toLocaleString('vi-VN')} VND`;
}

export const SurchargeTable: React.FC<SurchargeTableProps> = ({
  surcharges,
  onOpenModal,
  onEdit,
  onDeactivate,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Danh mục phụ phí toàn hệ thống</h3>
            <p className="text-xs text-slate-500">
              Bốn nhóm: cấp lại khóa cơ, vệ sinh khi trả kho, bồi thường hư hại, tiện ích bổ sung (BM-03)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <span>+ Thêm phụ phí</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã</th>
                <th className="py-3.5 px-4">Tên phụ phí</th>
                <th className="py-3.5 px-4">Nhóm</th>
                <th className="py-3.5 px-4">Phạm vi áp dụng</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4 text-right">Mức phí</th>
                <th className="py-3.5 px-4">Ngày hiệu lực</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    <p>Đang tải danh sách phụ phí...</p>
                  </td>
                </tr>
              ) : surcharges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Chưa có phụ phí nào được cấu hình</p>
                  </td>
                </tr>
              ) : (
                surcharges.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{item.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{feeCategoryLabel(item.category)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.facilityName || 'Toàn hệ thống'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.type === 'FIXED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {item.type === 'FIXED' ? 'Cố định' : 'Tỷ lệ %'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600 text-sm">
                      {feeAmountLabel(item)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.effectiveDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Ngừng áp dụng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.isActive ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeactivate(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
