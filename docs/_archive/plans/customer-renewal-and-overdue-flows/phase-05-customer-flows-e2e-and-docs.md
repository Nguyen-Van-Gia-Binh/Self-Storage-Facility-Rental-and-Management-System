# Phase 05: Kiểm Thử Toàn Diện & Đồng Bộ Bảng Điều Hành

## Mục tiêu
Đảm bảo chất lượng toàn diện sau khi hoàn thành cả 4 Task (7, 8, 9, 10):
- Chạy toàn bộ test suite Backend (`mvn clean test`).
- Chạy toàn bộ build và test Frontend (`npm test` và `npm run build`).
- Cập nhật tiến độ vào `docs/DASHBOARD.md` và `docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md`.

---

## Chi tiết Triển khai

### 1. Kiểm Thử Backend & Frontend
1. Chạy unit & integration test backend:
   ```powershell
   mvn test -Dtest=CustomerRentalServiceTest,RenewalServiceTest,ContractReturnServiceTest,PaymentServiceTest
   mvn clean test
   ```
2. Chạy test và type-check frontend:
   ```powershell
   npm test
   npm run build
   ```

### 2. Cập Nhật Tài Liệu
1. **`docs/BUSINESS-RULES.md`**: Cập nhật các quy tắc `BR-REN-01`, `BR-REN-02`, `BR-REN-06`, `BR-RET-01`, `BR-RET-12`.
2. **`docs/NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md`**: Đánh dấu trạng thái `[ĐÃ XONG]` cho các mục 7, 8, 9, 10.
3. **`docs/DASHBOARD.md`**: Ghi nhận hoàn thành 4 mục audit theo Quy tắc 3 Dòng.

---

## Tiêu chí Nghiệm thu (Acceptance Criteria)
1. Backend `mvn clean test` đạt `BUILD SUCCESS` 100%.
2. Frontend `npm run build` không lỗi type, không lỗi lint.
3. Tài liệu phản ánh chính xác các thay đổi nghiệp vụ.
