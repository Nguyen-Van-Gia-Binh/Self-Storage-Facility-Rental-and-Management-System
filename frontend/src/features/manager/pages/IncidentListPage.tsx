// frontend/src/features/manager/pages/IncidentListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { fetchFacilityById } from '@/api/facility';
import { getManagementSupportRequests } from '../api/staffAssignmentApi';
import type {
  ManagementSupportTicket,
  SupportStatus,
  SupportCategory,
} from '../types/staffAssignment';
import { IncidentTable, type IncidentSortField } from '../components/IncidentTable';
import { Breadcrumb } from '../components/Breadcrumb';
import { Pagination } from '../components/Pagination';

export const IncidentListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const facIdNumber = Number(facilityId) || 1;

  const [facility, setFacility] = useState<any>(null);
  const [tickets, setTickets] = useState<ManagementSupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<SupportStatus | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<IncidentSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

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

  // Mini stats thanh trên
  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => t.status === 'NEW' || t.status === 'OPEN').length;
    const inProgress = tickets.filter(
      (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
    ).length;
    const resolved = tickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length;
    const urgent = tickets.filter((t) => t.isUrgent).length;

    return { total, pending, inProgress, resolved, urgent };
  }, [tickets]);

  // Filter & Search & Sort
  const processedTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Lọc Status Tab
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

    // 2. Lọc Category
    if (selectedCategory !== 'ALL') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 3. Search Keyword
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

    // 4. Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'isUrgent') {
        valA = a.isUrgent ? 1 : 0;
        valB = b.isUrgent ? 1 : 0;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });

    return result;
  }, [tickets, selectedStatusTab, selectedCategory, searchKeyword, sortField, sortDirection]);

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

  const handleViewDetail = (ticketId: number) => {
    navigate(`/manager/incidents/${ticketId}`);
  };

  const facilityName = facility?.name || `Cơ sở #${facIdNumber}`;
  const facilityCode = facility?.code || `FAC-${facIdNumber}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Xử lý sự cố', href: '/manager/incidents' },
          { label: `${facilityCode} (${facilityName})`, current: true },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/incidents')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
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
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-brand-100 text-brand-800">
                Cấp 2 · Danh sách
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
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Mini Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span>Tổng số:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
              {stats.total} ticket
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ tiếp nhận:</span>
            <span className="font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              {stats.pending}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-orange-700 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Đang xử lý:</span>
            <span className="font-bold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
              {stats.inProgress}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã xử lý:</span>
            <span className="font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {stats.resolved}
            </span>
          </div>

          {stats.urgent > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-rose-700 font-medium animate-pulse">
                <span>🔴 Khẩn cấp:</span>
                <span className="font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                  {stats.urgent}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toolbar: Search, Status Tabs & Filters */}
      <div className="space-y-3">
        {/* Hàng 1: Search, Category dropdown, Sort dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm mã ticket, khách hàng, ô kho..."
              className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* Lọc loại sự cố & Sắp xếp */}
          <div className="flex items-center gap-2">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="pl-3 pr-8 py-2 bg-white text-xs font-medium border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs text-slate-700 cursor-pointer"
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
                className="pl-3 pr-8 py-2 bg-white text-xs font-medium border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs text-slate-700 cursor-pointer"
              >
                <option value="createdAt_desc">Ngày báo gần nhất</option>
                <option value="createdAt_asc">Ngày báo cũ nhất</option>
                <option value="isUrgent_desc">Ưu tiên khẩn cấp trước</option>
                <option value="code_asc">Mã sự cố (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hàng 2: Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'Tất cả trạng thái' },
            { key: 'NEW', label: '⏳ Chờ tiếp nhận' },
            { key: 'IN_PROGRESS', label: '⚠️ Đang xử lý' },
            { key: 'RESOLVED', label: '✓ Đã giải quyết' },
            { key: 'CANCELLED', label: '❌ Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatusTab(tab.key as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatusTab === tab.key
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table danh sách sự cố */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang tải danh sách sự cố...</p>
        </div>
      ) : (
        <IncidentTable
          tickets={paginatedTickets}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onViewDetail={handleViewDetail}
        />
      )}

      {/* Pagination (Hiển thị khi tổng số sự cố > 10) */}
      {processedTickets.length > pageSize && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedTickets.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
