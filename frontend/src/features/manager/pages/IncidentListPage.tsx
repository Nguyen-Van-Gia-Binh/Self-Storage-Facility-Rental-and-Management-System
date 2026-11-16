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

  // Reset về trang 1 khi đổi bộ lọc hoặc đổi kích thước trang
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, timeFilter, includeBacklog, customRange, searchKeyword, selectedStatusTab, selectedCategory]);

  // 1. Lọc theo mốc thời gian và xác định sự cố tồn đọng
  const { tickets: timeFilteredTickets, backlogCount } = useMemo(() => {
    return filterTicketsByTimeRange(tickets, timeFilter, customRange, includeBacklog);
  }, [tickets, timeFilter, customRange, includeBacklog]);

  // 2. Thống kê theo phạm vi thời gian hiện tại
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

    // Status Tab
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

    // Category
    if (selectedCategory !== 'ALL') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Keyword
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

    // Sort
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

  // Phân trang
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Xử lý sự cố', to: '/manager/incidents' },
          { label: `${facilityCode} (${facilityName})` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/incidents')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="Quay lại danh sách cơ sở"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {facilityName}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                {facilityCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {facility?.address ? `${facility.address} · ` : ''}
              Theo dõi và phân công nhân viên xử lý sự cố kỹ thuật tại cơ sở
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bộ Lọc Thời Gian Thông Minh (Time Filter Presets) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Pills Chọn Nhanh Mốc Thời Gian */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Thời gian:
            </span>
            {TIME_FILTER_OPTIONS.map((opt) => {
              const isActive = timeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeFilter(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Toggle Chống Sót Việc: Sự Cố Tồn Đọng Chưa Giải Quyết */}
          {timeFilter === 'TODAY' && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none self-end sm:self-auto bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
              <input
                type="checkbox"
                checked={includeBacklog}
                onChange={(e) => setIncludeBacklog(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500 focus:ring-1 border-slate-300 cursor-pointer"
              />
              <span>Bao gồm sự cố tồn đọng chưa xử lý</span>
              {backlogCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  {backlogCount} ticket
                </span>
              )}
            </label>
          )}
        </div>

        {/* Khung Tùy Chọn Khoảng Ngày Tự Do (Nếu chọn CUSTOM) */}
        {timeFilter === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Từ ngày:</span>
            <DateField
              value={customRange.startDate || ''}
              onChange={(next) =>
                setCustomRange((prev) => ({ ...prev, startDate: next }))
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-slate-500 font-medium">Đến ngày:</span>
            <DateField
              value={customRange.endDate || ''}
              onChange={(next) =>
                setCustomRange((prev) => ({ ...prev, endDate: next }))
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        )}
      </div>

      {/* Interactive KPI Bar: Bấm trực tiếp để lọc trạng thái */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {([
          { key: 'ALL' as const, label: `Tổng sự cố ${timeFilter === 'TODAY' ? 'hôm nay' : ''}`.trim(), value: stats.total, dot: '' },
          { key: 'NEW' as const, label: 'Chờ tiếp nhận', value: stats.pending, dot: 'bg-rose-500' },
          { key: 'IN_PROGRESS' as const, label: 'Đang xử lý', value: stats.inProgress, dot: 'bg-amber-500' },
          { key: 'RESOLVED' as const, label: 'Đã giải quyết', value: stats.resolved, dot: 'bg-emerald-500' },
        ]).map((card) => {
          const selected = selectedStatusTab === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setSelectedStatusTab(card.key)}
              className={`p-4 rounded-2xl border bg-white text-left text-slate-900 transition-all cursor-pointer flex items-center justify-between ${
                selected ? 'border-brand-500 ring-2 ring-brand-500/25' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  {card.dot && <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />}
                  {card.label}
                </span>
                <span className="text-2xl font-bold num tracking-tight block mt-0.5">
                  {card.value}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search, Category & Status Tabs */}
      <div className="space-y-3">
        {/* Hàng 1: Search, Category dropdown, Sort dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm mã sự cố, khách hàng, SĐT, ô kho..."
              className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs placeholder-slate-400"
            />
          </div>

          {/* Lọc loại sự cố & Sắp xếp */}
          <div className="flex items-center gap-2">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="pl-3 pr-8 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả loại sự cố</option>
                <option value="ACCESS_ISSUE">Khóa cửa & PIN</option>
                <option value="LOST_KEY">Mất chìa khóa</option>
                <option value="FACILITY_DAMAGE">Hư bản lề / vách cửa</option>
                <option value="FACILITY_LEAK">Ngập nước / ẩm mốc</option>
                <option value="POWER_ISSUE">Điện & chiếu sáng</option>
                <option value="CLEANLINESS">Vệ sinh kho bãi</option>
                <option value="PAYMENT_BILLING">Hóa đơn & phụ phí</option>
                <option value="OTHER">Sự cố khác</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortField}_${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('_');
                  setSortField(field as IncidentSortField);
                  setSortDirection(dir as 'asc' | 'desc');
                }}
                className="pl-3 pr-8 py-2 bg-white text-xs font-semibold border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs text-slate-700 cursor-pointer"
              >
                <option value="createdAt_desc">Mới nhất trước</option>
                <option value="createdAt_asc">Cũ nhất trước</option>
                <option value="code_asc">Mã sự cố (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hàng 2: Status Tabs có Đếm Số Lượng Động */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'Tất cả trạng thái', count: stats.total },
            { key: 'NEW', label: 'Chờ tiếp nhận', count: stats.pending },
            { key: 'IN_PROGRESS', label: 'Đang xử lý', count: stats.inProgress },
            { key: 'RESOLVED', label: 'Đã giải quyết', count: stats.resolved },
            { key: 'CANCELLED', label: 'Đã hủy', count: stats.cancelled },
          ].map((tab) => {
            const isActive = selectedStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-brand-700/60 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table danh sách sự cố hoặc Empty State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Đang đồng bộ dữ liệu sự cố kỹ thuật...</p>
        </div>
      ) : timeFilteredTickets.length === 0 && timeFilter === 'TODAY' && !searchKeyword ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            Tuyệt vời! Không có sự cố nào phát sinh hôm nay
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Tất cả các ô kho và cơ sở vật chất tại {facilityName} đang vận hành ổn định.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setTimeFilter('LAST_7_DAYS')}
              className="px-4 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Xem sự cố 7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('ALL')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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

      {/* Phân trang: Hỗ trợ chuyển đổi số lượng/trang và luôn hiển thị điều hướng chuyên nghiệp */}
      {processedTickets.length > 0 && (
        <div className="pt-2">
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
