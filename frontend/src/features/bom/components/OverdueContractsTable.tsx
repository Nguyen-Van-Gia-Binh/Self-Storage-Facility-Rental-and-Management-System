import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { OverdueContractItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { Tooltip } from '@/components/ui/Tooltip';

export interface OverdueContractsTableProps {
  items: OverdueContractItem[];
  isLoading?: boolean;
}

export const OverdueContractsTable: React.FC<OverdueContractsTableProps> = ({
  items,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  const getPolicyAction = (days: number) => {
    if (days <= 3) {
      return {
        label: 'Khóa PIN',
        desc: 'Khóa Access Code ngay từ D+1 (No Pay, No PIN). Thu phí lưu kho 5% cọc/ngày.',
        tone: 'text-slate-700',
        dot: 'bg-slate-400',
      };
    }
    if (days <= 6) {
      return {
        label: 'Phạt quá hạn',
        desc: 'Khóa Access Code & khóa báo trả kho. Phải tất toán phí quá hạn để nhận PIN tạm dọn đồ.',
        tone: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    }
    return {
      label: 'Cưỡng chế niêm phong',
      desc: 'Khấu trừ 100% cọc (55% phí lưu kho/phạt + 45% phí niêm phong), D+8 mở bán lại ô kho.',
      tone: 'text-rose-600',
      dot: 'bg-rose-500',
    };
  };

  const totalFee = items.reduce((acc, c) => acc + c.accruedOverdueFee, 0);
  const rows = [...items].sort((a, b) => b.accruedOverdueFee - a.accruedOverdueFee);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Danh Sách Hợp Đồng Quá Hạn & Rủi Ro Nợ Đọng Toàn Hệ Thống
            </h3>
            <p className="text-xs text-slate-500">
              Giám sát thi hành chính sách và chế tài quá hạn hợp đồng
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="text-xs text-slate-500">
            Tổng phạt tích lũy:{' '}
            <span className="font-bold text-rose-600 tabular-nums">{formatCurrency(totalFee)}</span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Hệ thống vận hành lành mạnh
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Không có hợp đồng nào bị quá hạn trong kỳ báo cáo đã chọn. Tất cả khách hàng đều thực hiện trả kho đúng hạn hoặc đã gia hạn hợp đồng thành công.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wide whitespace-nowrap">
              <tr>
                <th className="py-3 px-4">Mã Hợp Đồng</th>
                <th className="py-3 px-3">Khách Hàng</th>
                <th className="py-3 px-3">Cơ Sở & Ô Kho</th>
                <th className="py-3 px-3 text-right">Hết Hạn Thuê</th>
                <th className="py-3 px-3 text-right">Số Ngày Trễ</th>
                <th className="py-3 px-3 text-right">Phạt Tích Lũy</th>
                <th className="py-3 px-4">Biện Pháp Chế Tài</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((item) => {
                const policy = getPolicyAction(item.overdueDays);
                return (
                  <tr key={item.contractId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.contractCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-900">{item.unitCode}</div>
                      <div className="text-[11px] text-slate-500">{item.facilityName}</div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDate(item.endDateExclusive)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center justify-end gap-1.5 font-bold tabular-nums ${policy.tone}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${policy.dot}`} />
                        D+{item.overdueDays}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {item.accruedOverdueFee > 0 ? (
                        <span className="font-bold text-rose-600">{formatCurrency(item.accruedOverdueFee)}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Tooltip content={policy.desc} position="left">
                        <button type="button" className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${policy.tone}`}>
                          {policy.label}
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
