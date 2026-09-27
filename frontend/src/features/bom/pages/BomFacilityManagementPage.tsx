import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Warehouse,
} from 'lucide-react';
import {
  fetchFacilities,
  createFacility,
  updateFacility,
  toggleFacilityStatus,
} from '@/api/facility';
import type {
  FacilityListItem,
  CreateFacilityRequest,
  UpdateFacilityRequest,
} from '@/types';
import { BomFacilityTable } from '../components/BomFacilityTable';
import { FacilityModal } from '../components/FacilityModal';

export const BomFacilityManagementPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    let ignore = false;
    fetchFacilities(searchKeyword, true)
      .then((data) => {
        if (!ignore) {
          setFacilities(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách cơ sở lưu trữ';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchKeyword, refreshKey]);

  const reloadData = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  // Lọc theo trạng thái
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (statusFilter === 'ACTIVE') return f.isActive;
      if (statusFilter === 'INACTIVE') return !f.isActive;
      return true;
    });
  }, [facilities, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedFacility(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (fac: FacilityListItem) => {
    setSelectedFacility(fac);
    setModalOpen(true);
  };

  const handleSubmitModal = async (
    data: CreateFacilityRequest | UpdateFacilityRequest
  ) => {
    setIsSubmitting(true);
    try {
      if (selectedFacility) {
        // Chỉnh sửa
        await updateFacility(selectedFacility.id, data as UpdateFacilityRequest);
        showToast(`Đã cập nhật thông tin cơ sở "${data.name}" thành công!`);
      } else {
        // Tạo mới
        await createFacility(data as CreateFacilityRequest);
        showToast(`Đã thêm mới cơ sở "${data.name}" thành công!`);
      }
      setModalOpen(false);
      reloadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errorCode?: string };
      const msg = errorObj.message || 'Thao tác không thành công, vui lòng thử lại';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (
    facility: FacilityListItem,
    targetStatus: boolean
  ) => {
    try {
      await toggleFacilityStatus(facility.id, targetStatus);
      showToast(
        targetStatus
          ? `Đã kích hoạt lại cơ sở "${facility.name}"`
          : `Đã ngừng khai thác cơ sở "${facility.name}"`
      );
      reloadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errorCode?: string };
      const msg =
        errorObj.errorCode === 'FACILITY_HAS_ACTIVE_CONTRACTS'
          ? 'Không thể ngừng khai thác: Cơ sở đang còn hợp đồng thuê còn hiệu lực hoặc quá hạn!'
          : errorObj.message || 'Lỗi khi cập nhật trạng thái cơ sở';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Quản lý danh sách cơ sở
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý thông tin, địa chỉ và trạng thái khai thác mạng lưới cơ sở lưu trữ
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm cơ sở mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc địa chỉ cơ sở..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
          />
        </div>

        {/* Filters and Refresh */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tất cả ({facilities.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Đang khai thác ({facilities.filter((f) => f.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white text-slate-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Ngừng ({facilities.filter((f) => !f.isActive).length})
            </button>
          </div>

          <button
            onClick={reloadData}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area: Loading / Error / Empty / Table */}
      {isLoading && facilities.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-amber-50 text-amber-500 animate-pulse">
            <Building2 className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            Đang tải dữ liệu danh sách cơ sở...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={reloadData}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            Thử lại
          </button>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Warehouse className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">
            Không tìm thấy cơ sở nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Không có cơ sở phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <BomFacilityTable
          facilities={filteredFacilities}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
          isLoading={isLoading}
        />
      )}

      {/* Modal Add / Edit Facility */}
      {modalOpen && (
        <FacilityModal
          key={selectedFacility ? `edit-${selectedFacility.id}` : 'create-new'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitModal}
          initialData={selectedFacility}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};
