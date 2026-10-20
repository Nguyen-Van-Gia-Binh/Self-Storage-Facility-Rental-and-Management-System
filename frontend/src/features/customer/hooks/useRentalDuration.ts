import { useState, useMemo } from 'react';

interface UseRentalDurationParams {
  initialStartDateParam?: string | null;
  initialMonthsParam?: number;
}

export function useRentalDuration({
  initialStartDateParam,
  initialMonthsParam,
}: UseRentalDurationParams = {}) {
  // 1. Ngày hôm nay định dạng YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 2. Ngày bắt đầu thuê (không được nhỏ hơn ngày hôm nay)
  const [startDate, setStartDate] = useState<string>(() => {
    if (initialStartDateParam && initialStartDateParam >= todayStr) {
      return initialStartDateParam;
    }
    return todayStr;
  });

  // 3. Số tháng thuê (mặc định 3 tháng)
  const [durationMonths, setDurationMonths] = useState<number>(
    typeof initialMonthsParam === 'number' && !isNaN(initialMonthsParam) && initialMonthsParam > 0
      ? initialMonthsParam
      : 3
  );

  // 4. Các mốc chọn nhanh thời gian thuê phổ biến
  const quickMilestones = useMemo(
    () => [
      { months: 1, label: '1 tháng' },
      { months: 3, label: '3 tháng' },
      { months: 6, label: '6 tháng' },
      { months: 12, label: '1 năm' },
    ],
    []
  );

  // 5. Trạng thái người dùng tự nhập số tháng tùy chọn (Custom Mode)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    ![1, 3, 6, 12].includes(durationMonths)
  );

  // 6. Tính ngày kết thúc dự kiến tự động
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    const [y, m, d] = startDate.split('-').map(Number);
    const date = new Date(y, m - 1 + durationMonths, d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [startDate, durationMonths]);

  return {
    todayStr,
    startDate,
    setStartDate,
    durationMonths,
    setDurationMonths,
    quickMilestones,
    isCustomMode,
    setIsCustomMode,
    calculatedEndDate,
  };
}
