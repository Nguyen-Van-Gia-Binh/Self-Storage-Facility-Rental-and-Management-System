import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { fetchFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityFilter } from '../components/FacilityFilter';

function extractDistricts(list: FacilityListItem[]): string[] {
  const set = new Set<string>();
  const re = /(Quận|Huyện)\s[\wÀ-ỹ]+/u;
  list.forEach((f) => {
    const m = f.address.match(re);
    if (m) set.add(m[0]);
  });
  return Array.from(set).sort();
}

export const FacilityCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchFacilities(debounced || undefined)
      .then((data) => {
        if (!ignore) {
          setFacilities(data);
          setError('');
        }
      })
      .catch((e: { message?: string }) => {
        if (!ignore) {
          setError(e?.message ?? 'Không thể tải danh sách cơ sở.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [debounced]);

  const districts = useMemo(() => extractDistricts(facilities), [facilities]);

  const toggleDistrict = useCallback((d: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setKeyword('');
    setSelectedDistricts([]);
  }, []);

  const displayed = useMemo(() => {
    if (selectedDistricts.length === 0) return facilities;
    return facilities.filter((f) => selectedDistricts.some((d) => f.address.includes(d)));
  }, [facilities, selectedDistricts]);

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-teal-900 to-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 text-teal-300 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" /> Hệ thống kho tự quản SmartStorage
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Tìm ô kho phù hợp<br className="hidden sm:block" /> gần bạn nhất
          </h1>
          <p className="text-teal-200 text-sm leading-relaxed max-w-xl mx-auto">
            Duyệt qua các cơ sở kho tự quản tại TP.HCM. Không cần đăng nhập để xem giá và kiểm tra phòng trống.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <FacilityFilter
          keyword={keyword}
          onKeywordChange={setKeyword}
          districts={districts}
          selectedDistricts={selectedDistricts}
          onToggleDistrict={toggleDistrict}
          onClear={clearFilters}
        />

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setDebounced((d) => d + ' ')}
              className="mt-3 text-xs text-teal-600 underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div id="facility-empty-state" className="text-center py-20 space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">Không tìm thấy cơ sở phù hợp</p>
            <p className="text-sm text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc khu vực.</p>
            <button
              id="btn-clear-filters-empty"
              onClick={clearFilters}
              className="mt-2 text-sm text-teal-600 underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <>
            <p className="text-sm text-slate-500">
              Tìm thấy <span className="font-semibold text-slate-800">{displayed.length}</span> cơ sở
            </p>
            <div id="facility-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayed.map((f) => (
                <FacilityCard
                  key={f.id}
                  facility={f}
                  onViewUnits={(id) => navigate(`/facilities/${id}`)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
