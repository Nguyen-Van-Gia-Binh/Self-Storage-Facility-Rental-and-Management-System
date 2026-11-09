# SMARTSTORAGE — BỘ NỘI DUNG SLIDE HOÀN CHỈNH (CHỐT CUỐI CÙNG)

> **Đề tài:** Hệ thống quản lý và cho thuê kho lưu trữ tự phục vụ (Self-Storage Facility Rental and Management System)  
> **Quy chuẩn thiết kế:** Bám sát 100% mẫu slide tối giản đã được duyệt chốt; **100% Text ngắn gọn, không dùng screenshot**; chuẩn xác tuyệt đối theo đề tài (5 Actors, 7 Flows, 27 Mã chức năng).  
> **Đội ngũ phát triển (4 thành viên):** Nguyễn Văn Gia Bình · Nguyễn Phạm Xuân Nhi · Huỳnh Nhật · Lê Thanh Tùng.

---

### SLIDE 1: COVER
**SMARTSTORAGE**  
AN AUTOMATED SELF-STORAGE FACILITY RENTAL AND MANAGEMENT SYSTEM.  
*NGUYỄN VĂN GIA BÌNH · NGUYỄN PHẠM XUÂN NHI · HUỲNH NHẬT · LÊ THANH TÙNG*

---

### SLIDE 2: Problems & Context

**MANUAL ALLOCATION & OVERBOOKING**  
Rigid upfront unit locking creates artificial shortage, inventory fragmentation, and idle capacity.

**UNENFORCED OVERDUE & BAD DEBT**  
Unregulated overdue leases cause prolonged revenue loss with zero automated enforcement or collateral recovery.

**HIGH OPERATIONAL FRICTION**  
Manual paper contracts, physical handovers, and in-person key handoffs inflate labor costs and trigger disputes.

---

### SLIDE 3: SOLUTION - CORE FEATURES

**RESERVATION & 2D ALLOCATION WORKBENCH (01)**  
Capacity-first booking by unit type, dynamic 2D grid allocation, 8-day turnover buffer, and flexible unit re-assignment.  
*(Flow 1 & Flow 5 · Storage Customer & Facility Manager)*

---

### SLIDE 4: SOLUTION - CORE FEATURES

**24/7 CONTACTLESS SMART PASS & HANDOVER (02)**  
1. Automated 6-digit dynamic PIN activation at 00:00  
2. 4-point physical unit condition verification  
3. Instant unit relocation or 100% refund on rejection  
*(Flow 2 & Flow 3 · Storage Customer & Facility Staff)*

---

### SLIDE 5: SOLUTION - CORE FEATURES

**RENEWAL, 8-DAY OVERDUE & SUPPORT DESK (03)**  
1. Self-service lease extension with instant payment  
2. Automated "No Pay, No PIN" overdue lockout  
3. Day 8 deposit liquidation & on-site issue ticketing  
*(Flow 6 & Flow 7 · Storage Customer, Facility Staff & Manager)*

---

### SLIDE 6: SOLUTION - CORE FEATURES

**EXECUTIVE BOM DASHBOARD & GOVERNANCE (04)**  
1. Real-time 4-stream revenue & occupancy analytics  
2. Dynamic m² pricing & system-wide policy rules  
3. 5-role RBAC permission & activity audit logs  
*(Flow 4 & Flow 5 · Business Operations Manager & System Administrator)*

---

### SLIDE 7: SYSTEM ARCHITECTURE

**PRESENTATION TIER (CLIENT)**  
React Single-Page Application with 5 isolated Role-Based Portals (Customer, Staff, Manager, BOM, Admin).

**API & SECURITY GATEWAY**  
Spring Security 6 with stateless JWT authentication, CORS filtering, and RBAC authorization (/api/v1/*).

**BUSINESS & DOMAIN SERVICES**  
Spring Boot 3 domain services, scheduled cron background engines, and 2-level caching (Caffeine L1 + Redis L2).

**DATA PERSISTENCE TIER**  
Spring Data JPA / Hibernate with PostgreSQL (Neon Serverless) and Flyway automated schema versioning.

---

### SLIDE 8: TECHNOLOGY STACK

**FRONTEND:**  
React + Vite (TypeScript & TailwindCSS)

**BACKEND:**  
Java 17 LTS + Spring Boot 3 (RESTful API)

**DATABASE & MIGRATION:**  
PostgreSQL + Flyway (Automated schema migration & Neon Serverless Cloud DB)

**SECURITY & PAYMENT:**  
VietQR Sandbox + JWT (Banking sandbox · access control for 5 roles)

---

### SLIDE 9: DEMO
**DEMO**  
*Interactive End-to-End Walkthrough Across 5 Actors & 7 Business Flows*

---

### SLIDE 10: THANK YOU
**THANK YOU**  
*SmartStorage — Next-Gen Automated Self-Storage Platform*  
*Q&A Session · We are ready for your questions!*
