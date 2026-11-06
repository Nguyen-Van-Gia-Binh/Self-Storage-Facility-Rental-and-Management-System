# Phase 02: Chuẩn Hóa Trạng Thái & Cảnh Báo Thẻ Ô Kho Sau Khi Nộp Phạt Quá Hạn

## Mục tiêu
Khắc phục lỗi thẻ ô kho hiển thị màu xanh "Đang hoạt động" sau khi khách nộp tiền phạt quá hạn (Notion Audit Issue 8):
- Hợp đồng quá hạn nộp phạt xong (`overdueFeeAccrued == 0`) không được hiển thị badge xanh lá `Đang hoạt động 24/7`, vì hợp đồng đã kết thúc thời hạn thuê.
- Hiển thị badge màu cam cảnh báo (Amber/Warning) và banner hướng dẫn rõ ràng: Đã tất toán phạt, vui lòng dọn kho / trả kho hoặc gia hạn tiếp.
- Mở lại nút "Báo trả kho" sáng rõ để khách hẹn nhân viên nghiệm thu bàn giao.

---

## Chi tiết Triển khai

### 1. Frontend: Cập Nhật Badge và Màu Sắc trong `RentedUnitCard.tsx`
- **File:** `frontend/src/features/customer/components/RentedUnitCard.tsx`
- **Thay đổi:**
  - Tại `getStatusBadge()` cho case `'OVERDUE'`:
    - Khi `penaltyFee === 0 && !isGracePeriod`: Thay thế badge xanh bằng:
      ```tsx
      <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-300">
        Đã tất toán phạt — Chờ dọn kho / trả kho
      </Badge>
      ```
  - Bổ sung Banner nhắc nhở màu cam ngay dưới Header của thẻ ô kho:
    ```tsx
    {contract.status === 'OVERDUE' && penaltyFee === 0 && !isGracePeriod && (
      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Bạn đã hoàn tất nộp phạt quá hạn:</span> Hợp đồng cũ đã hết thời hạn thuê. Vui lòng hoàn tất dọn sạch đồ đạc và bấm <strong>"Báo trả kho"</strong> trước 00:00 để tránh phát sinh phạt mới, hoặc bấm <strong>"Gia hạn hợp đồng"</strong> để tiếp tục sử dụng nếu ô kho còn trống.
        </div>
      </div>
    )}
    ```

### 2. Frontend: Đồng bộ `ContractDetailModal.tsx`
- **File:** `frontend/src/features/customer/components/ContractDetailModal.tsx`
- **Thay đổi:**
  - Tại `getStatusBadge()`: Khi `contract.status === 'OVERDUE' && contract.overdueFee === 0`, hiển thị `Đã nộp phạt (Chờ trả kho)` với badge warning thay vì badge quá hạn nợ.

### 3. Tests to Write / Update
- **Frontend Test:** `frontend/src/features/customer/components/__tests__/OverdueClearedAudit.test.tsx`
  - Render `RentedUnitCard` với contract `status: 'OVERDUE'`, `overdueFee: 0`, `overdueDays: 5`.
  - Assert không có text `Đang hoạt động 24/7` và không có class `bg-emerald-50 text-emerald-700`.
  - Assert xuất hiện badge `Đã tất toán phạt — Chờ dọn kho / trả kho` và banner nhắc nhở hoàn tất dọn kho hoặc gia hạn.
  - Assert nút "Báo trả kho" hiển thị khả dụng.

---

## Tiêu chí Nghiệm thu (Acceptance Criteria)
1. Thẻ ô kho sau khi nộp phạt tuyệt đối không mang màu xanh an toàn, chuyển 100% sang badge cam `Đã tất toán phạt`.
2. Có banner giải thích rõ ràng tránh gây hiểu lầm cho khách hàng.
3. Test suite frontend pass 100%.
