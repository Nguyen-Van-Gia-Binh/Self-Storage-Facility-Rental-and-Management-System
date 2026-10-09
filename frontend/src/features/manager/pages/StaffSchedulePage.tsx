// frontend/src/features/manager/pages/StaffSchedulePage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Building2,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { FacilityShiftSummaryCard, type FacilityShiftStats } from '../components/FacilityShiftSummaryCard';
import { Pagination } from '../components/Pagination';

export type RegionFilter = 'ALL' | 'HN' | 'HCM' | 'DN' | 'OTHER';
export type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'STAFF_DESC';

const CARDS_PER_PAGE = 12;

export const StaffSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const facList = await fetchMyAssignedFacilities();
      setFacilities(facList);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách cơ sở.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc vùng miền
  const matchesRegion = useCallback((f: FacilityListItem, region: RegionFilter) => {
    if (region === 'ALL') return true;
    const addr = (f.address || '').toLowerCase();
    if (region === 'HN') return addr.includes('hà nội') || addr.includes('hn');
    if (region === 'HCM') return addr.includes('hồ chí minh') || addr.includes('hcm') || addr.includes('tp.hcm');
    if (region === 'DN') return addr.includes('đà nẵng');
    if (region === 'OTHER') {
      return (
        !addr.includes('hà nội') &&
        !addr.includes('hn') &&
        !addr.includes('hồ chí minh') &&
        !addr.includes('hcm') &&
        !addr.includes('tp.hcm') &&
        !addr.includes('đà nẵng')
      );
    }
    return true;
  }, []);

  // Filter & Search & Sort
  const filteredFacilities = useMemo(() => {
    let result = facilities.filter((f) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchReg = matchesRegion(f, regionFilter);
      return matchSearch && matchReg;
    });

    result.sort((a, b) => {
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sortBy === 'NAME_DESC') return b.name.localeCompare(a.name);
      return 0;
    });

    return result;
  }, [facilities, searchQuery, regionFilter, sortBy, matchesRegion]);

  // Reset trang về 1 khi search/filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, regionFilter, sortBy]);

  // Pagination
  const totalItems = filteredFacilities.length;
  const totalPages = Math.ceil(totalItems / CARDS_PER_PAGE);
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * CARDS_PER_PAGE;
    return filteredFacilities.slice(start, start + CARDS_PER_PAGE);
  }, [filteredFacilities, currentPage]);

  // Mock stats theo từng cơ sở (nếu có id)
  const getFacilityStats = (fId: number | string): FacilityShiftStats => {
    const numId = Number(fId) || 1;
    const baseStaff = 6 + (numId % 5);
    return {
      totalStaff: baseStaff,
      morningStaffCount: Math.ceil(baseStaff * 0.4),
      afternoonStaffCount: Math.ceil(baseStaff * 0.35),
      nightStaffCount: Math.max(1, baseStaff - Math.ceil(baseStaff * 0.4) - Math.ceil(baseStaff * 0.35)),
    };
  };

  // Tổng KPI toàn hệ thống
  const totalStaffCount = useMemo(() => {
    return facilities.reduce((sum, f) => sum + getFacilityStats(f.id).totalStaff, 0);
  }, [facilities]);

  const handleViewSchedule = (facilityId: number) => {
    navigate(`/manager/staff-schedule/facilities/${facilityId}`);
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giới thiệu */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Cấp 1 — Tổng quan Cơ sở
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Phân công nhân sự & Ca trực
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý lịch ca trực, phân công công việc tiếp nhận check-in, nghiệm thu trả kho và giải quyết sự cố kỹ thuật.
        </p>
      </div>

      {/* KPI Cards Thống kê toàn hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng cơ sở phân công</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{facilities.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng nhân viên vận hành</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalStaffCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4.5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Khung ca trực tiêu chuẩn</p>
            <p className="text-sm font-bold text-slate-800 mt-1">3 ca (Sáng · Chiều · Đêm)</p>
          </div>
        </div>
      </div>

      {/* Thanh Tìm kiếm, Filter tabs & Sắp xếp */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên cơ sở, địa chỉ..."
              className="w-full pl-9.5 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="NAME_ASC">Tên cơ sở (A-Z)</option>
              <option value="NAME_DESC">Tên cơ sở (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Region Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1.5 shrink-0">Khu vực:</span>
          {(
            [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'HN', label: 'Hà Nội' },
              { key: 'HCM', label: 'TP.HCM' },
              { key: 'DN', label: 'Đà Nẵng' },
              { key: 'OTHER', label: 'Khác' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRegionFilter(tab.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                regionFilter === tab.key
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trạng thái Loading / Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang tải danh sách cơ sở...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-800">Không thể tải dữ liệu</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Grid 3 cột Cards Cấp 1 */}
      {!loading && !error && (
        <>
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy cơ sở nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khu vực khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedFacilities.map((fac) => (
                <FacilityShiftSummaryCard
                  key={fac.id}
                  facility={fac}
                  stats={getFacilityStats(fac.id)}
                  onViewSchedule={handleViewSchedule}
                />
              ))}
            </div>
          )}

          {/* Phân trang khi > 12 items */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={CARDS_PER_PAGE}
            onPageChange={setCurrentPage}
            threshold={12}
          />
        </>
      )}
    </div>
  );
};
