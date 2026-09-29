import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  ReportFilterParams,
  SystemRevenueReport,
  SystemOccupancyReport,
  OverdueReportResponse,
  FacilityListItem,
} from '@/types';
import {
  getSystemRevenueReport,
  getSystemOccupancyReport,
  getSystemOverdueReport,
} from '@/api/report';
import { fetchFacilities } from '@/api/facility';
import { tokenStorage } from '@/utils/tokenStorage';
import { Button } from '@/components/ui/Button';
import { BomFilterBar } from '../components/BomFilterBar';
import { BomKpiSummary } from '../components/BomKpiSummary';
import { RevenueStreamBar } from '../components/RevenueStreamBar';
import { OccupancyComparisonChart } from '../components/OccupancyComparisonChart';
import { FacilityPerformanceTable } from '../components/FacilityPerformanceTable';
import { OverdueContractsTable } from '../components/OverdueContractsTable';
import { ReportExportModal } from '../components/ReportExportModal';
import { ExecutivePrintReport } from '../components/ExecutivePrintReport';

/** Ngày hiện tại theo Asia/Ho_Chi_Minh (YYYY-MM-DD). */
function todayInHoChiMinh(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Kỳ mặc định: 30 ngày gần nhất đến hôm nay (BM-04 audit #20). */
function defaultLast30DaysFilter(): ReportFilterParams {
  const to = todayInHoChiMinh();
  const toDate = new Date(`${to}T12:00:00`);
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = fromDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  return {
    periodType: 'CUSTOM',
    from,
    to,
    facilityId: undefined,
  };
}

export interface BomDashboardPageProps {
  initialOpenExport?: boolean;
}

export const BomDashboardPage: React.FC<BomDashboardPageProps> = ({
  initialOpenExport = false,
}) => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [filters, setFilters] = useState<ReportFilterParams>(defaultLast30DaysFilter);

  const [activeTab, setActiveTab] = useState<'REVENUE' | 'OCCUPANCY' | 'OVERDUE'>('REVENUE');
  const [revenueData, setRevenueData] = useState<SystemRevenueReport | undefined>();
  const [occupancyData, setOccupancyData] = useState<SystemOccupancyReport | undefined>();
  const [overdueData, setOverdueData] = useState<OverdueReportResponse | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(initialOpenExport);
  const [printRequested, setPrintRequested] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Nạp danh sách cơ sở động từ API (BM-04, BM-05)
  useEffect(() => {
    let ignore = false;
    fetchFacilities(undefined, true)
      .then((data) => {
        if (!ignore) {
          setFacilities(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh sách cơ sở trên BOM Dashboard:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const monthStr = filters.from.substring(0, 7);

    Promise.all([
      getSystemRevenueReport(filters),
      getSystemOccupancyReport(monthStr, filters.facilityId),
      getSystemOverdueReport(filters.facilityId),
    ])
      .then(([rev, occ, ovd]) => {
        if (!ignore) {
          setRevenueData(rev);
          setOccupancyData(occ);
          setOverdueData(ovd);
          setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải dữ liệu báo cáo BOM:', err);
        if (!ignore) {
          setIsLoading(false);
          setPrintRequested(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filters]);

  const handlePrintReport = (facilityId?: number) => {
    setIsExportModalOpen(false);
    if (facilityId !== filters.facilityId) {
      setIsLoading(true);
      setFilters((current) => ({ ...current, facilityId }));
    }
    setPrintRequested(true);
  };

  useEffect(() => {
    if (!printRequested || isExportModalOpen || isLoading) return;
    const frame = window.requestAnimationFrame(() => {
      window.print();
      setPrintRequested(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [printRequested, isExportModalOpen, isLoading]);

  const handleRefresh = () => {
    setIsLoading(true);
    const monthStr = filters.from.substring(0, 7);
    Promise.all([
      getSystemRevenueReport(filters),
      getSystemOccupancyReport(monthStr, filters.facilityId),
      getSystemOverdueReport(filters.facilityId),
    ])
      .then(([rev, occ, ovd]) => {
        setRevenueData(rev);
        setOccupancyData(occ);
        setOverdueData(ovd);
        setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi khi làm mới dữ liệu:', err);
        setIsLoading(false);
      });
  };

  const selectedFacilityName = filters.facilityId
    ? facilities.find((f) => f.id === filters.facilityId)?.name || 'Cơ sở đã chọn'
    : 'Toàn bộ hệ thống (Toàn quốc)';
  const preparedBy = tokenStorage.getUser()?.fullName || 'Ban vận hành kinh doanh';
  const preparedOn = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header trang (ẩn khi in) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Phân Hệ Vận Hành Doanh Nghiệp</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Giám Sát Doanh Thu & Hiệu Quả Vận Hành
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi doanh thu thực thu, phân tích tỷ lệ lấp đầy ô kho và cảnh báo rủi ro quá hạn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {lastRefreshed && (
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              Cập nhật lúc: {lastRefreshed}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
            className="flex items-center gap-1.5 text-xs py-2 px-3 border-slate-300 hover:bg-slate-50"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 text-xs py-2 px-3.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Trích xuất báo cáo
          </Button>
        </div>
      </div>

      {/* 1. Bộ lọc điều hành (no-print) */}
      <div className="no-print">
        <BomFilterBar
          filters={filters}
          onChange={setFilters}
          onOpenExport={() => setIsExportModalOpen(true)}
          facilities={facilities}
          isLoading={isLoading}
        />
      </div>

      {/* 2. Dải 4 Thẻ KPI Chiến Lược */}
      <div className="no-print">
        <BomKpiSummary
          revenue={revenueData}
          occupancy={occupancyData}
          overdue={overdueData}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Tab điều hướng phân tích chuyên sâu (no-print) */}
      <div className="border-b border-slate-200 no-print">
        <nav className="flex items-center gap-2 sm:gap-6 -mb-px">
          {[
            {
              id: 'REVENUE',
              label: 'Cơ cấu Doanh thu & Dòng tiền',
              icon: TrendingUp,
            },
            {
              id: 'OCCUPANCY',
              label: 'Hiệu suất & Tỷ lệ lấp đầy',
              icon: BarChart3,
            },
            {
              id: 'OVERDUE',
              label: 'Hợp đồng Quá hạn & Nợ đọng',
              icon: AlertTriangle,
              badge: overdueData?.totalOverdueContracts || 0,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'REVENUE' | 'OCCUPANCY' | 'OVERDUE')}
                className={`flex items-center gap-2 py-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Nội dung theo Tab được chọn (chỉ trên màn hình) */}
      <div className="bom-screen-panels space-y-6">
        {/* Tab 1: Cơ cấu Doanh thu & Ma trận chi nhánh */}
        {activeTab === 'REVENUE' && (
          <div className="space-y-6">
            <div className="print-break-inside-avoid">
              <RevenueStreamBar revenue={revenueData} isLoading={isLoading} />
            </div>
            <div className="print-break-inside-avoid">
              <FacilityPerformanceTable
                revenues={revenueData?.byFacility || []}
                occupancies={occupancyData?.data || []}
                onSelectFacility={(id) => setFilters((prev) => ({ ...prev, facilityId: id }))}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Tỷ lệ lấp đầy & Hiện trạng ô kho */}
        {activeTab === 'OCCUPANCY' && (
          <div className="space-y-6">
            <div className="print-break-inside-avoid">
              <OccupancyComparisonChart
                data={occupancyData?.data || []}
                isLoading={isLoading}
              />
            </div>
            <div className="print-break-inside-avoid">
              <FacilityPerformanceTable
                revenues={revenueData?.byFacility || []}
                occupancies={occupancyData?.data || []}
                onSelectFacility={(id) => setFilters((prev) => ({ ...prev, facilityId: id }))}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Hợp đồng quá hạn & Nợ đọng */}
        {activeTab === 'OVERDUE' && (
          <div className="print-break-inside-avoid">
            <OverdueContractsTable
              items={overdueData?.content || []}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      <div className="bom-print-stack">
        <ExecutivePrintReport
          revenue={revenueData}
          occupancy={occupancyData}
          overdue={overdueData}
          from={filters.from}
          to={filters.to}
          scopeName={selectedFacilityName}
          printedAt={new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
          preparedBy={preparedBy}
          preparedOn={preparedOn}
        />
      </div>

      {/* 5. Modal xuất báo cáo (CSV/XLSX/PDF) */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onPrint={handlePrintReport}
        currentFilters={filters}
        facilities={facilities}
      />
    </div>
  );
};
