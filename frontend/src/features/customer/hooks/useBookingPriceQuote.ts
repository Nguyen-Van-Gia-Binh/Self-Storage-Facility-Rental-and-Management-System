import { useState, useEffect, useMemo } from 'react';
import { calculateBookingPrice, type CalculatePriceResponse } from '@/api/reservation';
import { normalizeDiscountPercent } from '../utils/pricing';
import type { StorageUnit, UnitType } from '../types';

interface UseBookingPriceQuoteParams {
  facilityId: string;
  currentUnitType?: UnitType;
  selectedUnit: StorageUnit | null;
  durationMonths: number;
  depositMultiplier: number;
}

export function useBookingPriceQuote({
  facilityId,
  currentUnitType,
  selectedUnit,
  durationMonths,
  depositMultiplier,
}: UseBookingPriceQuoteParams) {
  const [serverPricing, setServerPricing] = useState<CalculatePriceResponse | null>(null);

  // 1. Gọi API tính giá thời gian thực từ Server (BR-PRI-01, US-BM-03.3)
  useEffect(() => {
    let isCurrent = true;
    const fId = parseInt(facilityId, 10);
    const utId = currentUnitType ? parseInt(String(currentUnitType.id), 10) : null;

    if (!fId || !utId || durationMonths <= 0) {
      setServerPricing(null);
      return;
    }

    calculateBookingPrice({
      facilityId: fId,
      unitTypeId: utId,
      months: durationMonths,
    })
      .then((data) => {
        if (isCurrent) {
          setServerPricing(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tính giá đặt chỗ từ server:', err);
        if (isCurrent) {
          setServerPricing(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [facilityId, currentUnitType?.id, durationMonths]);

  // 2. Tính toán bảng giá minh bạch (kết hợp Server pricing hoặc tính toán dự phòng)
  const priceCalculation = useMemo(() => {
    const basePrice =
      selectedUnit?.monthlyPrice && selectedUnit.monthlyPrice > 0
        ? selectedUnit.monthlyPrice
        : currentUnitType?.baseMonthlyPrice ?? 0;

    const grossRent = basePrice * durationMonths;
    const fallbackDeposit = Math.round((basePrice * depositMultiplier) / 1000) * 1000;

    if (serverPricing) {
      return {
        basePrice: serverPricing.monthlyPrice || basePrice,
        grossRent: serverPricing.rawRentTotal || grossRent,
        discountPercent: normalizeDiscountPercent(serverPricing.discountPercentage),
        discountAmount: serverPricing.discountAmount || 0,
        discountProgramName: serverPricing.discountProgramName || null,
        netRent: serverPricing.finalRentTotal || grossRent - (serverPricing.discountAmount || 0),
        depositAmount: serverPricing.depositAmount || fallbackDeposit,
        totalDue:
          serverPricing.totalDueToday ||
          (serverPricing.finalRentTotal || grossRent) + fallbackDeposit,
      };
    }

    return {
      basePrice,
      grossRent,
      discountPercent: 0,
      discountAmount: 0,
      discountProgramName: null,
      netRent: grossRent,
      depositAmount: fallbackDeposit,
      totalDue: grossRent + fallbackDeposit,
    };
  }, [selectedUnit, currentUnitType, durationMonths, depositMultiplier, serverPricing]);

  return {
    serverPricing,
    priceCalculation,
  };
}
