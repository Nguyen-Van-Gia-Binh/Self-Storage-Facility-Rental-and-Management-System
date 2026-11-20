// frontend/src/features/manager/pages/IncidentListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { fetchFacilityById } from '@/api/facility';
import { DateField } from '@/components/ui/DateField';
import { getManagementSupportRequests } from '../api/staffAssignmentApi';
import type {
  ManagementSupportTicket,
  SupportStatus,
  SupportCategory,
} from '../types/staffAssignment';
import { IncidentTable, type IncidentSortField } from '../components/IncidentTable';
import { Breadcrumb } from '../components/Breadcrumb';
import { Pagination } from '../components/Pagination';
import { QuickAssignModal } from '../components/QuickAssignModal';
import {
  filterTicketsByTimeRange,
  type TimeFilterPreset,
  type CustomDateRange,
} from '../utils/incidentTimeFilter';

const TIME_FILTER_OPTIONS: { label: string; value: TimeFilterPreset }[] = [
  { label: 'Hôm nay', value: 'TODAY' },
  { label: 'Hôm qua', value: 'YESTERDAY' },
  { label: '7 ngày qua', value: 'LAST_7_DAYS' },
  { label: '30 ngày qua', value: 'LAST_30_DAYS' },
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Tùy chọn', value: 'CUSTOM' },
];

