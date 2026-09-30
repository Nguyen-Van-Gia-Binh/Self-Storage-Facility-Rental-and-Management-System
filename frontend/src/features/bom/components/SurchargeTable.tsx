// frontend/src/features/bom/components/SurchargeTable.tsx
import React, { useEffect, useState } from 'react';
import { Tag, Building2, Calendar, AlertCircle } from 'lucide-react';
import type { SurchargeItem } from '@/types';
import { FEE_CATEGORIES, feeCategoryLabel, type FeeCategory } from '@/features/pricing/feeCategory';

interface SurchargeTableProps {
  surcharges: SurchargeItem[];
  onOpenModal: () => void;
  onChangeCategory?: (item: SurchargeItem, category: FeeCategory) => void;
  onChangeAmount?: (item: SurchargeItem, amount: number) => void;
  isLoading?: boolean;
}

function FeeAmountEditor({
  item,
  onChangeAmount,
}: {
  item: SurchargeItem;
  onChangeAmount: (item: SurchargeItem, amount: number) => void;
}) {
  const [draft, setDraft] = useState(String(item.amount));

  useEffect(() => {
    setDraft(String(item.amount));
  }, [item.id, item.amount]);

  const commit = () => {
    const num = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(num) || num === item.amount) {
      setDraft(String(item.amount));
      return;
    }
    if (item.type === 'PERCENTAGE' && (num < 1 || num > 100)) {
      setDraft(String(item.amount));
      return;
    }
    if (item.type !== 'PERCENTAGE' && num <= 0) {
      setDraft(String(item.amount));
      return;
    }
    onChangeAmount(item, num);
  };

  return (
    <label className="inline-flex items-center justify-end gap-1">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        aria-label={`Mức phí của ${item.name}`}
        className="w-28 text-right text-sm font-bold text-amber-700 border border-slate-200 rounded-lg px-2 py-1"
      />
      <span className="text-[11px] text-slate-500">{item.type === 'PERCENTAGE' ? '%' : 'VND'}</span>
    </label>
  );
}

export const SurchargeTable: React.FC<SurchargeTableProps> = ({
  surcharges,
  onOpenModal,
  onChangeCategory,
  onChangeAmount,
  isLoading = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header bar */}
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

      {/* Table */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <p>Đang tải danh sách phụ phí...</p>
                  </td>
                </tr>
              ) : surcharges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Chưa có phụ phí nào được cấu hình</p>
                  </td>
                </tr>
              ) : (
                surcharges.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">#{item.id}</td>

                    <td className="py-3.5 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {onChangeCategory ? (
                        <select
                          value={item.category || ''}
                          onChange={(e) => onChangeCategory(item, e.target.value as FeeCategory)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          aria-label={`Nhóm của ${item.name}`}
                        >
                          {!item.category && <option value="">Chưa phân nhóm</option>}
                          {FEE_CATEGORIES.map((group) => (
                            <option key={group.value} value={group.value}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        feeCategoryLabel(item.category)
                      )}
                    </td>

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
                      {onChangeAmount ? (
                        <FeeAmountEditor item={item} onChangeAmount={onChangeAmount} />
                      ) : item.type === 'FIXED' ? (
                        `${item.amount.toLocaleString('vi-VN')} VND`
                      ) : (
                        `${item.amount}%`
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.effectiveDate}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang áp dụng
                      </span>
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
