# Kế hoạch Kiểm thử Tổng thể (Master Test Plan)
## Self-Storage Facility Rental and Management System

> **Dự án:** Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ (SWP391)  
> **Tiêu chuẩn áp dụng:** IEEE 829 (Standard for Software and System Test Documentation)  
> **Phiên bản tài liệu:** 1.0 · Ngày lập: 23/09/2026  
> **Tài liệu tham chiếu:** [TOPIC.md](../TOPIC.md) · [PLAN.md](../PLAN.md) · [USE-CASES.md](../USE-CASES.md) · [BUSINESS-RULES.md](../BUSINESS-RULES.md) · [API-SPEC.md](../API-SPEC.md) · [DATA-DICTIONARY.md](../DATA-DICTIONARY.md) · [UI-FLOW-MAPPING.md](../UI-FLOW-MAPPING.md)

---

## Mục lục

1. [Giới thiệu & Mục tiêu](#1-giới-thiệu--mục-tiêu)
2. [Phạm vi kiểm thử (Test Scope)](#2-phạm-vi-kiểm-thử-test-scope)
3. [Chiến lược kiểm thử (Test Strategy & Levels)](#3-chiến-lược-kiểm-thử-test-strategy--levels)
4. [Môi trường kiểm thử & Công cụ (Test Environment & Tools)](#4-môi-trường-kiểm-thử--công-cụ-test-environment--tools)
5. [Kỹ thuật thiết kế ca kiểm thử (Test Design Techniques)](#5-kỹ-thuật-thiết-kế-ca-kiểm-thử-test-design-techniques)
6. [Quy chuẩn định dạng Test Case](#6-quy-chuẩn-định-dạng-test-case)
7. [Quy trình quản lý lỗi (Defect Management)](#7-quy-trình-quản-lý-lỗi-defect-management)
8. [Tiêu chí Nghiệm thu & Tạm dừng / Khôi phục kiểm thử](#8-tiêu-chí-nghiệm-thu--tạm-dừng--khôi-phục-kiểm-thử)
9. [Ma trận truy xuất nguồn gốc (Requirement Traceability Matrix - RTM)](#9-ma-trận-truy-xuất-nguồn-gốc-requirement-traceability-matrix---rtm)
10. [Mục lục điều hướng các Test Suite chi tiết](#10-mục-lục-điều-hướng-các-test-suite-chi-tiết)

---

## 1. Giới thiệu & Mục tiêu

Tài liệu này xác định kế hoạch và chiến lược kiểm thử tổng thể cho hệ thống **Self-Storage Facility Rental and Management System**, đảm bảo phần mềm đáp ứng đầy đủ và chính xác tất cả các yêu cầu chức năng, phi chức năng, quy tắc nghiệp vụ và ràng buộc kỹ thuật trước khi bàn giao và nghiệm thu đồ án tốt nghiệp SWP391.

### Mục tiêu cụ thể:
1. **Bảo đảm độ phủ yêu cầu 100%:** Kiểm chứng toàn bộ **27 mã yêu cầu chức năng** (`SC-01..06`, `FS-01..06`, `FM-01..06`, `BM-01..05`, `SA-01..04`), **76 Use Cases** và **15 danh mục Business Rules**.
2. **Kiểm soát tính đúng đắn của logic tài chính:** Xác nhận độ chính xác tuyệt đối trong việc tính toán tiền cọc Deposit, tiền thuê N tháng, chính sách hoàn tiền khi hủy (100% / 50%), phí phạt quá hạn lũy tiến từ D+4 đến D+10 (trần 70% cọc) và quy tắc làm tròn 1.000 VND (`BR-GEN-04`).
3. **Bảo đảm tính toàn vẹn trạng thái & Chống xung đột (Concurrency):** Ngăn chặn hoàn toàn hiện tượng overbooking hoặc gán trùng ô kho khi có nhiều khách hàng cùng thực hiện đặt chỗ hoặc thanh toán trong cùng thời điểm (`BR-AVL-03`).
4. **Bảo mật và Phân quyền nghiêm ngặt (RBAC):** Đảm bảo cơ chế phân quyền dựa trên JWT theo 5 Actor và kiểm soát dữ liệu cô lập theo từng cơ sở (Multi-facility Data Isolation).

---

## 2. Phạm vi kiểm thử (Test Scope)

### 2.1. Trong phạm vi kiểm thử (In-Scope)
- **5 Cổng giao diện người dùng (User Portals):**
  - **Storage Customer Portal:** Tra cứu, sơ đồ chọn kho trực quan, đặt chỗ, thanh toán, quản lý kho đang thuê, gửi ticket hỗ trợ, đăng ký trả kho và gia hạn.
  - **Facility Staff Desk:** Tra cứu đặt chỗ, bàn giao e-Form, cấp PIN 6 số, nghiệm thu hiện trạng trả kho, xử lý sự cố tại chỗ.
  - **Facility Manager Portal:** Quản lý danh mục ô kho, phân công ca trực, duyệt hoàn tiền, giám sát tỷ lệ lấp đầy và báo cáo cơ sở.
  - **Business Operations Manager (BOM) Portal:** Quản lý cơ sở toàn hệ thống, cấu hình chính sách nghiệp vụ, thiết lập bảng giá, giám sát doanh thu.
  - **System Administrator Portal:** Quản lý tài khoản người dùng, phân quyền RBAC, theo dõi nhật ký hoạt động (Audit Activity Logs).
- **7 Luồng nghiệp vụ cốt lõi:**
  - `Flow 1`: Storage Unit Reservation Flow
  - `Flow 2`: Storage Check-in and Handover Flow
  - `Flow 3`: Rented Storage Unit Management & Return Flow
  - `Flow 4`: Business Rules, Fee Management and Revenue Monitoring Flow
  - `Flow 5`: Facility Storage and Staff Management Flow
  - `Flow 6`: Storage Renewal and Overdue Handling Flow (Sub-flow 6.1 & 6.2)
  - `Flow 7`: Support Request and Issue Handling Flow
- **Tác vụ hệ thống tự động (System Cronjobs):** Tự động hủy đơn quá 48h, thông báo đếm ngược hạn thuê (60, 7, 3, 1 ngày), phát hiện quá hạn D+1, tính phạt D+4..D+10, tự động khóa PIN và chấm dứt hợp đồng sau D+10.
- **Tích hợp kỹ thuật:** RESTful API contracts (`API-SPEC.md`), CSDL quan hệ SQL Server 2022 và Flyway migration.

### 2.2. Ngoài phạm vi kiểm thử (Out-of-Scope)
- Phần cứng ổ khóa điện tử hoặc đầu đọc cổng thực tế (hệ thống mô phỏng Access Code / PIN 6 số và khóa cơ; **tuyệt đối không sử dụng thẻ RFID** theo quy chuẩn đề bài).
- Cổng thanh toán ngân hàng trực tiếp (sử dụng VietQR Mock callback và Payment Gateway Simulator).

---

## 3. Chiến lược kiểm thử (Test Strategy & Levels)

Hệ thống áp dụng mô hình kim tự tháp kiểm thử (Testing Pyramid) kết hợp các cấp độ:

```
          ▲
         / \     End-to-End Testing (E2E User Journeys - 7 Flows)
        /---\    --------------------------------------------------
       /     \    System & Security Testing (RBAC, Multi-facility, Cronjobs)
      /-------\   ----------------------------------------------------------
     /         \   Integration Testing (Spring MockMvc, REST API Contracts)
    /-----------\  --------------------------------------------------------------
   /             \  Unit Testing (Business Rule Services, Pricing, Calculations)
  /---------------\ ------------------------------------------------------------------
```

1. **Unit Testing (Kiểm thử đơn vị):**
   - Áp dụng kiểm thử các thuật toán nghiệp vụ cô lập: tính toán tiền thuê, cọc deposit, phí phạt quá hạn dồn tích, kiểm tra giao thoa thời gian `[start, endExclusive)`.
   - Công cụ: JUnit 5, Mockito, AssertJ.
2. **Integration Testing (Kiểm thử tích hợp):**
   - Kiểm thử tương tác giữa Controller - Service - Repository và ánh xạ CSDL JPA / Hibernate.
   - Kiểm thử toàn diện các mã phản hồi HTTP: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`.
   - Công cụ: `@SpringBootTest`, `@AutoConfigureMockMvc`, Testcontainers / H2 In-Memory / Local SQL Server.
3. **System & Functional Testing (Kiểm thử hệ thống & Chức năng):**
   - Kiểm thử hành vi hệ thống dựa trên 76 Use Cases.
   - Bao phủ các kịch bản chuẩn (Positive / Happy Path), kịch bản lỗi nhập liệu (Negative), và kịch bản phân quyền trái phép (Security RBAC).
4. **End-to-End (E2E) Scenario Testing (Kiểm thử luồng xuyên suốt):**
   - Kiểm thử hành trình hoàn chỉnh của người dùng xuyên suốt các Portal (Ví dụ: Khách đặt kho ở WS1 ➔ Thanh toán ở WS3 ➔ Nhân viên bàn giao ở WS2 ➔ Quá hạn xử lý ở WS2/WS3).
   - Công cụ: Playwright E2E Test Suite.
5. **Non-Functional Testing (Kiểm thử phi chức năng):**
   - **Bảo mật:** Chống tấn công IDOR, SQL Injection, kiểm tra hiệu lực và làm mới Token JWT.
   - **Đồng thời (Concurrency):** Giả lập 20 khách hàng tranh chấp 1 ô kho cuối cùng để xác nhận cơ chế khóa lạc quan/bi quan (`BR-AVL-03`).

---

## 4. Môi trường kiểm thử & Công cụ (Test Environment & Tools)

| Hạng mục | Môi trường / Công cụ chuẩn |
|---|---|
| **Hệ điều hành** | Windows 11 (PowerShell 7+) / Ubuntu Linux Runner |
| **Backend Runtime** | Java 17 LTS (Amazon Corretto / Eclipse Temurin 17.0.12) |
| **Backend Framework** | Spring Boot 3.3.x, Spring Data JPA, Spring Security |
| **Frontend Framework** | React 18 (TypeScript, Vite, Tailwind CSS) |
| **Cơ sở dữ liệu** | Microsoft SQL Server 2022 (Port 1433), Flyway Migration |
| **Framework Unit Test** | JUnit 5 (Jupiter), Mockito, AssertJ |
| **Framework API Test** | Spring MockMvc, REST Assured, Postman Collection |
| **Framework E2E Test** | Playwright (Node.js 20 LTS) |
| **Quản lý phiên bản** | Git, GitHub Actions CI/CD |

---

## 5. Kỹ thuật thiết kế ca kiểm thử (Test Design Techniques)

1. **Phân tích giá trị biên (Boundary Value Analysis - BVA):**
   - Áp dụng cho các mốc thời gian: Hủy đơn đúng 48h, 47h59m, 48h01m (`BR-CAN-01`); Quá hạn ngày D+3, D+4, D+10, D+11 (`BR-OVD-02`..`05`); Gia hạn trước 30 ngày (`BR-REN-01`).
   - Áp dụng cho số tiền và diện tích: Đơn vị làm tròn đến đúng 1.000 VND (`BR-GEN-04`).
2. **Phân vùng tương đương (Equivalence Partitioning):**
   - Phân chia tập dữ liệu đầu vào thành các nhóm Hợp lệ (Valid) và Không hợp lệ (Invalid) đối với số tháng thuê (N = 1..12 tháng; N <= 0; N > 12; N lẻ).
   - Mã PIN truy cập: Đúng 6 chữ số hợp lệ; ít hơn 6 chữ số; chứa ký tự chữ.
3. **Kiểm thử chuyển trạng thái (State Transition Testing):**
   - Kiểm tra vòng đời của `StorageUnit`: `AVAILABLE` ➔ `RESERVED` ➔ `OCCUPIED` ➔ `UNDER_INSPECTION` ➔ `CLEANING` ➔ `AVAILABLE`.
   - Kiểm tra vòng đời của `RentalContract`: `PENDING_CHECKIN` ➔ `ACTIVE` ➔ `OVERDUE` ➔ `TERMINATED` / `COMPLETED`.
4. **Bảng quyết định (Decision Table Testing):**
   - Áp dụng cho ma trận hoàn tiền khi Hủy đặt chỗ (Thời điểm hủy x Lý do hủy x Tỷ lệ hoàn cọc x Tỷ lệ hoàn tiền thuê).
   - Áp dụng cho chính sách xử lý quá hạn (Số ngày quá hạn x Trạng thái kho x Tỷ lệ phạt cọc x Quyền truy cập PIN).

---

## 6. Quy chuẩn định dạng Test Case

Mọi Test Case trong các tài liệu kiểm thử chi tiết đều được trình bày theo cấu trúc bảng chuẩn IEEE 829:

| Thuộc tính | Định dạng & Ý nghĩa |
|---|---|
| **Test Case ID** | `TC-<SUITE>-<STT 3 chữ số>` (Ví dụ: `TC-F1-001`, `TC-SEC-004`) |
| **Test Summary** | Tên ca kiểm thử rõ ràng, súc tích |
| **Traceability** | Liên kết truy xuất nguồn gốc: Mã yêu cầu chức năng, Use Case, Business Rule |
| **Test Type** | `Positive` (Happy Path), `Negative` (Dữ liệu lỗi), `Boundary` (Biên), `Security` (Bảo mật) |
| **Priority** | `P1 (Critical)` · `P2 (High)` · `P3 (Medium)` · `P4 (Low)` |
| **Pre-conditions** | Trạng thái hệ thống, dữ liệu giả lập sẵn có trước khi thực hiện |
| **Test Steps** | Các bước thực hiện tuần tự được đánh số 1, 2, 3... |
| **Test Data** | Giá trị đầu vào chi tiết (User, Pass, Giá trị, Payload JSON...) |
| **Expected Result** | Kết quả mong đợi trên giao diện, API response và CSDL |

---

## 7. Quy trình quản lý lỗi (Defect Management)

### 7.1. Phân loại mức độ nghiêm trọng (Defect Severity)
- **S1 — Blocker:** Lỗi làm sập hệ thống (Crash), hỏng CSDL, hoặc tắc nghẽn luồng nghiệp vụ chính mà không có cách khắc phục tạm (Ví dụ: Không tạo được đặt chỗ, không thanh toán được).
- **S2 — Critical:** Lỗi nghiêm trọng ảnh hưởng đến tính đúng đắn của dữ liệu tài chính hoặc lỗ hổng bảo mật (Ví dụ: Sai lệch tiền cọc, tính sai phí quá hạn D+4, lộ mã PIN của khách khác).
- **S3 — Major:** Chức năng hoạt động sai so với đặc tả nhưng có giải pháp khắc phục tạm thời (Workaround), hoặc validate thiếu một số trường không trọng yếu.
- **S4 — Minor:** Lỗi nhỏ về giao diện hiển thị, sai chính tả, định dạng font chữ hoặc ngày tháng không ảnh hưởng đến chức năng.

### 7.2. Vòng đời xử lý lỗi (Defect Lifecycle)
```
[New] ──> [Assigned] ──> [In Progress] ──> [Resolved] ──> [Retest] ──┬──> [Closed] (Pass)
                                                                     └──> [Re-opened] (Fail)
```

---

## 8. Tiêu chí Nghiệm thu & Tạm dừng / Khôi phục kiểm thử

### 8.1. Tiêu chí Đạt nghiệm thu (Pass / Fail Criteria)
- **100%** Test Cases mức độ ưu tiên P1 (Critical) và P2 (High) phải ở trạng thái **PASSED**.
- Tỷ lệ Pass tổng thể của toàn bộ Test Suite đạt tối thiểu **95%**.
- Không còn bất kỳ lỗi nào thuộc mức độ nghiêm trọng **S1 (Blocker)** hoặc **S2 (Critical)** đang mở.
- Toàn bộ 27 mã yêu cầu chức năng và 76 Use Cases đều có bằng chứng kiểm thử đạt yêu cầu.

### 8.2. Tiêu chí Tạm dừng và Khôi phục kiểm thử (Suspension & Resumption)
- **Tạm dừng (Suspend):** Khi phát hiện lỗi S1 ngăn cản kiểm thử luồng cốt lõi (ví dụ CSDL không khởi động được hoặc API Đăng nhập/Xác thực bị lỗi 500).
- **Khôi phục (Resume):** Khi nhóm phát triển hoàn thành bản vá lỗi (hotfix), triển khai lại môi trường và vượt qua Smoke Test 5 kịch bản chính.

---

## 9. Ma trận truy xuất nguồn gốc (Requirement Traceability Matrix - RTM)

Bảng đối chiếu 2 chiều bảo đảm **100% mã yêu cầu** và **76 Use Cases** được phân bổ và bao phủ đầy đủ trong các Test Suite:

| Mã Yêu cầu | Tên Chức năng nghiệp vụ | Use Cases bao phủ | Test Suite phụ trách | Số lượng Test Cases dự kiến |
|:---:|---|---|---|:---:|
| **SC-01** | Xem thông tin dịch vụ, cơ sở, ô kho | `UC-F1-01`, `UC-F1-02`, `UC-F1-03` | [TEST-CASES-FLOW-1-RESERVATION.md](TEST-CASES-FLOW-1-RESERVATION.md) | 5 |
| **SC-02** | Đặt chỗ ô kho trên sơ đồ | `UC-F1-04`, `UC-F1-05`, `UC-F1-09`, `UC-F1-10`, `UC-F1-12` | [TEST-CASES-FLOW-1-RESERVATION.md](TEST-CASES-FLOW-1-RESERVATION.md) | 8 |
| **SC-03** | Thanh toán cọc & phí thuê N tháng | `UC-F1-07`, `UC-F3-13`, `UC-F6-03` | [TEST-CASES-FLOW-1-RESERVATION.md](TEST-CASES-FLOW-1-RESERVATION.md), [TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md](TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md) | 6 |
| **SC-04** | Check-in nhận ô kho | `UC-F2-05` | [TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md) | 4 |
| **SC-05** | Quản lý ô kho đã thuê & Gia hạn | `UC-F3-01`..`05`, `UC-F6-01`..`02` | [TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md), [TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md](TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md) | 10 |
| **SC-06** | Gửi yêu cầu hỗ trợ sự cố | `UC-F7-01`, `UC-F7-02` | [TEST-CASES-FLOW-7-SUPPORT.md](TEST-CASES-FLOW-7-SUPPORT.md) | 5 |
| **FS-01** | Kiểm tra thông tin đặt chỗ | `UC-F2-01`, `UC-F2-02`, `UC-F2-08` | [TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md) | 5 |
| **FS-02** | Hỗ trợ check-in & Bàn giao PIN | `UC-F2-03`, `UC-F2-04` | [TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md) | 5 |
| **FS-03** | Cập nhật trạng thái ô kho | `UC-F2-06`, `UC-F3-07`, `UC-F3-09`, `UC-F3-12`, `UC-F7-07` | [TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md), [TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md) | 7 |
| **FS-04** | Xác nhận tình trạng khi trả kho | `UC-F3-06` | [TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md) | 5 |
| **FS-05** | Xử lý sự cố tại chỗ | `UC-F7-03`, `UC-F7-05`, `UC-F7-06`, `UC-F7-08` | [TEST-CASES-FLOW-7-SUPPORT.md](TEST-CASES-FLOW-7-SUPPORT.md) | 6 |
| **FS-06** | Theo dõi công việc hằng ngày | `UC-F5-05` | [TEST-CASES-FLOW-5-FACILITY-STAFF.md](TEST-CASES-FLOW-5-FACILITY-STAFF.md) | 4 |
| **FM-01** | Quản lý ô kho tại cơ sở | `UC-F5-01`, `UC-F5-02`, `UC-F5-03` | [TEST-CASES-FLOW-5-FACILITY-STAFF.md](TEST-CASES-FLOW-5-FACILITY-STAFF.md) | 6 |
| **FM-02** | Phân bổ ô kho, giữ 48h & khóa chính thức | `UC-F1-06`, `UC-F1-08`, `UC-F1-11`, `UC-F1-12`, `UC-F2-07`, `UC-F2-08` | [TEST-CASES-FLOW-1-RESERVATION.md](TEST-CASES-FLOW-1-RESERVATION.md), [TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md) | 8 |
| **FM-03** | Theo dõi khách & Hợp đồng | `UC-F3-10`, `UC-F3-11` | [TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md) | 4 |
| **FM-04** | Vận hành trả kho, gia hạn, quá hạn | `UC-F3-05`, `UC-F3-08`, `UC-F6-04`..`09`, `UC-F6-11` | [TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md), [TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md](TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md) | 12 |
| **FM-05** | Phân công nhân viên ca trực | `UC-F2-09`, `UC-F5-04`, `UC-F7-04` | [TEST-CASES-FLOW-5-FACILITY-STAFF.md](TEST-CASES-FLOW-5-FACILITY-STAFF.md), [TEST-CASES-FLOW-7-SUPPORT.md](TEST-CASES-FLOW-7-SUPPORT.md) | 6 |
| **FM-06** | Báo cáo cơ sở & lấp đầy | `UC-F5-06`, `UC-F6-10` | [TEST-CASES-FLOW-5-FACILITY-STAFF.md](TEST-CASES-FLOW-5-FACILITY-STAFF.md) | 4 |
| **BM-01** | Quản lý danh sách cơ sở | `UC-F4-01` | [TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md) | 4 |
| **BM-02** | Thiết lập chính sách thuê & cọc | `UC-F1-10`, `UC-F1-12`, `UC-F4-02`..`06`, `UC-F6-01`, `UC-F6-09` | [TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md) | 8 |
| **BM-03** | Quản lý giá, phụ phí, phạt | `UC-F1-05`, `UC-F4-07`..`09`, `UC-F6-06` | [TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md) | 6 |
| **BM-04** | Giám sát hiệu quả vận hành | `UC-F4-10`, `UC-F4-11` | [TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md) | 4 |
| **BM-05** | Báo cáo toàn hệ thống | `UC-F4-12` | [TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md) | 4 |
| **SA-01** | Quản lý tài khoản người dùng | `UC-SYS-02` | [TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md) | 5 |
| **SA-02** | Phân quyền vai trò người dùng | `UC-F5-07` | [TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md) | 5 |
| **SA-03** | Cấu hình quyền truy cập theo cơ sở | `UC-F5-08` | [TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md) | 5 |
| **SA-04** | Theo dõi nhật ký hoạt động | `UC-SYS-03` | [TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md) | 4 |
| **N/A** | Đăng ký, đăng nhập & Token JWT | `UC-SYS-01` | [TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md) | 6 |
| **Tổng cộng** | **27 Mã yêu cầu chức năng** | **76 Use Cases** | **8 Test Suites chuyên biệt** | **~145 Test Cases** |

---

## 10. Mục lục điều hướng các Test Suite chi tiết

Dưới đây là danh mục 8 bộ tài liệu kiểm thử thành phần:

1. **[TEST-CASES-FLOW-1-RESERVATION.md](TEST-CASES-FLOW-1-RESERVATION.md):** Kiểm thử Đặt chỗ ô kho, sơ đồ vị trí, giữ capacity 48h, tính tiền cọc, concurrency và hủy đơn hoàn tiền.
2. **[TEST-CASES-FLOW-2-CHECKIN.md](TEST-CASES-FLOW-2-CHECKIN.md):** Kiểm thử Quy trình Check-in, xác minh CCCD, ký số biên bản bàn giao điện tử, cấp PIN 6 số, kích hoạt Hợp đồng/Ô kho, xử lý No-show sau 10 ngày.
3. **[TEST-CASES-FLOW-3-RETURN.md](TEST-CASES-FLOW-3-RETURN.md):** Kiểm thử Quản lý kho đang thuê, tự động đánh dấu trả kho trước 1 tháng, nghiệm thu hiện trạng trả kho, bồi thường thiệt hại, hoàn trả Deposit trong 7 ngày làm việc.
4. **[TEST-CASES-FLOW-4-BUSINESS.md](TEST-CASES-FLOW-4-BUSINESS.md):** Kiểm thử Quản lý cơ sở toàn hệ thống, cấu hình chính sách nghiệp vụ phiên bản hóa, khung giá theo Unit Type x Facility, giám sát doanh thu & tỷ lệ lấp đầy.
5. **[TEST-CASES-FLOW-5-FACILITY-STAFF.md](TEST-CASES-FLOW-5-FACILITY-STAFF.md):** Kiểm thử Quản lý danh mục Unit Type, ô kho vật lý, phân công nhân viên ca trực hằng ngày, xem checklist công việc, báo cáo cơ sở.
6. **[TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md](TEST-CASES-FLOW-6-RENEWAL-OVERDUE.md):** Kiểm thử Gia hạn trực tuyến (lịch nhắc 60, 7, 3, 1 ngày); Xử lý quá hạn D+1..D+3 ân hạn, D+4..D+10 phạt 10%/ngày (trần 70%), D+10 chấm dứt khóa PIN và niêm phong kho offline.
7. **[TEST-CASES-FLOW-7-SUPPORT.md](TEST-CASES-FLOW-7-SUPPORT.md):** Kiểm thử Gửi ticket hỗ trợ (mất chìa, lỗi PIN, hỏng kho), phân loại & phân công theo SLA 2h, nghiệm thu đóng ticket và auto-close sau 7 ngày làm việc.
8. **[TEST-CASES-SECURITY-API-NONFUNCTIONAL.md](TEST-CASES-SECURITY-API-NONFUNCTIONAL.md):** Kiểm thử Bảo mật xác thực JWT, Phân quyền RBAC 403, IDOR, chuẩn hóa REST API Status Codes, làm tròn 1.000 VND và hiệu năng đồng thời.
