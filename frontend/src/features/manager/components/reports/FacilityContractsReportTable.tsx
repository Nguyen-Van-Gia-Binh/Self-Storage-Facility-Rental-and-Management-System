// frontend/src/features/manager/components/reports/FacilityContractsReportTable.tsx

import React, { useState, useMemo } from 'react';
import { FileText, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { FacilityContractSummary } from '../../types/report';

interface Props {
  contracts: FacilityContractSummary[];
  loading?: boolean;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'EXPIRING_SOON';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FacilityContractsReportTable: React.FC<Props> = ({ contracts, loading }) => {
  const [currentTab, setCurrentTab] = useState<FilterTab>('ALL');
  const [keyword, setKeyword] = useState<string>('');

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Filter by tab
      if (currentTab === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (currentTab === 'OVERDUE' && c.status !== 'OVERDUE') return false;
      if (currentTab === 'EXPIRING_SOON' && !c.nearExpiration) return false;

      // Filter by keyword
      if (keyword.trim()) {
        const kw = keyword.toLowerCase().trim();
        const matchCode = c.code?.toLowerCase().includes(kw);
        const matchUnit = c.unitCode?.toLowerCase().includes(kw);
        const matchName = c.customerName?.toLowerCase().includes(kw);
        const matchPhone = c.customerPhone?.toLowerCase().includes(kw);
        return matchCode || matchUnit || matchName || matchPhone;
      }

      return true;
    });
  }, [contracts, currentTab, keyword]);

  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const overdueCount = contracts.filter((c) => c.status === 'OVERDUE').length;
  const expiringCount = contracts.filter((c) => c.nearExpiration).length;

  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Tra cứu hợp đồng & danh sách sắp hết hạn (FM-06)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tình trạng hợp đồng thuê thực tế để chủ động liên hệ gia hạn hoặc điều phối trả kho
          </p>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, ô kho, khách..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabs lọc */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCurrentTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({contracts.length})
        </button>
        <button
          onClick={() => setCurrentTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đang thuê ({activeCount})
        </button>
        <button
          onClick={() => setCurrentTab('EXPIRING_SOON')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'EXPIRING_SOON'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Sắp hết hạn ≤ 7 ngày ({expiringCount})
        </button>
        <button
          onClick={() => setCurrentTab('OVERDUE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            currentTab === 'OVERDUE'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Quá hạn ({overdueCount})
        </button>
      </div>

      {/* Bảng danh sách hợp đồng */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200/80">
            <tr>
              <th className="px-4 py-3">Mã HĐ</th>
              <th className="px-4 py-3">Ô kho</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Thời hạn thuê</th>
              <th className="px-4 py-3 text-right">Giá thuê/tháng</th>
              <th className="px-4 py-3 text-right">Tiền cọc giữ</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Không tìm thấy hợp đồng nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                      {c.unitCode || `Ô #${c.storageUnitId}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.customerName || `Khách #${c.customerId}`}</div>
                    {c.customerPhone && (
                      <div className="text-[11px] text-slate-400">{c.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">
                      {c.startDate} → {c.endDateExclusive}
                    </div>
                    {c.nearExpiration && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
                        <Clock className="w-3 h-3" /> Hết hạn sớm
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatVND(c.monthlyPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                    {formatVND(c.depositBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.status === 'ACTIVE' && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Đang thuê
                      </span>
                    )}
                    {c.status === 'OVERDUE' && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                        Quá hạn
                      </span>
                    )}
                    {c.status === 'PENDING_CHECKIN' && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                        Chờ nhận kho
                      </span>
                    )}
                    {!['ACTIVE', 'OVERDUE', 'PENDING_CHECKIN'].includes(c.status) && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {c.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
