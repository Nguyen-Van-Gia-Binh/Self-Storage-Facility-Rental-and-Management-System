// frontend/src/features/manager/pages/FacilityListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, RefreshCw, AlertCircle, Layers } from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchStorageUnits } from '@/api/unit';
import type { FacilityListItem } from '@/types';
import { FacilityCard } from '../components/FacilityCard';
import type { FacilityStats } from '../components/FacilityCard';

export const FacilityListPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, FacilityStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
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

      // Tải song song thống kê ô kho cho từng cơ sở
      const statsPromises = list.map(async (fac) => {
        try {
          const res = await fetchStorageUnits(fac.id, { size: 200 });
          const units = res?.content || [];
          const totalUnits = units.length;
          const occupiedUnits = units.filter((u) => u.status === 'OCCUPIED').length;
          const availableUnits = units.filter((u) => u.status === 'AVAILABLE').length;
          const maintenanceUnits = units.filter((u) => u.status === 'MAINTENANCE').length;
          const exploitable = totalUnits - units.filter((u) => u.status === 'OUT_OF_SERVICE').length;
          const occupancyRate = exploitable > 0 ? (occupiedUnits / exploitable) * 100 : 0;

          return {
            id: fac.id,
            stats: {
              totalUnits,
              occupiedUnits,
              availableUnits,
              maintenanceUnits,
              occupancyRate,
            },
          };
        } catch {
          return {
            id: fac.id,
            stats: {
              totalUnits: 0,
              occupiedUnits: 0,
              availableUnits: 0,
              maintenanceUnits: 0,
              occupancyRate: 0,
            },
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const newStatsMap: Record<number, FacilityStats> = {};
      statsResults.forEach(({ id, stats }) => {
        newStatsMap[id] = stats;
      });
      setStatsMap(newStatsMap);
    } catch (err) {
      console.error('Lỗi khi tải danh sách cơ sở:', err);
      setError('Không thể tải danh sách cơ sở phân công.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFacilities = facilities.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(term) ||
      f.code.toLowerCase().includes(term) ||
      (f.address && f.address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản lý ô kho — Chọn Cơ sở (Cấp 1)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              FM-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn cơ sở cần quản lý để bắt đầu xem danh mục loại ô kho và ô kho vật lý (Mô hình Drill-down)
          </p>
        </div>

        {/* Toolbar: Tìm kiếm & Làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Facility Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `Không có cơ sở nào khớp với từ khóa "${searchTerm}". Vui lòng thử lại.`
              : 'Bạn chưa được phân công quản lý cơ sở nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              stats={statsMap[facility.id]}
              onClick={() => navigate(`/manager/facilities/${facility.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
