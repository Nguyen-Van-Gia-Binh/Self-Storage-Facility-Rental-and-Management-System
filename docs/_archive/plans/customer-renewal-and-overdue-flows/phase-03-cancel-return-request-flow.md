# Phase 03: Ẩn Nút Gia Hạn Khi Chờ Nghiệm Thu & Bổ Sung API/UI Hủy Yêu Cầu Trả Kho

## Mục tiêu
Khắc phục lỗi xung đột khi hợp đồng ở trạng thái "Đang chờ nghiệm thu trả kho" (`PENDING_RETURN`) nhưng vẫn mở nút "Gia hạn hợp đồng trực tuyến" dẫn đến lỗi chặn thanh toán PayOS (Notion Audit Issue 9):
- Ẩn triệt để nút "Gia hạn hợp đồng trực tuyến" khi hợp đồng đang `PENDING_RETURN`.
- Bổ sung nút **"Hủy yêu cầu trả kho"** (Cancel Return Request) dành cho trường hợp khách hàng đổi ý muốn tiếp tục thuê (theo đúng `BR-RET-12`).
- Khi khách bấm "Hủy yêu cầu trả kho" thành công, hợp đồng quay về `ACTIVE` (hoặc `OVERDUE` nếu đã qua ngày kết thúc), từ đó nút Gia hạn mới xuất hiện trở lại.

---

## Chi tiết Triển khai

### 1. Backend: Cài Đặt API Hủy Yêu Cầu Trả Kho
- **File:** `backend/src/main/java/com/swp391/selfstorage/contract/controller/ContractController.java`
  - Thêm endpoint: `POST /contracts/{id}/cancel-return`
  - Yêu cầu xác thực Bearer token, khách hàng là chủ hợp đồng (hoặc Staff/Manager).
- **File:** `backend/src/main/java/com/swp391/selfstorage/contract/service/ContractService.java` & `impl/ContractServiceImpl.java`
  - Thêm method `ReturnNoticeResponse cancelReturnNotice(Long contractId, UserPrincipal currentUser);`
  - **Logic nghiệp vụ (`BR-RET-12`):**
    1. Kiểm tra hợp đồng tồn tại và thuộc sở hữu của user.
    2. Trạng thái hợp đồng bắt buộc phải là `PENDING_RETURN`.
    3. Tìm bản ghi `ReturnRequest` mới nhất có status là `PENDING`. Nếu đã có `inspectedAt != null` hoặc status khác `PENDING` $\rightarrow$ Ném ngoại lệ `CustomException(ErrorCode.RETURN_INSPECTION_ALREADY_STARTED, "Không thể hủy vì nhân viên đã bắt đầu tiến hành kiểm tra nghiệm thu.")`.
    4. Cập nhật `ReturnRequest.status = ReturnRequestStatus.CANCELLED`.
    5. Khôi phục trạng thái `RentalContract`:
       - Nếu `LocalDate.now().isAfter(contract.getEndDateExclusive())` $\rightarrow$ set `contract.setStatus(ContractStatus.OVERDUE)`.
       - Ngược lại $\rightarrow$ set `contract.setStatus(ContractStatus.ACTIVE)`.
       - Xóa ngày hẹn trả kho `contract.setReturnDate(null)`.
    6. Lưu hợp đồng và trả về kết quả thành công.

### 2. Frontend: API Client & UI Thẻ Ô Kho
- **File:** `frontend/src/api/customerRentals.ts` & `frontend/src/features/customer/api/customerApi.ts`
  - Thêm hàm:
    ```typescript
    export async function cancelContractReturn(contractId: number | string): Promise<any> {
      return apiClient(`/contracts/${contractId}/cancel-return`, { method: 'POST' });
    }
    ```
- **File:** `frontend/src/features/customer/components/RentedUnitCard.tsx`
  - Tại nhánh `contract.status === 'PENDING_RETURN'`:
    - Nếu `!contract.inspectionDone`:
      - Hiển thị nút: **"Hủy yêu cầu trả kho"** (Button outline màu slate/amber).
      - Khi bấm: Mở confirm dialog xác nhận muốn hủy trả kho để giữ lại ô kho.
      - Sau khi hủy thành công: Bắn toast thông báo và gọi callback tải lại danh sách hợp đồng.
  - Tuyệt đối không để lọt nút "Gia hạn hợp đồng trực tuyến" khi hợp đồng đang `PENDING_RETURN`.
- **File:** `frontend/src/features/customer/pages/RenewalPage.tsx`
  - Thêm validation chặn ngay bước 1 nếu `contract.status === 'PENDING_RETURN'`: hiển thị thông báo hướng dẫn khách hủy yêu cầu trả kho trước nếu muốn gia hạn.

### 3. Tests to Write / Update
- **Backend Test:** `backend/src/test/java/com/swp391/selfstorage/contract/service/ContractReturnServiceTest.java`
  - Test `cancelReturnNotice_Success_RestoresActiveStatus()`: Hủy thành công, contract trở về ACTIVE, returnRequest thành CANCELLED.
  - Test `cancelReturnNotice_Fails_WhenInspectionAlreadyDone()`: Ném lỗi nếu nhân viên đã nghiệm thu.
  - Test `cancelReturnNotice_Fails_WhenContractNotPendingReturn()`: Ném lỗi nếu contract không phải PENDING_RETURN.
- **Frontend Test:** `frontend/src/features/customer/components/__tests__/CancelReturnFlow.test.tsx`
  - Kiểm tra hiển thị nút "Hủy yêu cầu trả kho" khi `PENDING_RETURN` và ẩn nút "Gia hạn".
  - Mô phỏng click hủy và gọi API thành công.

---

## Tiêu chí Nghiệm thu (Acceptance Criteria)
1. Tuyệt đối không xuất hiện nút Gia hạn khi hợp đồng đang chờ nghiệm thu trả kho.
2. Khách hàng có thể tự hủy yêu cầu trả kho khi nhân viên chưa nghiệm thu.
3. Khi hủy xong, hợp đồng khôi phục trạng thái ACTIVE và nút Gia hạn xuất hiện trở lại.
4. Mọi test suite backend và frontend đều xanh 100%.
