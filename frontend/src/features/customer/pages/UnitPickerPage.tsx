import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { formatDateVN, resolveSizeCategory, isClimateUnitType, mapApiUnitsToStorageUnits } from '../utils/unitPickerHelpers';
import { getMyReservationsApi } from '@/api/reservation';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { tokenStorage } from '@/utils/tokenStorage';
import { RentDurationCard } from '../components/RentDurationCard';
import { UnitPickerSidebar } from '../components/UnitPickerSidebar';
import { StorageTypeTabs } from '../components/StorageTypeTabs';
import { UnitPickerModals } from '../components/UnitPickerModals';
import { WaitlistRegistrationModal } from '../components/WaitlistRegistrationModal';
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
  const initialStorageType = searchParams.get('storageType');
  const initialSize = searchParams.get('size');
  const initialMonthsParam = parseInt(searchParams.get('months') || '', 10);
  const initialStartDateParam = searchParams.get('startDate');

  // 1. Quản lý thời gian thuê dự kiến (Ngày bắt đầu & Số tháng thuê)
  const {
    todayStr,
    maxBookingDate,
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
    availabilityMap,
    loadingAvailability,
    facilityInactiveModalOpen,
    storageType,
    selectedTypeId,
    selectedSize,
    availableTypes,
    currentUnitType,
    selectedUnit,
    handleSelectType,
    handleSelectStorageType,
    standardTypesCount,
    climateTypesCount,
  } = useUnitPickerCatalog({
    facilityParam,
    initialTypeId,
    initialStorageType,
    initialSize,
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
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const selectedSlots = selectedTypeId ? availabilityMap[selectedTypeId]?.availableSlots : undefined;
  const typeFull = typeof selectedSlots === 'number' && selectedSlots <= 0;

  const handleProceedToBooking = async () => {
    if (typeFull) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Hết chỗ',
        message: 'Hạng kho này đã hết chỗ trong kỳ thuê đã chọn. Quý khách vui lòng chọn hạng khác hoặc đổi ngày nhận.',
      });
      return;
    }
    if (!selectedTypeId || !currentUnitType) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Vui lòng chọn loại kho',
        message: '',
      });
      return;
    }
    if (!currentUnitType.baseMonthlyPrice || currentUnitType.baseMonthlyPrice <= 0) {
      setUnitUnavailableModal({
        isOpen: true,
        title: 'Loại ô kho chưa niêm yết giá',
        message: 'Loại kho này đang cập nhật bảng giá, vui lòng chọn loại khác.',
      });
      return;
    }
    if (!currentFacility?.id) return;

    setIsConfirming(true);
    try {
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

      const params = new URLSearchParams({
        facility: String(currentFacility.id),
        type: String(selectedTypeId),
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
        <div className="lg:col-span-8 w-full space-y-6">

          {/* 1. THỜI GIAN THUÊ (RentDurationCard) */}
          <RentDurationCard
            startDate={startDate}
            todayStr={todayStr}
            maxDate={maxBookingDate}
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
            onOpenWaitlist={() => setIsWaitlistModalOpen(true)}
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

            {/* Bước 2.1: Môi trường kho tabs (Kho Tiêu Chuẩn vs Kho Máy Lạnh) */}
            <StorageTypeTabs
              storageType={storageType}
              onSelectStorageType={handleSelectStorageType}
              standardTypesCount={standardTypesCount}
              climateTypesCount={climateTypesCount}
            />

            {/* Bước 2.2: Danh sách Kích thước theo loại kho đã chọn */}
            {!storageType ? (
              <div className="py-8 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-2xl block">📦</span>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  Vui lòng chọn loại kho bạn cần ở trên
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Chọn <strong>Kho Tiêu Chuẩn</strong> hoặc <strong>Kho Máy Lạnh</strong> để xem danh sách kích thước và số lượng ô kho còn trống.
                </p>
              </div>
            ) : (
              <UnitTypeAccordionList
                availableTypes={availableTypes}
                selectedTypeId={selectedTypeId}
                availabilityMap={availabilityMap}
                onSelectType={handleSelectType}
              />
            )}

          </div>

        </div>

        {/* ==================== CỘT PHẢI: HÓA ĐƠN TÓM TẮT ĐẶT CHỖ (MINI INVOICE - 4 cols) ==================== */}
        <div className="lg:col-span-4">
          <UnitPickerSidebar
            facilityName={currentFacility.name}
            selectedUnit={selectedUnit}
            unitTypeName={currentUnitType?.name}
            typeFull={typeFull}
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
        onOpenWaitlist={() => setIsWaitlistModalOpen(true)}
      />

      {currentFacility && currentUnitType && (
        <WaitlistRegistrationModal
          isOpen={isWaitlistModalOpen}
          onClose={() => setIsWaitlistModalOpen(false)}
          facilityId={Number(currentFacility.id)}
          facilityName={currentFacility.name}
          unitTypeId={Number(currentUnitType.id)}
          unitTypeName={currentUnitType.name}
          initialStartDate={startDate}
          initialRentalMonths={durationMonths}
        />
      )}

    </div>
  );
};
