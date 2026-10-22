// frontend/src/features/bom/pages/BomFacilityManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Warehouse,
  Download,
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
import { FacilityDetailDrawer } from '../components/FacilityDetailDrawer';
import { exportFacilityCsv } from '../utils/exportFacilityCsv';

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

  // Slide-over Drawer State
  const [detailFacility, setDetailFacility] = useState<FacilityListItem | null>(null);

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
          // Đồng bộ lại detailFacility nếu đang mở xem chi tiết
          setDetailFacility((prev) => {
            if (!prev) return null;
            return data.find((f) => f.id === prev.id) || null;
          });
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

  // Tính toán KPI số liệu
  const totalCount = facilities.length;
  const activeCount = useMemo(
    () => facilities.filter((f) => f.isActive).length,
    [facilities]
  );
  const inactiveCount = totalCount - activeCount;
  const activePercentage =
    totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

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
      if (errorObj.errorCode === 'FACILITY_CODE_ALREADY_EXISTS') {
        throw err;
      }
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
          : `Đã ngừng hoạt động cơ sở "${facility.name}"`
      );
      reloadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errorCode?: string };
      const msg =
        errorObj.errorCode === 'FACILITY_HAS_ACTIVE_CONTRACTS'
          ? 'Không thể ngừng hoạt động: Cơ sở đang còn hợp đồng thuê còn hiệu lực hoặc quá hạn!'
          : errorObj.message || 'Lỗi khi cập nhật trạng thái cơ sở';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-fade-in">
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

      {/* Header & Inline KPI Summary (Dạng phẳng chuẩn Enterprise) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý danh sách cơ sở
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng:{' '}
            <span className="font-semibold text-slate-700">{totalCount}</span>
            <span className="mx-2 text-slate-300">|</span>
            Đang hoạt động:{' '}
            <span className="font-semibold text-emerald-600">{activeCount}</span>{' '}
            <span className="text-slate-400">({activePercentage}%)</span>
            <span className="mx-2 text-slate-300">|</span>
            Ngừng hoạt động:{' '}
            <span className="font-semibold text-slate-600">{inactiveCount}</span>
          </p>
        </div>

        {/* Nút CTA "+ Thêm cơ sở mới" với drop shadow cam và micro-interaction hover */}
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-amber-500/25 hover:shadow-md hover:shadow-amber-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm cơ sở mới</span>
        </button>
      </div>

      {/* Toolbar "Thả nổi": Search bên trái, Tabs Filter + Export CSV + Refresh bên phải */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm tên, mã, hoặc địa chỉ..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Action Group: Tabs, Ghost Button Export CSV, Refresh */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
          {/* Tabs Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Đang HĐ ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white text-slate-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Ngừng HĐ ({inactiveCount})
            </button>
          </div>

          {/* Export CSV Button (Ghost / Outline Button) */}
          <button
            type="button"
            onClick={() => exportFacilityCsv(filteredFacilities)}
            disabled={filteredFacilities.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xuất danh sách cơ sở đang xem ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={reloadData}
            disabled={isLoading}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
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
        <div className="bg-white p-12 rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-3">
          <div className="inline-block p-3 rounded-lg bg-amber-50 text-amber-500 animate-pulse">
            <Warehouse className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            Đang tải dữ liệu danh sách cơ sở...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={reloadData}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-3">
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
          totalCount={totalCount}
          onViewDetail={(fac) => setDetailFacility(fac)}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
          isLoading={isLoading}
        />
      )}

      {/* Slide-over Drawer Xem Chi Tiết Cơ Sở */}
      <FacilityDetailDrawer
        facility={detailFacility}
        onClose={() => setDetailFacility(null)}
        onEdit={(fac) => {
          setDetailFacility(null);
          handleOpenEditModal(fac);
        }}
      />

      {/* Modal Add / Edit Facility */}
      {modalOpen && (
        <FacilityModal
          key={selectedFacility ? `edit-${selectedFacility.id}` : 'create-new'}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmitModal}
          initialData={selectedFacility}
          existingCodes={facilities.map((f) => f.code)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};
