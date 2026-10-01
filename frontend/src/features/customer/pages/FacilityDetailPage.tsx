import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { fetchFacilityById, fetchUnitTypes } from '@/api/facility';
import type { FacilityDetail, UnitTypeCatalog } from '@/types';
import { UnitTypeCard } from '../components/UnitTypeCard';

export const FacilityDetailPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<FacilityDetail | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitTypeCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const id = Number(facilityId);

  useEffect(() => {
    if (!id || isNaN(id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('ID cơ sở không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([fetchFacilityById(id), fetchUnitTypes(id)])
      .then(([fac, uts]) => {
        setFacility(fac);
        setUnitTypes(uts.filter((u) => u.isActive));
      })
      .catch((e: { message?: string; status?: number }) => {
        setError(
          e?.status === 404
            ? 'Cơ sở không tồn tại hoặc đã bị xóa.'
            : e?.message ?? 'Không thể tải thông tin cơ sở.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <p className="text-slate-700 font-medium">{error || 'Không tìm thấy cơ sở.'}</p>
        <button
          id="btn-back-to-catalog-error"
          onClick={() => navigate('/customer')}
          className="text-sm text-teal-600 underline"
        >
          Quay lại danh sách cơ sở
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          id="btn-back-to-catalog"
          onClick={() => navigate('/customer')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách cơ sở
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Facility header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-800 rounded-2xl p-8 text-white">
          <div className="space-y-3">
            {!facility.isActive && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> Cơ sở đang ngừng hoạt động
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{facility.name}</h1>
            <div className="space-y-2 text-teal-100 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
                {facility.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400" />
                {facility.phone}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Giờ mở cửa: {facility.openingHours}
              </p>
            </div>
          </div>
          {facility.description && (
            <p className="mt-4 pt-4 border-t border-white/10 text-sm text-teal-100/80 leading-relaxed max-w-prose">
              {facility.description}
            </p>
          )}
        </div>

        {/* Warning banner when facility is inactive */}
        {!facility.isActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm sm:text-base text-amber-950">Cơ sở hiện đang tạm ngừng hoạt động</h3>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Cơ sở này tạm thời không nhận đặt chỗ mới. Quý khách vui lòng tham khảo các cơ sở khác đang hoạt động trong hệ thống SmartStorage.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-colors shadow-xs"
            >
              Xem danh sách cơ sở khác
            </button>
          </div>
        )}

        {/* Unit types */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Các loại ô kho tại cơ sở</h2>
            <p className="text-sm text-slate-500 mt-1">
              Chọn loại ô kho phù hợp và kiểm tra phòng trống theo thời gian thuê dự kiến.
            </p>
          </div>

          {unitTypes.length === 0 ? (
            <div id="unit-type-empty-state" className="text-center py-16 text-slate-400">
              <p className="text-sm">Chưa có loại ô kho nào đang mở tại cơ sở này.</p>
            </div>
          ) : (
            <div id="unit-type-list" className="space-y-4">
              {unitTypes.map((ut) => (
                <UnitTypeCard
                  key={ut.id}
                  unitType={ut}
                  facilityId={id}
                  isFacilityActive={facility.isActive}
                  onBook={(unitTypeId) => {
                    if (!facility.isActive) return;
                    navigate(`/customer/units?facility=${id}&type=${unitTypeId}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
