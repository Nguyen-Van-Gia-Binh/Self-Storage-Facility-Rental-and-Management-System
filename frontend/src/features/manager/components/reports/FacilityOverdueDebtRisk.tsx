// frontend/src/features/manager/components/reports/FacilityOverdueDebtRisk.tsx

import React from 'react';
import { AlertOctagon, Lock, PhoneCall, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { OverdueDebtReport } from '../../types/report';

interface Props {
  data: OverdueDebtReport;
  loading?: boolean;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FacilityOverdueDebtRisk: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return <div className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  const { totalOverdueContracts, totalOverdueDebt, bracketD1ToD10, bracketD11ToD30, bracketOverD30 } = data;
  const allContracts = data.contracts || [];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              Báo cáo rủi ro nợ quá hạn theo độ tuổi (US-FM-06.1 AC-4 & UC-F6-10)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại rủi ro quá hạn theo 3 giai đoạn xử lý thu hồi công nợ và biện pháp phong tỏa kho
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">Tổng nợ tồn đọng cơ sở:</span>
          <div className="text-xl font-black text-rose-600">{formatVND(totalOverdueDebt)}</div>
        </div>
      </div>

      {/* 3 Thẻ phân nhóm độ tuổi nợ (AC-4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nhóm 1: D+1 đến D+10 */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Giai đoạn D+1 đến D+10
              </span>
              <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">
                {bracketD1ToD10?.contractCount || 0}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1">
              Nhắc nợ qua SMS/Email · Phạt trễ hạn 10%/ngày (trần 70%)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-baseline justify-between">
            <span className="text-xs text-amber-900 font-medium">Tổng nợ đọng:</span>
            <span className="text-base font-bold text-amber-900">
              {formatVND(bracketD1ToD10?.totalDebt || 0)}
            </span>
          </div>
        </div>

        {/* Nhóm 2: D+11 đến D+30 */}
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Giai đoạn D+11 đến D+30
              </span>
              <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-xs font-bold">
                {bracketD11ToD30?.contractCount || 0}
              </span>
            </div>
            <p className="text-[11px] text-orange-700 mt-1">
              Đã khóa mã PIN/Thẻ từ · Gửi thông báo cảnh báo cưỡng chế lần 2
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-orange-200/60 flex items-baseline justify-between">
            <span className="text-xs text-orange-900 font-medium">Tổng nợ đọng:</span>
            <span className="text-base font-bold text-orange-900">
              {formatVND(bracketD11ToD30?.totalDebt || 0)}
            </span>
          </div>
        </div>

        {/* Nhóm 3: Trên D+30 */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Quá hạn trên D+30
              </span>
              <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold">
                {bracketOverD30?.contractCount || 0}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Hết thời hạn ân hạn · Lập biên bản niêm phong, thanh lý tài sản
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-baseline justify-between">
            <span className="text-xs text-rose-900 font-medium">Tổng nợ đọng:</span>
            <span className="text-base font-bold text-rose-900">
              {formatVND(bracketOverD30?.totalDebt || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết danh sách hợp đồng quá hạn */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Danh sách hợp đồng quá hạn cần xử lý ({totalOverdueContracts} hợp đồng)
          </h3>
          <span className="text-[11px] text-slate-500">
            Sắp xếp theo số ngày quá hạn giảm dần
          </span>
        </div>

        {allContracts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Không có hợp đồng nào bị quá hạn!</p>
            <p className="text-xs text-slate-400 mt-0.5">Tất cả khách thuê tại cơ sở đang thanh toán đúng hạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Mã Hợp đồng</th>
                  <th className="px-4 py-3">Ô kho</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-center">Số ngày trễ</th>
                  <th className="px-4 py-3 text-right">Tiền thuê nợ</th>
                  <th className="px-4 py-3 text-right">Phí phạt trễ</th>
                  <th className="px-4 py-3 text-right">Tổng nợ</th>
                  <th className="px-4 py-3 text-center">Biện pháp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allContracts.map((c) => {
                  const isSevere = c.overdueDays > 30;
                  const isMedium = c.overdueDays > 10 && c.overdueDays <= 30;
                  return (
                    <tr key={c.contractId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.contractCode}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                          {c.unitCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.customerName}</div>
                        {c.customerPhone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <PhoneCall className="w-3 h-3" /> {c.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isSevere
                              ? 'bg-rose-100 text-rose-800'
                              : isMedium
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          D+{c.overdueDays} ngày
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {formatVND(c.monthlyRentalPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">
                        +{formatVND(c.accruedOverdueFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700 text-sm">
                        {formatVND(c.totalDebt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isSevere ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <AlertOctagon className="w-3 h-3" /> Thanh lý
                          </span>
                        ) : isMedium ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" /> Đã khóa PIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Nhắc nợ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
