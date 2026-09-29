// frontend/src/features/manager/pages/FacilityReportsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Calendar, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import type {
  FacilityOverviewReport,
  OverdueDebtReport,
  FacilityContractSummary,
  FacilityInfo,
} from '../types/report';
import {
  getFacilityOverviewReport,
  getFacilityOverdueDebtReport,
  getFacilityContractsReport,
  getAssignedFacilities,
} from '../api/facilityReportApi';
import { FacilityReportKpiCards } from '../components/reports/FacilityReportKpiCards';
import { FacilityRevenueBreakdown } from '../components/reports/FacilityRevenueBreakdown';
import { FacilityOverdueDebtRisk } from '../components/reports/FacilityOverdueDebtRisk';
import { FacilityContractsReportTable } from '../components/reports/FacilityContractsReportTable';

export const FacilityReportsPage: React.FC = () => {
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-09"

  const [facilities, setFacilities] = useState<FacilityInfo[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const [overviewData, setOverviewData] = useState<FacilityOverviewReport | null>(null);
  const [overdueData, setOverdueData] = useState<OverdueDebtReport | null>(null);
  const [contractsData, setContractsData] = useState<FacilityContractSummary[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load danh sách cơ sở
  useEffect(() => {
    let mounted = true;
    getAssignedFacilities().then((facList) => {
      if (mounted && facList.length > 0) {
        setFacilities(facList);
        // Ưu tiên chọn cơ sở đầu tiên nếu chưa chọn
        if (!selectedFacilityId) {
          setSelectedFacilityId(facList[0].id);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedFacilityId]);

  // Load dữ liệu báo cáo
  const loadReportData = useCallback(async (isManualRefresh = false) => {
    if (!selectedFacilityId) {
      setLoading(false);
      return;
    }
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const [overviewRes, overdueRes, contractsRes] = await Promise.all([
        getFacilityOverviewReport(selectedFacilityId, selectedMonth),
        getFacilityOverdueDebtReport(selectedFacilityId),
        getFacilityContractsReport(selectedFacilityId),
      ]);

      setOverviewData(overviewRes);
      setOverdueData(overdueRes);
      setContractsData(contractsRes.content || []);
    } catch (err: unknown) {
      console.error('Lỗi khi tải báo cáo cơ sở:', err);
      setOverviewData(null);
      setOverdueData(null);
      setContractsData([]);
      setErrorMessage('Không thể tải báo cáo từ máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFacilityId, selectedMonth]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const selectedFacilityName =
    facilities.find((f) => f.id === selectedFacilityId)?.name || overviewData?.facilityName || 'Chưa chọn cơ sở';

  return (
    <div className="space-y-6 pb-10">
      {/* Header thanh điều khiển */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Báo cáo hiệu suất & Tỷ lệ lấp đầy cơ sở (FM-06)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Giám sát tình hình vận hành mặt bằng, tỷ lệ Usage Rate và rủi ro nợ quá hạn thời gian thực
            </p>
          </div>

          {/* Bộ lọc chọn cơ sở & chọn tháng */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Chọn cơ sở (AC-5, SA-03) */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {facilities.length > 0 ? (
                  facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))
                ) : (
                  <option value={0}>Chưa có cơ sở</option>
                )}
              </select>
            </div>

            {/* Chọn tháng báo cáo (AC-3) */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Nút Làm mới */}
            <button
              onClick={() => loadReportData(true)}
              disabled={loading || refreshing}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Làm mới dữ liệu từ server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Banner tóm tắt cơ sở hiện tại */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Đang xem báo cáo cho: <span className="font-bold text-slate-800">{selectedFacilityName}</span>
          </div>
          <div>
            Kỳ báo cáo: <span className="font-bold text-blue-600">Tháng {selectedMonth}</span>
          </div>
        </div>
      </div>

      {overviewData && (
        <>
          <FacilityReportKpiCards data={overviewData} loading={loading} />
          <FacilityRevenueBreakdown data={overviewData} loading={loading} />
        </>
      )}

      {overdueData && <FacilityOverdueDebtRisk data={overdueData} loading={loading} />}

      {/* Phần 4: Bảng danh sách hợp đồng & hợp đồng sắp hết hạn (FM-06) */}
      <FacilityContractsReportTable contracts={contractsData} loading={loading} />
    </div>
  );
};
