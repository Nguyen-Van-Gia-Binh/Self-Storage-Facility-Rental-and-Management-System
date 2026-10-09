// frontend/src/features/manager/pages/IncidentDashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getManagementSupportRequests } from '../api/staffAssignmentApi';
import {
  IncidentSummaryCard,
  type IncidentFacilityStats,
} from '../components/IncidentSummaryCard';
import { Pagination } from '../components/Pagination';

export const IncidentDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityStats, setFacilityStats] = useState<IncidentFacilityStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const loadData = async () => {
    setLoading(true);
    try {
      const [facList, tickets] = await Promise.all([
        fetchMyAssignedFacilities().catch(() => []),
        getManagementSupportRequests({}).catch(() => []),
      ]);

      setFacilities(facList);

      // Gom nhóm thống kê theo từng cơ sở
      const statsMap: Record<number, IncidentFacilityStats> = {};
      facList.forEach((f: any) => {
        statsMap[f.id] = {
          facilityId: f.id,
          facilityCode: f.code || `FAC-${f.id}`,
          facilityName: f.name,
          address: f.address,
          city: f.city,
          total: 0,
          pendingCount: 0,
          inProgressCount: 0,
          resolvedCount: 0,
          cancelledCount: 0,
        };
      });

      tickets.forEach((t) => {
        const facId = t.facilityId;
        if (!statsMap[facId]) {
          statsMap[facId] = {
            facilityId: facId,
            facilityCode: `FAC-${facId}`,
            facilityName: t.facilityName || `Cơ sở #${facId}`,
            total: 0,
            pendingCount: 0,
            inProgressCount: 0,
            resolvedCount: 0,
            cancelledCount: 0,
          };
        }

        statsMap[facId].total += 1;
        const st = t.status as string;
        if (st === 'NEW' || st === 'OPEN') {
          statsMap[facId].pendingCount += 1;
        } else if (st === 'ASSIGNED' || st === 'IN_PROGRESS') {
          statsMap[facId].inProgressCount += 1;
        } else if (st === 'RESOLVED' || st === 'CLOSED') {
          statsMap[facId].resolvedCount += 1;
        } else if (st === 'CANCELLED') {
          statsMap[facId].cancelledCount += 1;
        }
      });

      setFacilityStats(Object.values(statsMap));
    } catch (err) {
      console.error('Lỗi tải tổng quan sự cố cơ sở:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tổng hợp thống kê toàn hệ thống
  const globalKpis = useMemo(() => {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    facilityStats.forEach((s) => {
      total += s.total;
      pending += s.pendingCount;
      inProgress += s.inProgressCount;
      resolved += s.resolvedCount;
    });

    return { total, pending, inProgress, resolved };
  }, [facilityStats]);

  // Bộ lọc khu vực
  const filteredFacilities = useMemo(() => {
    return facilityStats.filter((f) => {
      // 1. Lọc từ khóa
      const matchKeyword =
        !searchKeyword.trim() ||
        f.facilityName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        f.facilityCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(searchKeyword.toLowerCase()));

      // 2. Lọc khu vực
      let matchRegion = true;
      if (selectedRegion === 'HN') {
        matchRegion = Boolean(
          f.city?.toLowerCase().includes('hà nội') ||
            f.address?.toLowerCase().includes('hà nội') ||
            f.facilityCode.includes('HN') ||
            f.facilityCode.includes('CG') ||
            f.facilityCode.includes('HBT')
        );
      } else if (selectedRegion === 'HCM') {
        matchRegion = Boolean(
          f.city?.toLowerCase().includes('hồ chí minh') ||
            f.address?.toLowerCase().includes('hồ chí minh') ||
            f.address?.toLowerCase().includes('tp.hcm') ||
            f.facilityCode.includes('Q1') ||
            f.facilityCode.includes('Q7') ||
            f.facilityCode.includes('BT') ||
            f.facilityCode.includes('TD')
        );
      } else if (selectedRegion === 'DN') {
        matchRegion = Boolean(
          f.city?.toLowerCase().includes('đà nẵng') ||
            f.address?.toLowerCase().includes('đà nẵng') ||
            f.facilityCode.includes('DN')
        );
      } else if (selectedRegion === 'OTHER') {
        matchRegion =
          !f.city?.toLowerCase().includes('hà nội') &&
          !f.city?.toLowerCase().includes('hồ chí minh') &&
          !f.city?.toLowerCase().includes('đà nẵng');
      }

      return matchKeyword && matchRegion;
    });
  }, [facilityStats, searchKeyword, selectedRegion]);

  // Phân trang
  const totalPages = Math.ceil(filteredFacilities.length / pageSize) || 1;
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFacilities.slice(start, start + pageSize);
  }, [filteredFacilities, currentPage, pageSize]);

  const handleSelectFacility = (facilityId: number) => {
    navigate(`/manager/incidents/facilities/${facilityId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Xử lý sự cố
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-100 text-amber-800">
              Cấp 1 · Cơ sở
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn cơ sở để kiểm tra và điều phối danh sách sự cố kỹ thuật phát sinh tại kho
          </p>
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

      {/* Global Stats Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-center gap-3.5 pt-2 sm:pt-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng sự cố</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{globalKpis.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Chờ tiếp nhận</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{globalKpis.pending}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Đang xử lý</p>
              <p className="text-xl font-bold text-orange-600 mt-0.5">{globalKpis.inProgress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Đã giải quyết</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{globalKpis.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm cơ sở & Tabs khu vực */}
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
            placeholder="Tìm theo tên hoặc mã cơ sở..."
            className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
          />
        </div>

        {/* Region Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'HN', label: 'Hà Nội' },
            { key: 'HCM', label: 'TP.HCM' },
            { key: 'DN', label: 'Đà Nẵng' },
            { key: 'OTHER', label: 'Khác' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedRegion(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedRegion === tab.key
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách cơ sở */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Đang tổng hợp dữ liệu sự cố các cơ sở...</p>
        </div>
      ) : paginatedFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-sm">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-500 mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn vùng miền khác
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedFacilities.map((facility) => (
            <IncidentSummaryCard
              key={facility.facilityId}
              data={facility}
              onSelect={handleSelectFacility}
            />
          ))}
        </div>
      )}

      {/* Pagination (Hiển thị khi tổng số cơ sở > 12) */}
      {filteredFacilities.length > pageSize && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFacilities.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
