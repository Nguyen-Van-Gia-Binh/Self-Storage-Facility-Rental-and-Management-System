// frontend/src/features/manager/pages/IncidentDashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  RefreshCw,
  AlertCircle,
  Compass,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { Pagination } from '../components/Pagination';
import { extractProvinceName } from '../utils/facilityTheme';
import { getFacilityRegion, type RegionFilter } from './FacilityListPage';

const REGION_TABS: { label: string; value: RegionFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hà Nội', value: 'HN' },
  { label: 'TP.HCM', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Khác', value: 'OTHER' },
];

export type SortOption = 'name-asc' | 'name-desc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Tên cơ sở (A → Z)', value: 'name-asc' },
  { label: 'Tên cơ sở (Z → A)', value: 'name-desc' },
];

const DEFAULT_PAGE_SIZE = 12;

export const IncidentDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const list = await fetchMyAssignedFacilities();
      setFacilities(list);
    } catch (err) {
      console.error('Lỗi khi tải danh sách cơ sở xử lý sự cố:', err);
      setError('Không thể tải danh sách cơ sở được phân công.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset về trang 1 khi đổi bộ lọc, từ khóa hoặc pageSize
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, sortBy, pageSize]);

  // Đếm số lượng cơ sở theo từng khu vực
  const regionCounts = useMemo(() => {
    const counts: Record<RegionFilter, number> = {
      ALL: facilities.length,
      HN: 0,
      HCM: 0,
      DN: 0,
      OTHER: 0,
    };
    facilities.forEach((f) => {
      const region = getFacilityRegion(f);
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [facilities]);

  // Thống kê cấp cao mạng lưới cơ sở (Executive Network Hub)
  const networkOverview = useMemo(() => {
    const total = facilities.length;
    const active = facilities.filter((f) => f.isActive).length;
    const provinces = new Set(facilities.map((f) => extractProvinceName(f.address, f.name)));
    return {
      total,
      active,
      provinceCount: provinces.size,
    };
  }, [facilities]);

  // Lọc và sắp xếp dữ liệu
  const processedFacilities = useMemo(() => {
    const filtered = facilities.filter((f) => {
      if (selectedRegion !== 'ALL' && getFacilityRegion(f) !== selectedRegion) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(term) ||
        f.code.toLowerCase().includes(term) ||
        (f.address && f.address.toLowerCase().includes(term))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'vi');
      }
      return b.name.localeCompare(a.name, 'vi');
    });
  }, [facilities, selectedRegion, searchTerm, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(processedFacilities.length / pageSize) || 1;
  const paginatedFacilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedFacilities.slice(startIndex, startIndex + pageSize);
  }, [processedFacilities, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Toolbar tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xử lý sự cố — Danh sách Cơ sở
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chọn cơ sở để kiểm tra và điều phối danh sách sự cố kỹ thuật phát sinh tại kho
          </p>
        </div>

        {/* Toolbar: Tìm kiếm cơ sở & Nút làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Executive Network Hub Bar: Tóm tắt cấp cao quy mô chuỗi cơ sở */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Cơ sở phân công</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold num text-slate-900">{networkOverview.total}</span>
              <span className="text-xs text-slate-400">điểm lưu trữ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 block">Vận hành mạng lưới</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold num text-emerald-700">
                {networkOverview.active} / {networkOverview.total}
              </span>
              <span className="text-xs text-emerald-600 font-medium">sẵn sàng</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-blue-700 block">Độ phủ địa bàn</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold num text-blue-700">
                {networkOverview.provinceCount}
              </span>
              <span className="text-xs text-blue-600 font-medium">tỉnh / thành phố</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Khu vực & Dropdown Sắp xếp + Layout Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs Khu vực */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {REGION_TABS.map((tab) => {
            const isActive = selectedRegion === tab.value;
            const count = regionCounts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedRegion(tab.value)}
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

        {/* Toolbar Bên Phải: Sắp xếp + Switcher Lưới / Bảng */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Dropdown Sắp xếp */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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

      {/* Danh sách Cơ sở: Lưới Thẻ hoặc Bảng Danh Mục */}
      {loading ? (
        <div className="h-32 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
      ) : processedFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRegion !== 'ALL'
              ? 'Không có cơ sở nào phù hợp với bộ lọc và từ khóa tìm kiếm.'
              : 'Bạn chưa được phân công quản lý cơ sở nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Tên cơ sở</th>
                      <th className="py-3 px-4">Địa chỉ</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFacilities.map((facility) => (
                        <tr
                          key={facility.id}
                          onClick={() => navigate(`/manager/incidents/facilities/${facility.id}`)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{facility.name}</div>
                            <div className="font-mono text-[11px] text-slate-500">{facility.code}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {facility.address || 'Chưa cập nhật địa chỉ'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {facility.phone || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${facility.isActive ? 'bg-brand-500' : 'bg-slate-300'}`} />
                              {facility.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/manager/incidents/facilities/${facility.id}`);
                              }}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                            >
                              Sự cố
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          {/* Phân trang */}
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={processedFacilities.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};
