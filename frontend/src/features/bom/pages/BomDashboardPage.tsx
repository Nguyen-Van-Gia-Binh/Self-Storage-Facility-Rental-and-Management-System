import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
  Loader2,
  CheckCircle2,
  FilterX,
  ReceiptText,
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
import { downloadBlobFile } from '@/utils/format';
import {
  buildExportFilename,
  buildMultiSheetXlsx,
  buildRevenueCsv,
} from '../utils/reportDataExport';
import { BomFilterBar } from '../components/BomFilterBar';
import { BomKpiSummary } from '../components/BomKpiSummary';
import { RevenueTrendCharts } from '../components/RevenueTrendCharts';
import { RevenueStreamDonut } from '../components/RevenueStreamDonut';
import { OccupancyComparisonChart } from '../components/OccupancyComparisonChart';
import { FacilityPerformanceTable } from '../components/FacilityPerformanceTable';
import { FacilityPerformanceDrawer, type FacilityPerformanceData } from '../components/FacilityPerformanceDrawer';
import { OverdueContractsTable } from '../components/OverdueContractsTable';
import { TransactionHistoryTable } from '../components/TransactionHistoryTable';
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

  const [activeTab, setActiveTab] = useState<'REVENUE' | 'OCCUPANCY' | 'OVERDUE' | 'TRANSACTIONS'>('REVENUE');
  const [revenueData, setRevenueData] = useState<SystemRevenueReport | undefined>();
  const [occupancyData, setOccupancyData] = useState<SystemOccupancyReport | undefined>();
  const [overdueData, setOverdueData] = useState<OverdueReportResponse | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(initialOpenExport);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [drawerFacility, setDrawerFacility] = useState<FacilityPerformanceData | null>(null);
  const [printRequested, setPrintRequested] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [reloadNonce, setReloadNonce] = useState(0);

  const handleFilterChange = (newFilters: ReportFilterParams) => {
    setIsLoading(true);
    setFilters(newFilters);
    setReloadNonce((n) => n + 1);
  };

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
    setIsLoading(true);
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
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải dữ liệu báo cáo BOM:', err);
        if (!ignore) {
          setPrintRequested(false);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [filters, reloadNonce]);

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

  const handleOpenDetailFromOccupancy = (occ: any) => {
    const rev = revenueData?.byFacility?.find((r) => r.facilityId === occ.facilityId);
    setDrawerFacility({
      facilityId: occ.facilityId,
      facilityName: occ.facilityName,
      rentalRevenue: rev?.rentalRevenue || 0,
      surchargeRevenue: rev?.surchargeRevenue || 0,
      renewalRevenue: rev?.renewalRevenue || 0,
      overdueFeeRevenue: rev?.overdueFeeRevenue || 0,
      totalRevenue: rev?.totalRevenue || 0,
      depositBalance: rev?.depositBalance || 0,
      refundAmount: rev?.refundAmount || 0,
      occupancyRate: occ.occupancyRate,
      occupiedUnits: occ.occupiedUnits,
      availableUnits: occ.availableUnits,
      outOfServiceUnits: occ.outOfServiceUnits || 0,
      totalUnits: occ.totalUnits,
      overdueCount: occ.overdueContractsCount || 0,
    });
  };

  const selectedFacilityName = filters.facilityId
    ? facilities.find((f) => f.id === filters.facilityId)?.name || 'Cơ sở đã chọn'
    : 'Toàn bộ hệ thống (Toàn quốc)';
  const preparedBy = tokenStorage.getUser()?.fullName || 'Ban vận hành kinh doanh';
  const preparedOn = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportToast, setExportToast] = useState<{ status: 'loading' | 'done'; text: string } | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExportMenuOpen]);

  const handleQuickExport = (targetFormat: 'PDF' | 'XLSX' | 'CSV') => {
    setIsExportMenuOpen(false);
    if (targetFormat === 'PDF') {
      handlePrintReport(filters.facilityId);
      return;
    }

    setExportToast({
      status: 'loading',
      text: 'Đang khởi tạo file... Vui lòng chờ trong giây lát',
    });

    window.setTimeout(() => {
      try {
        const exportDate = todayInHoChiMinh();
        if (targetFormat === 'XLSX') {
          const bytes = buildMultiSheetXlsx({
            revenue: revenueData,
            occupancy: occupancyData,
            overdue: overdueData,
            from: filters.from,
            to: filters.to,
            scopeName: selectedFacilityName,
          });
          const blob = new Blob([bytes.buffer as ArrayBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const filename = buildExportFilename('xlsx', exportDate, filters.facilityId);
          downloadBlobFile(blob, filename);
          setExportToast({ status: 'done', text: `Đã tải xuống ${filename}` });
        } else {
          const csvContent = buildRevenueCsv(revenueData, occupancyData);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const filename = buildExportFilename('csv', exportDate, filters.facilityId);
          downloadBlobFile(blob, filename);
          setExportToast({ status: 'done', text: `Đã tải xuống ${filename}` });
        }
      } finally {
        window.setTimeout(() => setExportToast(null), 3200);
      }
    }, 150);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Export Toast Notification */}
      {exportToast && (
        <div
          role="status"
          className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-md shadow-lg text-xs font-medium text-gray-800"
        >
          {exportToast.status === 'loading' ? (
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{exportToast.text}</span>
        </div>
      )}

      {/* Header trang (ẩn khi in) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Giám Sát Doanh Thu &amp; Hiệu Quả Vận Hành
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {lastRefreshed && (
            <span className="text-xs text-slate-400 num hidden md:inline">
              Cập nhật lúc: {lastRefreshed}
            </span>
          )}

          {/* Enterprise Export Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất dữ liệu</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-40"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleQuickExport('PDF')}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-gray-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Xuất PDF</div>
                    <div className="text-[11px] text-gray-500">In ấn, trình ký (Ledger đơn sắc A4)</div>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleQuickExport('XLSX')}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-gray-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Xuất Excel (.xlsx)</div>
                    <div className="text-[11px] text-gray-500">4 sheet dữ liệu thô cho kế toán</div>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleQuickExport('CSV')}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-gray-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Xuất CSV (Dữ liệu thô)</div>
                    <div className="text-[11px] text-gray-500">UTF-8 BOM, sẵn sàng import</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Bộ lọc điều hành (no-print) */}
      <div className="no-print">
        <BomFilterBar
          filters={filters}
          onChange={handleFilterChange}
          onOpenExport={() => setIsExportModalOpen(true)}
          facilities={facilities}
          isLoading={isLoading}
        />
      </div>

      {/* 1.1 Banner báo hiệu đang xem cơ sở cụ thể (kèm nút Bỏ lọc - UX Best Practice) */}
      {filters.facilityId && (
        <div className="bg-brand-50 border border-brand-200/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-brand-950 no-print shadow-2xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              Đang xem số liệu thu hẹp của: <strong className="font-semibold text-brand-900">{selectedFacilityName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, facilityId: undefined }))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-brand-300 text-brand-700 hover:bg-brand-100 font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            title="Quay lại xem báo cáo toàn bộ hệ thống"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Bỏ lọc (Xem toàn hệ thống)</span>
          </button>
        </div>
      )}

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
              label: 'Doanh thu & Dòng tiền',
              icon: TrendingUp,
            },
            {
              id: 'OCCUPANCY',
              label: 'Tỷ lệ lấp đầy',
              icon: BarChart3,
            },
            {
              id: 'OVERDUE',
              label: 'Quá hạn & Nợ đọng',
              icon: AlertTriangle,
              badge: overdueData?.totalOverdueContracts || 0,
            },
            {
              id: 'TRANSACTIONS',
              label: 'Lịch sử giao dịch',
              icon: ReceiptText,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
            {/* TẦNG 2: XU HƯỚNG THEO THỜI GIAN (12 THÁNG) */}
            <div className="print-break-inside-avoid">
              <RevenueTrendCharts
                data={revenueData?.monthlyTrends}
                isLoading={isLoading}
              />
            </div>

            {/* TẦNG 3: CƠ CẤU DOANH THU */}
            <div className="print-break-inside-avoid">
              <RevenueStreamDonut
                revenue={revenueData}
                selectedStream={selectedStream}
                onSelectStream={setSelectedStream}
                isLoading={isLoading}
              />
            </div>

            {/* TẦNG 4: MA TRẬN CHI TIẾT THEO CƠ SỞ */}
            <div className="print-break-inside-avoid">
              <FacilityPerformanceTable
                revenues={revenueData?.byFacility || []}
                occupancies={occupancyData?.data || []}
                onSelectFacility={(id) => setFilters((prev) => ({ ...prev, facilityId: id }))}
                onOpenDetail={(fac) => setDrawerFacility(fac)}
                highlightedStream={selectedStream}
                onClearHighlight={() => setSelectedStream(null)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Tỷ lệ lấp đầy & Hiện trạng ô kho (Enterprise UX List View) */}
        {activeTab === 'OCCUPANCY' && (
          <div className="space-y-6">
            <div className="print-break-inside-avoid">
              <OccupancyComparisonChart
                data={occupancyData?.data || []}
                isLoading={isLoading}
                onSelectFacility={(id) => setFilters((prev) => ({ ...prev, facilityId: id }))}
                onOpenDetail={handleOpenDetailFromOccupancy}
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

        {activeTab === 'TRANSACTIONS' && (
          <TransactionHistoryTable
            key={`${filters.from}|${filters.to}|${filters.facilityId ?? ''}`}
            from={filters.from}
            to={filters.to}
            facilityId={filters.facilityId}
          />
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

      {/* 5. Drawer xem nhanh chi tiết cơ sở (Slide-over) */}
      <FacilityPerformanceDrawer
        isOpen={drawerFacility !== null}
        facility={drawerFacility}
        onClose={() => setDrawerFacility(null)}
        onApplyGlobalFilter={(id) => setFilters((prev) => ({ ...prev, facilityId: id }))}
      />

      {/* 6. Modal xuất báo cáo (CSV/XLSX/PDF) */}
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
