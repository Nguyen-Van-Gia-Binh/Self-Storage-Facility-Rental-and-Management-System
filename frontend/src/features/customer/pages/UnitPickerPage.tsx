import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { formatDateVN, resolveSizeCategory, isClimateUnitType, mapApiUnitsToStorageUnits } from '../utils/unitPickerHelpers';
import { fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { getMyReservationsApi } from '@/api/reservation';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { tokenStorage } from '@/utils/tokenStorage';
import type { StorageUnit } from '../types';
import { RentDurationCard } from '../components/RentDurationCard';
import { UnitPickerSidebar } from '../components/UnitPickerSidebar';
import { StorageTypeTabs } from '../components/StorageTypeTabs';
import { UnitPickerModals } from '../components/UnitPickerModals';
import { UnitTypeAccordionList } from '../components/UnitTypeAccordionList';
import { useRentalDuration } from '../hooks/useRentalDuration';
import { useUnitPickerCatalog } from '../hooks/useUnitPickerCatalog';
import { useBookingPriceQuote } from '../hooks/useBookingPriceQuote';

// Re-export helper để tương thích với các module khác
export { isClimateUnitType, formatDateVN, resolveSizeCategory, mapApiUnitsToStorageUnits };

export const UnitPickerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityParam = searchParams.get('facility');
  const initialTypeId = searchParams.get('type');
  const initialMonthsParam = parseInt(searchParams.get('months') || '', 10);
  const initialStartDateParam = searchParams.get('startDate');

  // 1. Quản lý thời gian thuê dự kiến (Ngày bắt đầu & Số tháng thuê)
  const {
    todayStr,
    startDate,
    setStartDate,
    durationMonths,
    setDurationMonths,
    quickMilestones,
    isCustomMode,
    setIsCustomMode,
    calculatedEndDate,
  } = useRentalDuration({
    initialStartDateParam,
    initialMonthsParam,
  });

  // 2. Đọc hệ số cọc từ BOM Policy (BR-DEP-01, ISS-119)
  const policy = useActivePolicy();
  const depositMultiplier = policy?.depositMultiplier ?? 1;
  const depositMultiplierLabel = Number.isInteger(depositMultiplier)
    ? String(depositMultiplier)
    : depositMultiplier.toFixed(1).replace(/\.0$/, '');

  // 3. Tải danh mục cơ sở, ô kho & trạng thái khả dụng thời gian thực
  const {
    loading,
    currentFacility,
    unitTypes,
    availabilityMap,
    loadingAvailability,
    facilityInactiveModalOpen,
    storageType,
    selectedTypeId,
    expandedTypeId,
    selectedSize,
    availableTypes,
    standardTypesCount,
    climateTypesCount,
    currentUnitType,
    displayFacilityUnits,
    selectedUnit,
    handleSelectType,
    handleSelectStorageType,
    handleSelectUnitOnGrid,
  } = useUnitPickerCatalog({
    facilityParam,
    initialTypeId,
    startDate,
    durationMonths,
  });

  // 4. Bảng giá minh bạch tính từ Server Backend (BR-PRI-01, US-BM-03.3)
  const { priceCalculation } = useBookingPriceQuote({
    facilityId: currentFacility?.id,
    currentUnitType,
    selectedUnit,
    durationMonths,
    depositMultiplier,
  });

  // 5. Trạng thái các Modal cảnh báo & xác thực an ninh
  const [unitUnavailableModal, setUnitUnavailableModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [pendingLimitModal, setPendingLimitModal] = useState<{
    isOpen: boolean;
    pendingReservation: any | null;
  }>({
    isOpen: false,
    pendingReservation: null,
  });
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // 6. Xử lý đặt chỗ & kiểm tra tính sẵn sàng thời gian thực (ISS-76, ISS-99)
  const handleProceedToBooking = async () => {
    const targetUnit = selectedUnit;
    if (!targetUnit) {
      // Nếu chưa chọn ô kho cụ thể trên sơ đồ, tự động chọn ô kho trống đầu tiên
      const firstAvailable = displayFacilityUnits.find(
        (u) =>
          u.status === 'AVAILABLE' &&
          u.storageType === storageType &&
          (!selectedTypeId || u.unitTypeId === selectedTypeId)
      );
      if (firstAvailable) {
        handleProceedToBookingWithUnit(firstAvailable);
      } else {
        setUnitUnavailableModal({
          isOpen: true,
          title: 'Vui lòng chọn 1 ô kho',
          message: 'Quý khách vui lòng nhấp chọn một ô kho còn trống trên sơ đồ mặt bằng để tiếp tục đặt chỗ.',
        });
      }
      return;
    }
    handleProceedToBookingWithUnit(targetUnit);
  };

  const handleProceedToBookingWithUnit = async (targetUnit: StorageUnit) => {
    const listedPrice = (targetUnit.monthlyPrice && targetUnit.monthlyPrice > 0)
      ? targetUnit.monthlyPrice
      : (currentUnitType?.baseMonthlyPrice ?? 0);
    if (listedPrice <= 0) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Loại ô kho chưa niêm yết giá',
        message: 'Loại ô kho này chưa được niêm yết giá chính thức nên tạm thời chưa thể đặt chỗ. Quý khách vui lòng chọn loại kho khác.',
      });
      return;
    }

    const fId = parseInt(currentFacility.id, 10);
    if (isNaN(fId)) return;

    setIsConfirming(true);
    try {
      // 1. Kiểm tra giới hạn 1 đơn giữ chỗ PENDING_PAYMENT (BR-RES-02)
      if (tokenStorage.getAccessToken()) {
        try {
          const myReservations = await getMyReservationsApi();
          const activePending = myReservations?.find((r) => {
            if (r.status !== 'PENDING_PAYMENT') return false;
            if (!r.holdExpiresAt) return true;
            return new Date(r.holdExpiresAt).getTime() > Date.now();
          });

          if (activePending) {
            setPendingLimitModal({
              isOpen: true,
              pendingReservation: activePending,
            });
            return;
          }
        } catch (err) {
          console.error('Không thể kiểm tra đơn giữ chỗ hiện tại:', err);
        }
      }

      // 2. Realtime Database Unit Availability Validation on Confirm (ISS-76)
      const liveUnitsPage = await fetchStorageUnitsApi(fId, {
        startDate,
        rentalMonths: durationMonths,
        size: 200,
      });
      const liveUnits = liveUnitsPage?.content || [];
      const currentLiveUnit = liveUnits.find((u) => String(u.id) === String(targetUnit.id));

      if (currentLiveUnit) {
        const liveStatus = (currentLiveUnit.status || 'AVAILABLE').toUpperCase();
        if (liveStatus === 'MAINTENANCE') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đang tạm ngừng hoạt động / Bảo trì',
            message: `Ô kho ${targetUnit.unitNumber} hiện đang được bảo trì hoặc kiểm tra kỹ thuật. Quý khách vui lòng chọn ô kho khác.`,
          });
          return;
        }
        if (liveStatus === 'RESERVED') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đã có người giữ chỗ',
            message: `Ô kho ${targetUnit.unitNumber} vừa được người khác giữ chỗ. Quý khách vui lòng chọn ô kho khác.`,
          });
          return;
        }
        if (liveStatus === 'OCCUPIED' || liveStatus === 'OVERDUE' || liveStatus === 'LOCKED') {
          setUnitUnavailableModal({
            isOpen: true,
            title: 'Ô kho đã có người thuê',
            message: `Ô kho ${targetUnit.unitNumber} đã có khách hàng thuê. Quý khách vui lòng chọn ô kho khác còn trống.`,
          });
          return;
        }
      }

      const typeIdToPass = targetUnit.unitTypeId || (currentUnitType ? currentUnitType.id : (unitTypes[0]?.id || '1'));

      const params = new URLSearchParams({
        facility: String(currentFacility.id),
        type: String(typeIdToPass),
        unit: String(targetUnit.id),
        unitNumber: targetUnit.unitNumber,
        startDate,
        months: String(durationMonths),
      });

      navigate(`/customer/booking?${params.toString()}`);
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Đang tải thông tin cơ sở và sơ đồ ô kho...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* TOP BAR: FACILITY INFO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-200/60">
        <div>
          <Link
            to="/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Chọn cơ sở khác</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a1614] tracking-tight">
            {currentFacility.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{currentFacility.address || 'Hệ thống kho tự quản thông minh'}</span>
          </div>
        </div>
      </div>

      {/* 2 COLUMNS LAYOUT: LEFT (Controls & Matrix Grid) + RIGHT (Sticky Summary Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================== CỘT TRÁI: 2 THẺ TỐI GIẢN (8 cols) ==================== */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. THỜI GIAN THUÊ (RentDurationCard) */}
          <RentDurationCard
            startDate={startDate}
            todayStr={todayStr}
            onStartDateChange={setStartDate}
            calculatedEndDate={calculatedEndDate}
            durationMonths={durationMonths}
            onDurationChange={setDurationMonths}
            isCustomMode={isCustomMode}
            setIsCustomMode={setIsCustomMode}
            quickMilestones={quickMilestones}
            discountAmount={priceCalculation.discountAmount}
            discountPercent={priceCalculation.discountPercent}
            discountProgramName={priceCalculation.discountProgramName}
            formatDateVN={formatDateVN}
          />

          {/* 2. CHỌN LOẠI KHO & KÍCH THƯỚC (Progressive Disclosure) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 block">
                2. Chọn loại kho & Kích thước
              </span>
              {loadingAvailability && (
                <span className="text-[11px] text-brand-600 flex items-center gap-1 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kiểm tra ô trống...</span>
                </span>
              )}
            </div>

            {/* Bước 2.1: Môi trường kho tabs (StorageTypeTabs) */}
            <StorageTypeTabs
              storageType={storageType}
              onSelectStorageType={handleSelectStorageType}
              standardTypesCount={standardTypesCount}
              climateTypesCount={climateTypesCount}
            />


            {/* Bước 2.2: Danh sách Kích thước dạng List Card Rows kèm Accordion Sơ đồ ô kho */}
            {!storageType ? (
              <div className="py-8 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-2xl block">📦</span>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  Vui lòng chọn loại kho bạn cần ở trên
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Chọn <strong>Kho Tiêu Chuẩn</strong> hoặc <strong>Kho Máy Lạnh</strong> để hệ thống hiển thị danh sách kích thước và các ô kho còn trống.
                </p>
              </div>
            ) : (
              <UnitTypeAccordionList
              availableTypes={availableTypes}
              selectedTypeId={selectedTypeId}
              expandedTypeId={expandedTypeId}
              availabilityMap={availabilityMap}
              displayFacilityUnits={displayFacilityUnits}
              selectedUnit={selectedUnit}
              onSelectType={handleSelectType}
              onSelectUnitOnGrid={handleSelectUnitOnGrid}
            />
            )}

          </div>

        </div>

        {/* ==================== CỘT PHẢI: HÓA ĐƠN TÓM TẮT ĐẶT CHỖ (MINI INVOICE - 4 cols) ==================== */}
        <div className="lg:col-span-4">
          <UnitPickerSidebar
            facilityName={currentFacility.name}
            selectedUnit={selectedUnit}
            storageType={storageType}
            selectedSize={selectedSize}
            areaM2={currentUnitType?.areaM2}
            startDate={startDate}
            calculatedEndDate={calculatedEndDate}
            durationMonths={durationMonths}
            depositMultiplierLabel={depositMultiplierLabel}
            priceCalculation={priceCalculation}
            isConfirming={isConfirming}
            formatDateVN={formatDateVN}
            onProceedToBooking={handleProceedToBooking}
          />
        </div>

      </div>

      {/* 3 MODALS AN NINH (ISS-75, ISS-76, ISS-99) */}
      <UnitPickerModals
        facilityInactiveModalOpen={facilityInactiveModalOpen}
        onCloseFacilityInactive={() => navigate('/customer')}
        unitUnavailableModal={unitUnavailableModal}
        onCloseUnitUnavailable={() => setUnitUnavailableModal((prev) => ({ ...prev, isOpen: false }))}
        pendingLimitModal={pendingLimitModal}
        onClosePendingLimit={() => setPendingLimitModal({ isOpen: false, pendingReservation: null })}
        onPayPendingReservation={(rsv) => {
          setPendingLimitModal({ isOpen: false, pendingReservation: null });
          if (rsv) {
            navigate(`/customer/booking?facility=${rsv.facilityId}&reservationId=${rsv.id}`);
          }
        }}
      />

    </div>
  );
};
