// frontend/src/features/manager/pages/ContractListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { ContractTable, type ContractSortField, type SortDirection } from '../components/ContractTable';
import { Pagination } from '../components/Pagination';

export type ContractTabFilter =
  | 'ALL'
  | 'ACTIVE'
  | 'PENDING_RETURN'
  | 'OVERDUE'
  | 'TERMINATED'
  | 'CLOSED'
  | 'PENDING_CHECK_IN';

const STATUS_TABS: { label: string; value: ContractTabFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: '✓ Active', value: 'ACTIVE' },
  { label: '⏳ Pending Return', value: 'PENDING_RETURN' },
  { label: '⚠️ Overdue', value: 'OVERDUE' },
  { label: '🔴 Terminated', value: 'TERMINATED' },
  { label: '📋 Closed', value: 'CLOSED' },
  { label: '🔵 Chờ nhận', value: 'PENDING_CHECK_IN' },
];

const PAGE_SIZE = 10;

export const ContractListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const facilityIdNum = Number(facilityId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [contracts, setContracts] = useState<ManagerContractItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContractTabFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort
  const [sortField, setSortField] = useState<ContractSortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isManual = false) => {
      if (!facilityIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // 1. Tải thông tin cơ sở
        const facList = await fetchMyAssignedFacilities();
        const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
        setFacility(currentFac);

        // 2. Tải danh sách hợp đồng của cơ sở
        const list = await getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' });
        setContracts(list || []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách hợp đồng:', err);
        setError('Không thể tải danh sách hợp đồng của cơ sở này.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [facilityIdNum]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset trang về 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  // Thống kê nhanh cơ sở cho 4 thẻ KPI
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === 'ACTIVE').length;
    const pending = contracts.filter(
      (c) =>
        c.status === 'PENDING_RETURN' ||
        c.status === 'PENDING_CHECK_IN' ||
        (c.status as string) === 'INSPECTED'
    ).length;
    const overdue = contracts.filter(
      (c) => c.status === 'OVERDUE' || c.status === 'TERMINATED'
    ).length;
    return { total, active, pending, overdue };
  }, [contracts]);

  // Đếm số lượng theo từng tab trạng thái
  const tabCounts = useMemo(() => {
    const counts: Record<ContractTabFilter, number> = {
      ALL: contracts.length,
      ACTIVE: 0,
      PENDING_RETURN: 0,
      OVERDUE: 0,
      TERMINATED: 0,
      CLOSED: 0,
      PENDING_CHECK_IN: 0,
    };
    contracts.forEach((c) => {
      if (counts[c.status as ContractTabFilter] !== undefined) {
        counts[c.status as ContractTabFilter] += 1;
      }
    });
    return counts;
  }, [contracts]);

  const handleSort = (field: ContractSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Lọc và Sắp xếp
  const processedContracts = useMemo(() => {
    // 1. Filter
    const filtered = contracts
      .filter((c) => {
        if (statusFilter === 'ALL') return true;
        return c.status === statusFilter;
      })
      .filter((c) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.code.toLowerCase().includes(term) ||
          c.customerName.toLowerCase().includes(term) ||
          c.customerPhone.includes(term) ||
          (c.storageUnitCode && c.storageUnitCode.toLowerCase().includes(term))
        );
      });

    // 2. Sort
    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'code':
          cmp = a.code.localeCompare(b.code, 'vi', { numeric: true });
          break;
        case 'customer':
          cmp = a.customerName.localeCompare(b.customerName, 'vi');
          break;
        case 'unit':
          cmp = (a.storageUnitCode || '').localeCompare(b.storageUnitCode || '', 'vi', {
            numeric: true,
          });
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'endDate':
          cmp = (a.endDateExclusive || '').localeCompare(b.endDateExclusive || '');
          break;
        default:
          cmp = 0;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [contracts, statusFilter, searchTerm, sortField, sortDirection]);

  // Phân trang: 10 dòng/trang
  const totalPages = Math.ceil(processedContracts.length / PAGE_SIZE) || 1;
  const paginatedContracts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return processedContracts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [processedContracts, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Cấp 2 */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            icon: Building2,
          },
        ]}
      />

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh sách Hợp đồng
            </h1>
            {facility && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                {facility.name} ({facility.code})
              </span>
            )}
          </div>
          {facility?.address && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Địa chỉ: {facility.address} {facility.phone ? `• Hotline: ${facility.phone}` : ''}
            </p>
          )}
        </div>

        {/* Toolbar: Tìm kiếm mã HĐ/khách & Làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã HĐ, tên khách, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Bar 4 Thẻ Trực Quan - Đưa từ thẻ ngoài vào trong màn hình chi tiết */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng hợp đồng */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all duration-300 cursor-pointer select-none hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'ALL'
              ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng hợp đồng</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">hợp đồng</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Toàn bộ hồ sơ tại cơ sở</p>
        </div>

        {/* Card 2: Đang hiệu lực (Active) */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all duration-300 cursor-pointer select-none hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-slate-200/90 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Đang hiệu lực</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-emerald-600">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-medium">đang thuê</span>
          </div>
          <p className="text-[10px] text-emerald-600/80 mt-1">Khách sử dụng bình thường</p>
        </div>

        {/* Card 3: Chờ bàn giao / thanh lý (Pending) */}
        <div
          onClick={() => setStatusFilter('PENDING_RETURN')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all duration-300 cursor-pointer select-none hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'PENDING_RETURN' || statusFilter === 'PENDING_CHECK_IN'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
              : 'border-slate-200/90 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Chờ xử lý</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-amber-600">{stats.pending}</span>
            <span className="text-xs text-amber-600 font-medium">chờ xử lý</span>
          </div>
          <p className="text-[10px] text-amber-600/80 mt-1">Chờ nhận kho hoặc thanh lý</p>
        </div>

        {/* Card 4: Quá hạn / Cần can thiệp (Overdue) */}
        <div
          onClick={() => setStatusFilter('OVERDUE')}
          className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all duration-300 cursor-pointer select-none hover:-translate-y-1 hover:shadow-md ${
            statusFilter === 'OVERDUE' || statusFilter === 'TERMINATED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
              : 'border-slate-200/90 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Quá hạn / Nguy cơ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-rose-600">{stats.overdue}</span>
            <span className="text-xs text-rose-600 font-medium">quá hạn</span>
          </div>
          <p className="text-[10px] text-rose-600/80 mt-1">Cần đốc thúc nợ phạt / niêm phong</p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData(true)} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Tabs Filter theo Trạng thái */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = tabCounts[tab.value] || 0;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Danh sách Hợp đồng & Phân trang */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <ContractTable
            contracts={paginatedContracts}
            onSelectContract={(c) => navigate(`/manager/contracts/${c.id}`)}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Phân trang: Threshold > 10 hợp đồng */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedContracts.length}
            pageSize={PAGE_SIZE}
            threshold={10}
            itemName="hợp đồng"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};
