import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { OverdueContractItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

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
        stage: 'D+1..D+3: Ân hạn',
        desc: 'Phí phạt = 0. Vẫn truy cập ô kho. Nhắc dọn đồ mỗi ngày.',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (days <= 6) {
      return {
        stage: `D+${days}: Phạt 10%/ngày`,
        desc: 'Khóa báo trả kho. Chưa khóa Access Code. Phải đóng nợ phạt trước khi trả kho.',
        badge: 'bg-orange-50 text-orange-800 border-orange-200 font-semibold',
      };
    }
    if (days <= 9) {
      return {
        stage: `D+${days}: Khóa Access Code`,
        desc: 'Phí 10%/ngày trên tiền cọc, trần 70%. Access Code bị khóa.',
        badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      };
    }
    return {
      stage: 'D+10: Chấm dứt hợp đồng',
      desc: 'Hợp đồng chấm dứt. Ô kho chuyển sang dọn dẹp và niêm phong đồ.',
      badge: 'bg-red-100 text-red-800 border-red-300 font-bold',
    };
  };

  const totalFee = items.reduce((acc, c) => acc + c.accruedOverdueFee, 0);

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
          <div className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
            Tổng phạt tích lũy: {formatCurrency(totalFee)}
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
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Hợp Đồng</th>
                <th className="py-3 px-3">Khách Hàng</th>
                <th className="py-3 px-3">Cơ Sở & Ô Kho</th>
                <th className="py-3 px-3 text-center">Hết Hạn Thuê</th>
                <th className="py-3 px-3 text-center">Số Ngày Trễ</th>
                <th className="py-3 px-3 text-right">Phạt Tích Lũy</th>
                <th className="py-3 px-4">Biện Pháp Chế Tài</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const policy = getPolicyAction(item.overdueDays);
                return (
                  <tr key={item.contractId} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.contractCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{item.facilityName}</div>
                      <div className="text-[11px] font-mono text-brand-600 font-semibold">
                        Ô: {item.unitCode}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {formatDate(item.endDateExclusive)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-rose-100 text-rose-800">
                        D+{item.overdueDays}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                      {formatCurrency(item.accruedOverdueFee)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] border ${policy.badge}`}>
                          {policy.stage}
                        </span>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
                          {policy.desc}
                        </p>
                      </div>
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
