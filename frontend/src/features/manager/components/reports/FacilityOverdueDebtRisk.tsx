// frontend/src/features/manager/components/reports/FacilityOverdueDebtRisk.tsx

import React from 'react';
import { AlertOctagon, Lock, PhoneCall, AlertTriangle, AlertCircle, ShieldAlert, CheckCircle2, FileX2 } from 'lucide-react';
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

  const { totalOverdueContracts, totalOverdueDebt } = data;
  const allContracts = data.contracts || [];

  // Phân bổ chính xác theo chuẩn Business Rules (BR-OVD-01, BR-OVD-02, BR-OVD-03)
  const contractsD1ToD3 = data.bracketD1ToD3?.contracts?.length
    ? data.bracketD1ToD3.contracts
    : allContracts.filter((c) => c.overdueDays >= 1 && c.overdueDays <= 3);

  const contractsD4ToD6 = data.bracketD4ToD6?.contracts?.length
    ? data.bracketD4ToD6.contracts
    : allContracts.filter((c) => c.overdueDays >= 4 && c.overdueDays <= 6);

  const contractsD7ToD10 = data.bracketD7ToD10?.contracts?.length
    ? data.bracketD7ToD10.contracts
    : allContracts.filter((c) => c.overdueDays >= 7 && c.overdueDays <= 10);

  const contractsD10Plus = data.bracketTerminatedD10Plus?.contracts?.length
    ? data.bracketTerminatedD10Plus.contracts
    : allContracts.filter((c) => c.overdueDays > 10 || c.status === 'TERMINATED_OVERDUE');

  const b1 = {
    count: contractsD1ToD3.length,
    debt: contractsD1ToD3.reduce((sum, c) => sum + (c.totalDebt || 0), 0),
  };
  const b2 = {
    count: contractsD4ToD6.length,
    debt: contractsD4ToD6.reduce((sum, c) => sum + (c.totalDebt || 0), 0),
  };
  const b3 = {
    count: contractsD7ToD10.length,
    debt: contractsD7ToD10.reduce((sum, c) => sum + (c.totalDebt || 0), 0),
  };
  const b4 = {
    count: contractsD10Plus.length,
    debt: contractsD10Plus.reduce((sum, c) => sum + (c.totalDebt || 0), 0),
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              Báo cáo rủi ro quá hạn
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại rủi ro quá hạn theo 3 giai đoạn xử lý thu hồi công nợ & quy chuẩn chấm dứt niêm phong tại mốc D+10
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">Tổng nợ tồn đọng cơ sở:</span>
          <div className="text-xl font-black text-rose-600">{formatVND(totalOverdueDebt)}</div>
        </div>
      </div>

      {/* 3 Thẻ phân nhóm độ tuổi nợ chuẩn BR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nhóm 1: D+1 đến D+3 (Ân hạn nhắc nợ) */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Giai đoạn D+1 đến D+3
              </span>
              <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">
                {b1.count}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              Ân hạn nhắc nợ · Miễn phạt trễ hạn · SMS/Email nhắc nhở, vẫn cho mở cửa
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-baseline justify-between">
            <span className="text-xs text-amber-900 font-medium">Nợ tiền thuê:</span>
            <span className="text-base font-bold text-amber-900">{formatVND(b1.debt)}</span>
          </div>
        </div>

        {/* Nhóm 2: D+4 đến D+6 (Tính phạt trễ hạn) */}
        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Giai đoạn D+4 đến D+6
              </span>
              <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center text-xs font-bold">
                {b2.count}
              </span>
            </div>
            <p className="text-[11px] text-orange-700 mt-1 font-medium">
              Tính phạt 10%/ngày (trần 30% cọc) · Cảnh báo sắp khóa mã PIN vào ngày D+7
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-orange-200/60 flex items-baseline justify-between">
            <span className="text-xs text-orange-900 font-medium">Tổng nợ + phạt:</span>
            <span className="text-base font-bold text-orange-900">{formatVND(b2.debt)}</span>
          </div>
        </div>

        {/* Nhóm 3: D+7 đến D+10 (Khóa an ninh & Cảnh báo cưỡng chế) */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Giai đoạn D+7 đến D+10
              </span>
              <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold">
                {b3.count}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1 font-medium">
              Đã khóa mã PIN/QR · Phạt tối đa 70% cọc · Cảnh báo niêm phong 23:59 D+10
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-baseline justify-between">
            <span className="text-xs text-rose-900 font-medium">Tổng nợ + phạt:</span>
            <span className="text-base font-bold text-rose-900">{formatVND(b3.debt)}</span>
          </div>
        </div>
      </div>

      {/* Mốc D+10+: Hồ sơ đã chấm dứt & Đang niêm phong thanh lý (BR-OVD-03) */}
      {b4.count > 0 && (
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
              <FileX2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Mốc D+10+: Đã chấm dứt hợp đồng & Niêm phong thanh lý (BR-OVD-03)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-xs font-bold font-mono">
                  {b4.count} hợp đồng
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                Tự động đơn phương chấm dứt hợp đồng, gắn khóa ngoài Overlock, lập biên bản niêm phong kho và chuyển thủ tục thanh lý/đấu giá tài sản tồn kho theo quy định.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-purple-200/80 pt-2 sm:pt-0 sm:pl-4">
            <span className="text-xs text-purple-800 font-medium">Tổng nợ tịch thu cọc:</span>
            <div className="text-base font-bold text-purple-950 font-mono">{formatVND(b4.debt)}</div>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-3 text-center">Biện pháp xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allContracts.map((c) => {
                  const isTerminated = c.overdueDays > 10 || c.status === 'TERMINATED_OVERDUE';
                  const isLocked = c.overdueDays >= 7 && c.overdueDays <= 10;
                  const isPenalized = c.overdueDays >= 4 && c.overdueDays <= 6;

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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isTerminated
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : isLocked
                              ? 'bg-rose-100 text-rose-800'
                              : isPenalized
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
                        {c.accruedOverdueFee > 0 ? `+${formatVND(c.accruedOverdueFee)}` : '0 đ'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-700 text-sm">
                        {formatVND(c.totalDebt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isTerminated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                            <AlertOctagon className="w-3 h-3 text-purple-700" /> Niêm phong thanh lý
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3 text-rose-600" /> Đã khóa PIN D+7
                          </span>
                        ) : isPenalized ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 text-orange-600" /> Phạt trễ 10%/ngày
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Ân hạn nhắc nợ
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
