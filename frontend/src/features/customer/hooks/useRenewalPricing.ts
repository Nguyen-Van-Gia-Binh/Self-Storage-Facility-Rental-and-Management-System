import { useEffect, useMemo, useState } from 'react';
import { getRenewalQuote, type RenewalQuote } from '@/api/customerRentals';
import { calculateRenewalPricing, calculateExtendedEndDate } from '../utils/renewalPricing';
import type { RentedContract } from '../types';

interface UseRenewalPricingParams {
  contract: RentedContract | null;
  renewalMonths: number;
}

/**
 * Khối tính giá & báo giá gia hạn (BR-REN-03/06/07, BR-DEP-01, BR-REN-04).
 * - Fetch báo giá chính thức từ Backend Policy Service (POST /contracts/{id}/renewals/quote)
 * - Phát hiện xung đột lịch đặt trước (CAPACITY_NOT_AVAILABLE) cho Conflict View
 * - Tính dự phòng theo `calculateRenewalPricing` khi quote chưa về / lỗi
 * Tách từ `RenewalPage` để page chỉ còn giữ navigation + JSX.
 */
export function useRenewalPricing({ contract, renewalMonths }: UseRenewalPricingParams) {
  const [renewalQuote, setRenewalQuote] = useState<RenewalQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [isCapacityConflict, setIsCapacityConflict] = useState(false);
  const [capacityConflictMessage, setCapacityConflictMessage] = useState('');

  // Thiết lập Conflict View (dùng cả bởi hook payment khi init PayOS gặp CAPACITY_NOT_AVAILABLE)
  const setCapacityConflict = (message: string) => {
    setIsCapacityConflict(true);
    setCapacityConflictMessage(
      message || 'Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo.',
    );
  };

  // Tải báo giá gia hạn chính thức từ Backend Policy Service (POST /contracts/{id}/renewals/quote)
  useEffect(() => {
    if (!contract) return;
    let isMounted = true;
    const fetchQuote = async () => {
      setLoadingQuote(true);
      setIsCapacityConflict(false);
      try {
        const numId = parseInt(contract.id, 10);
        const rawId = contract.id.replace(/\D/g, '');
        const refId = !isNaN(numId) && numId > 0 ? numId : (rawId ? parseInt(rawId, 10) : 1);
        const quote = await getRenewalQuote(refId, renewalMonths);
        if (isMounted) {
          setRenewalQuote(quote);
        }
      } catch (err: any) {
        console.warn('Lỗi lấy báo giá gia hạn từ backend:', err);
        const code = err?.errorCode || err?.data?.errorCode;
        const msg = err?.message || err?.data?.message || '';
        if (code === 'CAPACITY_NOT_AVAILABLE' || msg.includes('đặt trước') || msg.includes('CAPACITY_NOT_AVAILABLE')) {
          if (isMounted) {
            setCapacityConflict(msg);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingQuote(false);
        }
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [contract, renewalMonths]);

  // Tính toán ngày kết thúc mới chính xác
  const newEndDate = useMemo(() => {
    if (renewalQuote?.newEndDateExclusive) return renewalQuote.newEndDateExclusive;
    if (!contract) return '';
    return calculateExtendedEndDate(contract.endDate, renewalMonths);
  }, [contract, renewalMonths, renewalQuote]);

  // Tính toán chi phí tài chính minh bạch theo BR-REN-03, BR-REN-06, BR-REN-07 & BR-DEP-01
  const pricing = useMemo(() => {
    if (!contract) {
      return {
        monthlyRent: 0,
        rawRent: 0,
        discountRate: 0,
        discountAmount: 0,
        netRent: 0,
        overdueFee: 0,
        extraDeposit: 0,
        finalTotal: 0,
        renewalMonths: 0,
      };
    }

    if (renewalQuote) {
      const rawRent = renewalQuote.monthlyPrice * renewalQuote.renewalMonths;
      const netRent = renewalQuote.totalRenewalFee;
      const overdueFee = renewalQuote.overdueFeeSettled || 0;
      const discountAmount = Math.max(0, rawRent - netRent);
      const discountRate = rawRent > 0 ? Math.round((discountAmount / rawRent) * 100) : 0;
      return {
        monthlyRent: renewalQuote.monthlyPrice,
        rawRent,
        discountRate,
        discountAmount,
        netRent,
        overdueFee,
        extraDeposit: 0, // BR-DEP-01: Cọc được bảo lưu từ hợp đồng gốc
        finalTotal: netRent + overdueFee,
        renewalMonths: renewalQuote.renewalMonths,
      };
    }

    return calculateRenewalPricing({
      monthlyRent: contract.monthlyRent,
      renewalMonths,
      isOverdue: contract.status === 'OVERDUE',
      overdueDays: contract.overdueDays,
      overdueFee: contract.overdueFee,
    });
  }, [contract, renewalMonths, renewalQuote]);

  return {
    renewalQuote,
    loadingQuote,
    isCapacityConflict,
    capacityConflictMessage,
    setCapacityConflict,
    newEndDate,
    pricing,
  };
}
