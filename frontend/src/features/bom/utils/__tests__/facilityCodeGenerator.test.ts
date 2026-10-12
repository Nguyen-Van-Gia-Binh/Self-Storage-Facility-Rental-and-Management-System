import { describe, it, expect } from 'vitest';
import {
  generateFacilityCode,
  removeVietnameseTones,
} from '../facilityCodeGenerator';

describe('BOM Facility Code Generator (ISS-Rule Engine)', () => {
  const FACILITY_CODE_PATTERN = /^FAC-[A-Z][A-Z0-9]{1,3}$/;

  describe('removeVietnameseTones', () => {
    it('loại bỏ đúng dấu tiếng Việt', () => {
      expect(removeVietnameseTones('Cầu Giấy')).toBe('Cau Giay');
      expect(removeVietnameseTones('Quận 1, TP. Hồ Chí Minh')).toBe('Quan 1, TP. Ho Chi Minh');
      expect(removeVietnameseTones('Đà Nẵng')).toBe('Da Nang');
    });
  });

  describe('Nhận diện Quận số (Quận 1..12)', () => {
    it('sinh đúng FAC-Q1 từ địa chỉ Quận 1', () => {
      const result = generateFacilityCode(
        'Kho Quận 1 — Lê Lợi',
        '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'
      );
      expect(result).not.toBeNull();
      expect(result?.code).toBe('FAC-Q1');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-Q7 từ địa chỉ Quận 7', () => {
      const result = generateFacilityCode(
        'Cơ sở SmartStorage',
        'Số 10 Mai Văn Vĩnh, Tân Quy, Quận 7, TP.HCM'
      );
      expect(result).not.toBeNull();
      expect(result?.code).toBe('FAC-Q7');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-Q10 từ địa chỉ Q.10', () => {
      const result = generateFacilityCode(
        'Kho Lưu Trữ',
        '12 Ba Tháng Hai, Phường 12, Q.10, TP.HCM'
      );
      expect(result).not.toBeNull();
      expect(result?.code).toBe('FAC-Q10');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });
  });

  describe('Nhận diện Quận/Huyện chữ quen thuộc', () => {
    it('sinh đúng FAC-CG từ Cầu Giấy', () => {
      const result = generateFacilityCode(
        'Kho Cầu Giấy',
        'Số 19 Duy Tân, Cầu Giấy, Hà Nội'
      );
      expect(result?.code).toBe('FAC-CG');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-HBT từ Hai Bà Trưng', () => {
      const result = generateFacilityCode(
        'Cơ sở Hai Bà Trưng',
        '78 Đại Cồ Việt, Lê Đại Hành, Hai Bà Trưng, Hà Nội'
      );
      expect(result?.code).toBe('FAC-HBT');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-TX từ Thanh Xuân', () => {
      const result = generateFacilityCode(
        'Kho Thanh Xuân Nam',
        '15 Nguyễn Trãi, Thanh Xuân, Hà Nội'
      );
      expect(result?.code).toBe('FAC-TX');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-BT từ Bình Thạnh', () => {
      const result = generateFacilityCode(
        'Kho Điện Biên Phủ',
        '152 Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM'
      );
      expect(result?.code).toBe('FAC-BT');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('sinh đúng FAC-TD từ Thủ Đức', () => {
      const result = generateFacilityCode(
        'Kho Công Nghệ Cao',
        'Khu Công nghệ cao, Phường Tăng Nhơn Phú B, TP. Thủ Đức'
      );
      expect(result?.code).toBe('FAC-TD');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });
  });

  describe('Chống trùng lặp mã cơ sở (Collision Avoidance)', () => {
    it('tự tăng số 2 nếu mã FAC-CG đã có trong CSDL', () => {
      const existing = ['FAC-CG', 'FAC-Q7', 'FAC-Q1'];
      const result = generateFacilityCode(
        'Cơ sở Cầu Giấy 2',
        'Số 2 Duy Tân, Cầu Giấy, Hà Nội',
        existing
      );
      expect(result?.code).toBe('FAC-CG2');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });

    it('tự tăng số 3 nếu cả FAC-CG và FAC-CG2 đều đã tồn tại', () => {
      const existing = ['FAC-CG', 'FAC-CG2', 'FAC-Q7'];
      const result = generateFacilityCode(
        'Cơ sở Cầu Giấy 3',
        'Cầu Giấy, Hà Nội',
        existing
      );
      expect(result?.code).toBe('FAC-CG3');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });
  });

  describe('Fallback theo Tên cơ sở khi Địa chỉ không chứa thông tin quận', () => {
    it('lấy chữ cái đầu từ tên cơ sở nếu địa chỉ chung chung', () => {
      const result = generateFacilityCode(
        'Kho Duy Tân',
        'Số 19 Đường Số 5'
      );
      expect(result?.code).toBe('FAC-DT');
      expect(FACILITY_CODE_PATTERN.test(result!.code)).toBe(true);
    });
  });
});
