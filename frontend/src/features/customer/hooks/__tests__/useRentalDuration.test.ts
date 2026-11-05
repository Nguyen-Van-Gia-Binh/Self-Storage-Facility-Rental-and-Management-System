// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRentalDuration } from '../useRentalDuration';

describe('useRentalDuration — Khóa cửa sổ đặt trước 30 ngày (BR-RES-01)', () => {
  it('tự động tính maxBookingDate là 30 ngày kể từ ngày hôm nay', () => {
    const { result } = renderHook(() => useRentalDuration());

    const today = new Date();
    const expectedMax = new Date(today);
    expectedMax.setDate(today.getDate() + 30);
    const expectedMaxStr = `${expectedMax.getFullYear()}-${String(expectedMax.getMonth() + 1).padStart(2, '0')}-${String(expectedMax.getDate()).padStart(2, '0')}`;

    expect(result.current.maxBookingDate).toBe(expectedMaxStr);
  });

  it('không cho phép chọn ngày bắt đầu vượt quá 30 ngày (tự động clamp về maxBookingDate)', () => {
    const { result } = renderHook(() => useRentalDuration());

    act(() => {
      // Thử set ngày quá 60 ngày
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 60);
      const farFutureStr = `${farFuture.getFullYear()}-${String(farFuture.getMonth() + 1).padStart(2, '0')}-${String(farFuture.getDate()).padStart(2, '0')}`;
      result.current.setStartDate(farFutureStr);
    });

    expect(result.current.startDate).toBe(result.current.maxBookingDate);
  });

  it('không cho phép chọn ngày trong quá khứ (tự động clamp về todayStr)', () => {
    const { result } = renderHook(() => useRentalDuration());

    act(() => {
      result.current.setStartDate('2020-01-01');
    });

    expect(result.current.startDate).toBe(result.current.todayStr);
  });

  it('khởi tạo với initialStartDateParam hợp lệ trong cửa sổ 30 ngày', () => {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 15);
    const validDateStr = `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}-${String(validDate.getDate()).padStart(2, '0')}`;

    const { result } = renderHook(() =>
      useRentalDuration({ initialStartDateParam: validDateStr })
    );

    expect(result.current.startDate).toBe(validDateStr);
  });
});