export const IncidentListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const facIdNumber = Number(facilityId) || 1;

  const [facility, setFacility] = useState<any>(null);
  const [tickets, setTickets] = useState<ManagementSupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Time Filter State
  const [timeFilter, setTimeFilter] = useState<TimeFilterPreset>('TODAY');
  const [includeBacklog, setIncludeBacklog] = useState<boolean>(true);
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: '',
    endDate: '',
  });

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<SupportStatus | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<IncidentSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Quick Assign Modal
  const [quickAssignTicket, setQuickAssignTicket] = useState<ManagementSupportTicket | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facRes, ticketsRes] = await Promise.all([
        fetchFacilityById(facIdNumber).catch(() => null),
        getManagementSupportRequests({
          facilityId: facIdNumber,
        }).catch(() => []),
      ]);

      setFacility(facRes);
      setTickets(ticketsRes);
    } catch (err) {
      console.error('Lỗi tải danh sách sự cố cơ sở:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [facIdNumber]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, timeFilter, includeBacklog, customRange, searchKeyword, selectedStatusTab, selectedCategory]);

  // 1. Lọc theo mốc thời gian và xác định sự cố tồn đọng
  const { tickets: timeFilteredTickets, backlogCount } = useMemo(() => {
    return filterTicketsByTimeRange(tickets, timeFilter, customRange, includeBacklog);
  }, [tickets, timeFilter, customRange, includeBacklog]);

  // 2. Thống kê theo phạm vi thời gian hiện tại (hiển thị trực tiếp trên Underline Status Tabs)
  const stats = useMemo(() => {
    const total = timeFilteredTickets.length;
    const pending = timeFilteredTickets.filter(
      (t) => t.status === 'NEW' || t.status === 'OPEN'
    ).length;
    const inProgress = timeFilteredTickets.filter(
      (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
    ).length;
    const resolved = timeFilteredTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length;
    const cancelled = timeFilteredTickets.filter((t) => t.status === 'CANCELLED').length;

    return { total, pending, inProgress, resolved, cancelled };
  }, [timeFilteredTickets]);

  // 3. Lọc chi tiết theo Status Tab, Category, Keyword và Sắp xếp
  const processedTickets = useMemo(() => {
    let result = [...timeFilteredTickets];

    if (selectedStatusTab !== 'ALL') {
      if (selectedStatusTab === 'NEW' || selectedStatusTab === 'OPEN') {
        result = result.filter((t) => t.status === 'NEW' || t.status === 'OPEN');
      } else if (selectedStatusTab === 'IN_PROGRESS') {
        result = result.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS');
      } else if (selectedStatusTab === 'RESOLVED') {
        result = result.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
      } else {
        result = result.filter((t) => t.status === selectedStatusTab);
      }
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((t) => {
        if (t.category === selectedCategory) return true;
        if (selectedCategory === 'LOCK_ACCESS' && (t.category === 'ACCESS_ISSUE' || t.category === 'LOST_KEY')) return true;
        if (selectedCategory === 'UNIT_DAMAGE' && (t.category === 'FACILITY_DAMAGE' || t.category === 'FACILITY_LEAK' || t.category === 'POWER_ISSUE')) return true;
        if (selectedCategory === 'PAYMENT' && t.category === 'PAYMENT_BILLING') return true;
        return false;
      });
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          (t.customerPhone && t.customerPhone.includes(q)) ||
          t.storageUnitCode.toLowerCase().includes(q) ||
          (t.contractCode && t.contractCode.toLowerCase().includes(q)) ||
          t.description.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA: any = a[sortField];
      const valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });

    return result;
  }, [timeFilteredTickets, selectedStatusTab, selectedCategory, searchKeyword, sortField, sortDirection]);

  const totalPages = Math.ceil(processedTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTickets.slice(start, start + pageSize);
  }, [processedTickets, currentPage, pageSize]);

  const handleSort = (field: IncidentSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleResetFilters = () => {
    setTimeFilter('TODAY');
    setIncludeBacklog(true);
    setSelectedStatusTab('ALL');
    setSelectedCategory('ALL');
    setSearchKeyword('');
  };

  const facilityName = facility?.name || `Cơ sở #${facIdNumber}`;
  const facilityCode = facility?.code || `FAC-${facIdNumber}`;

  const statusTabs: {
    key: SupportStatus | 'ALL';
    label: string;
    count: number;
    dot?: string;
  }[] = [
    { key: 'ALL', label: 'Tất cả trạng thái', count: stats.total },
    { key: 'NEW', label: 'Chờ tiếp nhận', count: stats.pending, dot: 'bg-rose-500' },
    { key: 'IN_PROGRESS', label: 'Đang xử lý', count: stats.inProgress, dot: 'bg-amber-500' },
    { key: 'RESOLVED', label: 'Đã giải quyết', count: stats.resolved, dot: 'bg-emerald-500' },
    { key: 'CANCELLED', label: 'Đã hủy', count: stats.cancelled, dot: 'bg-gray-400' },
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Xử lý sự cố', to: '/manager/incidents' },
          { label: `${facilityCode} (${facilityName})` },
        ]}
      />

      {/* Page Header phẳng */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/manager/incidents')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
            title="Quay lại danh sách cơ sở"
            aria-label="Quay lại danh sách cơ sở"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {facilityName}
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                {facilityCode}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {facility?.address ? `${facility.address} · ` : ''}
              Theo dõi và phân công nhân viên xử lý sự cố kỹ thuật tại cơ sở
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : 'text-gray-500'}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bộ lọc Thời gian + Search + Category + Sort gộp gọn (không có 4 thẻ KPI trùng lặp) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3.5">
        {/* Hàng 1: Mốc thời gian + Backlog toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-gray-500 mr-1 inline-flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Thời gian:
            </span>
            <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
              {TIME_FILTER_OPTIONS.map((opt) => {
                const isActive = timeFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimeFilter(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {timeFilter === 'TODAY' && (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBacklog}
                onChange={(e) => setIncludeBacklog(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-brand-600 cursor-pointer"
              />
              <span>Bao gồm sự cố tồn đọng chưa xử lý</span>
              {backlogCount > 0 && (
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 tabular-nums">
                  {backlogCount}
                </span>
              )}
            </label>
          )}
        </div>

        {/* Khung chọn khoảng ngày tự do (CUSTOM) */}
        {timeFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">Từ ngày:</span>
            <DateField
              value={customRange.startDate || ''}
              onChange={(next) =>
                setCustomRange((prev) => ({ ...prev, startDate: next }))
              }
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-gray-500 font-medium">Đến ngày:</span>
            <DateField
              value={customRange.endDate || ''}
              onChange={(next) =>
                setCustomRange((prev) => ({ ...prev, endDate: next }))
              }
              className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        )}

        {/* Hàng 2: Tìm kiếm + Lọc loại sự cố + Sắp xếp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm mã sự cố, khách hàng, SĐT, ô kho..."
              className="w-full pl-9 pr-3 py-1.5 bg-white text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              aria-label="Lọc theo loại sự cố"
              className="px-3 py-1.5 bg-white text-xs font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-700 cursor-pointer"
            >
              <option value="ALL">Tất cả loại sự cố</option>
              <option value="LOCK_ACCESS">Khóa & Mã PIN</option>
              <option value="UNIT_DAMAGE">Hư hỏng kho & Đèn</option>
              <option value="PAYMENT">Thanh toán & Phí</option>
              <option value="BELONGINGS">Tài sản & Xe đẩy</option>
              <option value="OTHER">Sự cố khác</option>
            </select>

            <select
              value={`${sortField}_${sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('_');
                setSortField(field as IncidentSortField);
                setSortDirection(dir as 'asc' | 'desc');
              }}
              aria-label="Sắp xếp danh sách sự cố"
              className="px-3 py-1.5 bg-white text-xs font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-700 cursor-pointer"
            >
              <option value="createdAt_desc">Mới nhất trước</option>
              <option value="createdAt_asc">Cũ nhất trước</option>
              <option value="code_asc">Mã sự cố (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Underline Status Tabs (Nguồn duy nhất cho cả số đếm & bộ lọc trạng thái) */}
      <div
        role="tablist"
        aria-label="Lọc sự cố theo trạng thái"
        className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto scrollbar-none"
      >
        {statusTabs.map((tab) => {
          const isActive = selectedStatusTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-2 -mb-px border-b-2 ${
                isActive
                  ? 'border-brand-600 text-brand-700 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
              <span>{tab.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md tabular-nums ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table danh sách sự cố hoặc Empty State gọn gàng chuẩn B2B */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">
            Đang đồng bộ dữ liệu sự cố kỹ thuật...
          </p>
        </div>
      ) : timeFilteredTickets.length === 0 && timeFilter === 'TODAY' && !searchKeyword ? (
        <div className="bg-white rounded-xl border border-gray-200 py-10 px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">
            Không có sự cố nào phát sinh hôm nay
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Các ô kho và hạng mục vận hành tại {facilityName} hiện đang hoạt động ổn định.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setTimeFilter('LAST_7_DAYS')}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              Xem sự cố 7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('ALL')}
              className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              Xem toàn bộ lịch sử
            </button>
          </div>
        </div>
      ) : (
        <IncidentTable
          tickets={paginatedTickets}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onViewDetail={(ticketId) => navigate(`/manager/incidents/${ticketId}`)}
          onQuickAssign={(ticket) => setQuickAssignTicket(ticket)}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Phân trang */}
      {processedTickets.length > 0 && (
        <div className="pt-1">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedTickets.length}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemName="sự cố"
            showAlways={true}
          />
        </div>
      )}

      {/* Quick Assign Modal */}
      <QuickAssignModal
        ticket={quickAssignTicket}
        facilityId={facIdNumber}
        isOpen={Boolean(quickAssignTicket)}
        onClose={() => setQuickAssignTicket(null)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
