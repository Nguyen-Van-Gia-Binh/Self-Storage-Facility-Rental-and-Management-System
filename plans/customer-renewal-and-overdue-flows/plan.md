# Plan: Chuẩn Hóa Thời Điểm Khóa PIN D+7, Trạng Thái Hậu Nộp Phạt, Hủy Trả Kho & Đổi Mới Cơ Chế Gia Hạn

> **Slug:** `customer-renewal-and-overdue-flows`  
> **Mode:** `--hard`  
> **Risk:** high-risk — Thay đổi quy tắc gia hạn hợp đồng (BR-REN-01, 02, 06), bổ sung API hủy yêu cầu trả kho (BR-RET-12), chuẩn hóa thời điểm khóa PIN (BR-OVD-05) và luồng thanh toán nợ phạt.  
> **Mục tiêu:** Giải quyết triệt để 4 vấn đề cốt lõi trên khu vực quản lý kho của khách hàng (Notion Audit Issues 7, 8, 9, 10).

---

## Danh Sách Các Giai Đoạn (Phases)

- [x] [phase-01-lock-access-code-d7.md](./phase-01-lock-access-code-d7.md): Chuẩn hóa thời điểm tự động khóa mã mở cửa chính xác tại mốc D+7 (Task 7)
- [x] [phase-02-overdue-cleared-status-and-banner.md](./phase-02-overdue-cleared-status-and-banner.md): Chuẩn hóa trạng thái & cảnh báo thẻ ô kho sau khi nộp phạt quá hạn (Task 8)
- [x] [phase-03-cancel-return-request-flow.md](./phase-03-cancel-return-request-flow.md): Ẩn nút Gia hạn khi Chờ nghiệm thu & Bổ sung API/UI Hủy yêu cầu trả kho (Task 9)
- [x] [phase-04-revamped-renewal-mechanism.md](./phase-04-revamped-renewal-mechanism.md): Đổi mới cơ chế Gia hạn: Bỏ khóa 30 ngày, Cho gia hạn sau nộp phạt, Xử lý xung đột đặt trước (Task 10)
- [ ] [phase-05-customer-flows-e2e-and-docs.md](./phase-05-customer-flows-e2e-and-docs.md): Kiểm thử Hồi quy Toàn diện, Đồng bộ Business Rules & Dashboard

---

## Ma Trận Phân Bổ Nhiệm Vụ & File Tác Động

| Phase | Files Backend | Files Frontend | Tài liệu / Migration |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `CustomerRentalServiceImpl.java`, `CustomerRentalServiceTest.java` | `RentedUnitCard.tsx` | `BUSINESS-RULES.md` (`BR-OVD-05`) |
| **Phase 2** | — | `RentedUnitCard.tsx`, `ContractDetailModal.tsx` | `NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` |
| **Phase 3** | `ContractController.java`, `ContractService.java`, `ContractServiceImpl.java`, `ContractReturnServiceTest.java` | `customerRentals.ts`, `customerApi.ts`, `RentedUnitCard.tsx` | `BUSINESS-RULES.md` (`BR-RET-12`) |
| **Phase 4** | `RenewalServiceImpl.java`, `RenewalServiceTest.java` | `RentedUnitCard.tsx`, `RenewalPage.tsx`, `types.ts` | `BUSINESS-RULES.md` (`BR-REN-01`, `02`, `06`, `BR-RET-01`) |
| **Phase 5** | Toàn bộ test suite Backend | Toàn bộ build Frontend | `DASHBOARD.md`, `NOTION-AUDIT-ISSUES-AND-BR-CHANGES.md` |
