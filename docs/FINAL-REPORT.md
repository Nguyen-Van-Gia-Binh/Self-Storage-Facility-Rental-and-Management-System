# FINAL SYSTEM ARCHITECTURE & ENGINEERING REPORT

## Self-Storage Facility Rental and Management System (SWP391)

> **Document Type:** Comprehensive Final Technical Report  
> **Course:** Software Development Project (SWP391) — FPT University  
> **Technical Stack:** Java 17 LTS · Spring Boot 3 · PostgreSQL 16 · Flyway · React 18 · TypeScript · Vite · Tailwind CSS  
> **Target Deliverable:** Group Final Report (LMS Week 10 Submission) — `GroupName_NguyenVanGiaBinh.pdf`  
> **Architecture Style:** Domain-Driven Design (DDD) Layered Architecture with Multi-Facility Isolation

---

# TABLE OF CONTENTS

- [1. FEATURE SPECIFICATION & PROCESS ARCHITECTURE](#1-feature-specification--process-architecture)
  - [1.1 Activity Swimlane Workflows](#11-activity-swimlane-workflows)
    - [1.1.0 End-to-End Operational Lifecycle Overview](#110-end-to-end-operational-lifecycle-overview)
    - [1.1.1 Flow 1 — Storage Unit Reservation & Waitlist CRM](#111-flow-1--storage-unit-reservation--waitlist-crm)
    - [1.1.2 Flow 2 — Check-in, Physical Handover & Auto-Activation](#112-flow-2--check-in-physical-handover--auto-activation)
    - [1.1.3 Flow 3 — Unit Return, Win-Win Early Return & Final Settlement](#113-flow-3--unit-return-win-win-early-return--final-settlement)
    - [1.1.4 Flow 4 — Business Operations Management, Pricing & Revenue](#114-flow-4--business-operations-management-pricing--revenue)
    - [1.1.5 Flow 5 — Facility Unit Layout Management & Staff Scheduling](#115-flow-5--facility-unit-layout-management--staff-scheduling)
    - [1.1.6 Flow 6.1 — Contract Renewal & Conflict Resolution](#116-flow-61--contract-renewal--conflict-resolution)
    - [1.1.7 Flow 6.2 — Overdue Handling, Penalty Escalation & Eviction](#117-flow-62--overdue-handling-penalty-escalation--eviction)
    - [1.1.8 Flow 7 — Customer Support, Incident Management & Compensation](#118-flow-7--customer-support-incident-management--compensation)
  - [1.2 Entity State Machine Diagrams](#12-entity-state-machine-diagrams)
    - [1.2.1 RentalContract Entity State Machine](#121-rentalcontract-entity-state-machine)
    - [1.2.2 StorageUnit Entity State Machine](#122-storageunit-entity-state-machine)
    - [1.2.3 Reservation Entity State Machine](#123-reservation-entity-state-machine)
    - [1.2.4 SupportRequest Entity State Machine](#124-supportrequest-entity-state-machine)
    - [1.2.5 Waitlist Entity State Machine](#125-waitlist-entity-state-machine)
    - [1.2.6 PaymentTransaction Entity State Machine](#126-paymenttransaction-entity-state-machine)
- [2. DATA MODEL SPECIFICATION](#2-data-model-specification)
  - [2.1 Conceptual Data Model (CDM)](#21-conceptual-data-model-cdm)
  - [2.2 Unified Physical Entity-Relationship Diagram (ERD)](#22-unified-physical-entity-relationship-diagram-erd)
- [3. BUSINESS RULES & SYSTEM ENFORCEMENT](#3-business-rules--system-enforcement)

---

# 1. FEATURE SPECIFICATION & PROCESS ARCHITECTURE

The Self-Storage Facility Rental and Management System provides a multi-role digital operating platform engineered for secure self-storage operations. The system serves five dedicated actors: **Storage Customer**, **Facility Staff**, **Facility Manager (FM)**, **Business Operations Manager (BOM)**, and **System Administrator**, coordinated through 7 end-to-end business flows.

## 1.1 Activity Swimlane Workflows

### 1.1.0 End-to-End Operational Lifecycle Overview

![End-to-End Operational Lifecycle](diagrams/report/swimlane/sl-00-end-to-end.png)

---

### 1.1.1 Flow 1 — Storage Unit Reservation & Waitlist CRM

![Flow 1 Swimlane](diagrams/report/swimlane/sl-01-reservation.png)

---

### 1.1.2 Flow 2 — Check-in, Physical Handover & Auto-Activation

![Flow 2 Swimlane](diagrams/report/swimlane/sl-02-checkin-handover.png)

---

### 1.1.3 Flow 3 — Unit Return, Win-Win Early Return & Final Settlement

![Flow 3 Swimlane](diagrams/report/swimlane/sl-03-return-settlement.png)

---

### 1.1.4 Flow 4 — Business Operations Management, Pricing & Revenue

![Flow 4 Swimlane](diagrams/report/swimlane/sl-04-bom-operations.png)

---

### 1.1.5 Flow 5 — Facility Unit Layout Management & Staff Task Dispatch

![Flow 5 Swimlane](diagrams/report/swimlane/sl-05-facility-staff.png)

---

### 1.1.6 Flow 6.1 — Contract Renewal & Conflict Resolution

![Flow 6.1 Swimlane](diagrams/report/swimlane/sl-06-1-renewal.png)

---

### 1.1.7 Flow 6.2 — Overdue Handling, Penalty Escalation & Eviction

![Flow 6.2 Swimlane](diagrams/report/swimlane/sl-06-2-overdue.png)

---

### 1.1.8 Flow 7 — Customer Support, Incident Management & Compensation

![Flow 7 Swimlane](diagrams/report/swimlane/sl-07-support.png)

---

## 1.2 Entity State Machine Diagrams

### 1.2.1 RentalContract Entity State Machine

![RentalContract State Machine](diagrams/report/state/st-rental-contract.png)

---

### 1.2.2 StorageUnit Entity State Machine

![StorageUnit State Machine](diagrams/report/state/st-storage-unit.png)

---

### 1.2.3 Reservation Entity State Machine

![Reservation State Machine](diagrams/report/state/st-reservation.png)

---

### 1.2.4 SupportRequest Entity State Machine

![SupportRequest State Machine](diagrams/report/state/st-support-request.png)

---

### 1.2.5 Waitlist Entity State Machine

![Waitlist State Machine](diagrams/report/state/st-waitlist.png)

---

### 1.2.6 PaymentTransaction Entity State Machine

![PaymentTransaction State Machine](diagrams/report/state/st-payment-transaction.png)

---

# 2. DATA MODEL SPECIFICATION

## 2.1 Conceptual Data Model (CDM)

![Conceptual Data Model](diagrams/report/data/conceptual-model.png)

---

## 2.2 Unified Physical Entity-Relationship Diagram (ERD)

![Unified Physical ERD](diagrams/report/data/erd-unified.png)

---

# 3. BUSINESS RULES & SYSTEM ENFORCEMENT

The following formal specification establishes the system's operational invariants, parameter boundaries, financial calculation models, and concrete enforcement mechanics adhering to international requirements engineering standards. The specification is organized across 25 functional domains, detailing atomic declarative business rules alongside exact system enforcement actions and error handling while strictly eliminating programmatic code keys and implementation artifacts.

| Function | Business Rules |
| :--- | :--- |
| **Account Registration & Email Verification** | 1. Validate required registration fields (full name, email, phone number, password) and trim identity inputs without altering passwords (`BR-GEN-07`).<br><br>2. Enforce email regex format, backend password complexity (minimum 8 characters, alphanumeric + special character), confirmation matching, and maximum field length limits.<br><br>3. Hash passwords securely using BCrypt before persisting; never accept or store client-supplied role or account status.<br><br>4. Prevent duplicate submissions; handle duplicate email/phone conflicts, invalid formats, and server errors distinctly with appropriate HTTP status codes.<br><br>5. Never mark an account as active until email verification is confirmed by the server.<br><br>6. Email OTP verification tokens must expire in 10 minutes, be strictly single-use, and enforce a 60-second resend cooldown (`BR-ACC-02`).<br><br>7. Normalize identity strings consistently; enforce database-level unique constraints on email and phone number.<br><br>8. Unverified accounts cannot access authenticated customer features. |
| **Authentication, JWT & Access Control** | 1. Use generic authentication error messages ("Invalid email or password") to prevent user enumeration attacks.<br><br>2. Normalize login identity consistently with registration; verify credentials server-side via BCrypt password matching.<br><br>3. Issue short-lived stateless JWT access tokens (15-minute validity) paired with cryptographically secure, rotating refresh tokens (7-day validity) stored in HTTP-only cookies; never expose tokens in URLs or logs.<br><br>4. Enforce strict Role-Based Access Control (RBAC) across 5 system roles (Customer, Facility Staff, Facility Manager, Business Operations Manager, System Administrator) on every protected backend endpoint; frontend guards are strictly supplementary (`BR-ACC-03`).<br><br>5. Enforce multi-facility data isolation; confine Facility Staff and Facility Managers strictly to assigned facility scopes, rejecting cross-facility access attempts (`BR-ACC-04`, `BR-ACC-05`).<br><br>6. Invalidate refresh tokens and clear local session state upon logout; immediately reject access tokens for deactivated or suspended accounts.<br><br>7. Reject forged roles, malformed JWT payloads, and unauthorized operations with HTTP 401 Unauthorized or HTTP 403 Forbidden. |
| **User Profile & Password Management** | 1. Users may view and update only their own profile; identity must derive strictly from authenticated security context, never from client-supplied user identifiers.<br><br>2. Profile updates cannot modify assigned roles, account status, or internal verification flags.<br><br>3. Changing email or phone number triggers mandatory re-verification and uniqueness collision checks across active user records.<br><br>4. Enforce one canonical profile per user; reject duplicate or conflicting identity records with HTTP 409 Conflict.<br><br>5. Failed profile updates must not appear as saved in the UI; reloads must reflect authoritative server state.<br><br>6. Password reset requests require verified email OTP tokens; reset tokens become invalid immediately upon first successful use. |
| **Master Unit Types & Catalog Administration** | 1. Master Unit Types are centrally governed by BOM, standardizing physical dimensions (width, length, height), usable volume ($m^3$), standard floor area ($m^2$), and baseline monthly rate catalog (`BR-BOM-01`, `BR-PRI-01`).<br><br>2. Master Unit Type codes and names must be unique across the enterprise; duplicate specifications are rejected at both service validation and database constraints.<br><br>3. Deactivating a Master Unit Type is permitted only when no active storage units or pending contracts depend on it; historical contract references are permanently preserved.<br><br>4. Updating Master Unit Type base prices generates immutable price version snapshots without retroactive effects on existing leases.<br><br>5. Validate physical dimension boundaries ($>0$) and ensure volume and area calculations are derived server-side from canonical dimensions. |
| **Facility Floorplan & Unit Spatial Mapping** | 1. Storage units must instantiate strictly from approved BOM Master Unit Types, inheriting valid dimensions and category traits (`BR-AVL-05`).<br><br>2. Enforce unique storage unit numbers within each facility via facility-scoped uniqueness constraints.<br><br>3. Validate spatial layout coordinates (floor, zone, row, column); duplicate coordinates within the same facility are strictly prohibited (`BR-AVL-06`).<br><br>4. Deletion of physical units is restricted; units with historical reservations, contracts, or inspection logs must be soft-deleted or marked Out of Service.<br><br>5. Moving a unit to Maintenance or Out of Service immediately decrements real-time facility usable capacity quota. |
| **Public Facility & Unit Availability Catalog** | 1. Guests and prospective customers may browse active facilities and published unit types without authentication.<br><br>2. Compute real-time available capacity across active booking windows by Unit Type quota rather than unassigned physical compartments (`BR-AVL-01`).<br><br>3. Exclude Inactive facilities and Out of Service units from public search results and availability calculations.<br><br>4. Total counts and pricing summaries must use identical filter predicates as detail cards; late search responses must not overwrite newer queries.<br><br>5. Display accurate base monthly rates plus facility-specific regional price surcharges configured by BOM (`BR-PRI-02`). |
| **Regional Pricing & Auxiliary Surcharges** | 1. BOM may configure facility-specific pricing overrides adjusting rental rates based on prime location and demand (`BR-PRI-02`).<br><br>2. All prorated daily calculations enforce standard monthly day divisor convention (daily divisor = 30 days) (`BR-PRI-03`).<br><br>3. Pricing changes generate immutable price version records; active contracts retain their creation-time pricing snapshot until renewal.<br><br>4. Standardize enterprise auxiliary service fees (emergency unlock, cleaning surcharge, packaging materials) with system-enforced rate caps (`BR-PRI-04`).<br><br>5. Validate that all configured prices and surcharges are non-negative values ($\ge 0$); negative fees are rejected with HTTP 400 Bad Request. |
| **Online Storage Unit Reservation & Booking Intake** | 1. Enforce a maximum advance booking window of 30 days with start date $\ge$ current date (`BR-RES-01`).<br><br>2. Hold capacity quota for 48 hours in Pending Payment status without immediate physical unit allocation (`BR-RES-02`, `BR-DEP-03`).<br><br>3. Limit active pending draft reservations to a maximum of 3 concurrent requests per customer account to prevent capacity hoarding (`BR-SPAM-01`).<br><br>4. Unpaid draft reservations automatically expire after 48 hours via scheduled background jobs, returning held quota to the public pool (`BR-DEP-03`).<br><br>5. Reservation cancellation provides 100% full refund if cancelled within 48h cooling-off or $\ge 7$ days prior; 50% refund between 2..6 days; 0% refund within 48h of move-in (`BR-CAN-01`..`03`).<br><br>6. Prevent double-booking via transactional capacity checks with pessimistic locking during reservation confirmation. |
| **Waitlist CRM & Customer Intake** | 1. Allow free entry into FIFO Waitlist queue when facility unit type capacity reaches zero available slots (`BR-WAT-01`).<br><br>2. Prevent duplicate waitlist entries for the same customer, facility, and unit type combination.<br><br>3. Facility Managers acquire an exclusive 2-hour CRM operational lock on customer records during outbound sales consultations (`BR-WAT-02`).<br><br>4. Converting a waitlist record holds a vacant unit for 2 hours before automatic timeout (`BR-WAT-03`).<br><br>5. Waitlist cancellation by customer or expiration automatically advances the next eligible customer in the FIFO queue. |
| **Online VNPay Payment Gateway & Invoicing** | 1. Require full upfront settlement of initial invoice comprising 1.0x monthly deposit plus selected rental duration ($N$ months rent) (`BR-DEP-01`, `BR-PAY-01`).<br><br>2. Process online gateway payments exclusively via VNPay Sandbox secure return and callback verification with strict order code, cryptographic checksum, and transaction amount validation (`BR-PAY-02`).<br><br>3. Payment gateway URLs expire after 15 minutes; reservation payment orders expire after 48 hours (`BR-PAY-03`).<br><br>4. Record every inbound payment charge and outbound refund voucher as an auditable payment transaction row across checkout, renewal, penalty, and settlement flows (`BR-PAY-06`).<br><br>5. Disaggregate enterprise revenue into four distinct accounting streams: Rental Fees, Security Deposits, Overdue Penalties, and Extra Service Fees (`BR-BOM-05`, `BR-BOM-06`).<br><br>6. Idempotent webhook handling: duplicate callbacks for an already confirmed payment transaction must return HTTP 200 without re-triggering downstream reservation or contract listeners. |
| **Move-in Pass Verification & Staff Desk Lookup** | 1. Staff Desk terminal verifies customer booking code or scans Move-in Pass QR code to look up confirmed reservation records (`BR-CHK-01`).<br><br>2. Validate that the reservation belongs to the staff member's assigned facility; cross-facility access is rejected (`BR-ACC-04`).<br><br>3. Verify customer identity against government-issued Citizen ID or Passport before initiating physical handover (`BR-CHK-01`).<br><br>4. Ensure physical unit allocated strictly matches confirmed unit type dimensions and specifications (`BR-AVL-04`).<br><br>5. Reject move-in attempts for reservations in Pending Payment, Cancelled, or Expired status. |
| **Check-in Inspection & Physical Handover** | 1. Mandatory execution of 4-point on-site physical handover checklist: Smart Lock operational integrity, compartment cleanliness, lighting, and climate control (`BR-CHK-02`).<br><br>2. Support emergency instant unit swap to an equivalent vacant unit within the same type if defects or cleanliness issues are found during handover (`BR-CHK-04`).<br><br>3. Require mutual digital confirmation signatures from both customer and inspecting staff member before activating lease (`BR-CHK-03`).<br><br>4. Customer may reschedule move-in start date once by up to 7 days with prorated daily adjustment if requested $\ge 48$ hours prior (`BR-RES-06`).<br><br>5. Auto-activation safety scheduler activates contract and assigns PIN automatically at Day 11 23:59:59 (10-day check-in grace period) if customer is a no-show (`BR-CAN-04`, `BR-CHK-05`). |
| **Smart Lock Access PIN & Security Keypad** | 1. Generate a unique, cryptographically random 6-digit access PIN upon successful handover; never store or log PIN in plaintext (`BR-CHK-03`).<br><br>2. Synchronously verify PIN credentials with physical Smart Lock hardware before completing move-in protocol (`BR-ACC-01`).<br><br>3. Smart Lock PIN becomes active immediately upon contract activation and is revoked at contract termination or overdue suspension (`BR-OVD-01`).<br><br>4. Support emergency 24-hour temporary PIN re-issuance for forgotten codes or keypad lockouts with mandatory customer identity validation (`BR-SUP-03`).<br><br>5. Physical staff override: emergency battery replacement and physical master key override for hardware failure incidents (`BR-SUP-03`). |
| **Rental Contract Lifecycle & Active Lease Tracking** | 1. Rental duration structured strictly in whole integer months ($N \ge 1$), prohibiting fragmented fractional monthly contracts (`BR-GEN-03`).<br><br>2. Contract entity transitions strictly through valid state machine: Pending Check-in $\rightarrow$ Active $\rightarrow$ Pending Return / Overdue $\rightarrow$ Returned / Terminated $\rightarrow$ Closed (or Cancelled prior to physical move-in).<br><br>3. Derive customer identity from authenticated session; reject client-supplied contract IDs not owned by the caller (Anti-IDOR protection).<br><br>4. Active contracts bind immutable snapshot references to governing policy version and price version captured at contract creation (`BR-GEN-02`).<br><br>5. Dispatch automated proactive checkout and renewal advisory notifications at 30 days prior to contract expiration date (`BR-RET-01`). |
| **Customer Self-Service Renewal** | 1. Customer Portal self-service online renewal is active while contract is Active and at least 20 days remain before expiration date; requests within 20 days fail with deadline passed error (`BR-REN-09`), and Overdue leases fail with renewal blocked error.<br><br>2. Renewal extension requires whole integer months (1 to 12 months) and an active Unit Type (`BR-REN-03`).<br><br>3. Existing security deposit carries forward automatically without duplicate charges (`BR-DEP-01`), while future reservations or contracts overlapping across operational safety buffer days block renewal due to capacity unavailability.<br><br>4. Online payment confirmation triggers asynchronous, idempotent post-commit event processing, extending contract end date directly on the Active lease without intermediate locking states. |
| **Early Lease Termination (Win-Win Early Return)** | 1. Customer may request early contract termination anytime while contract status is Active (`BR-RET-01`).<br><br>2. Enforce Win-Win Early Return policy: premature termination forfeits 100% of held security deposit as contract termination penalty (`BR-RET-06`).<br><br>3. Refund 100% of unused future rental fees prorated from the approved checkout return date (`BR-RET-06`).<br><br>4. Early termination schedule requires Facility Manager review and creation of a scheduled exit return appointment.<br><br>5. Premature termination locks contract against further renewals and initiates unit turnaround preparation. |
| **Checkout Return Inspection & Damage Assessment** | 1. Mandatory on-site exit inspection conducted by assigned staff evaluating unit structural integrity, lock mechanism, trash clearance, and cleanliness (`BR-RET-04`).<br><br>2. Mandatory upload of timestamped photographic evidence for any detected physical damage or excessive trash (`BR-RET-10`).<br><br>3. Itemized damage repair costs and cleaning surcharges logged as extra charges against final deposit settlement ledger (`BR-RET-05`).<br><br>4. Inspection checklist records require digital signatures from both inspecting staff and customer.<br><br>5. Facility Manager final operational approval required on all damage assessments before settlement execution (`BR-RET-07`). |
| **Final Deposit Settlement & Refund Disbursement** | 1. Calculate net final settlement balance via deterministic formula: $\text{Net} = \text{Deposit} - \text{Damage Deductions} - \text{Overdue Debt} + \text{Unused Rent}$ (`BR-RET-08`).<br><br>2. If $\text{Net} > 0$, system generates a refund disbursement voucher to customer registered bank account within 3 to 5 business days (`BR-RET-08`).<br><br>3. If $\text{Net} < 0$, system logs outstanding customer liability balance and issues supplemental invoice.<br><br>4. Contract transitions from Returned (or Terminated) to Closed immediately upon Facility Manager approval of net settlement voucher (`BR-RET-07`).<br><br>5. Auditable settlement balances and payment transaction records persist every deposit liquidation, damage deduction, and refund payout (`BR-PAY-06`). |
| **Unit Status Management & Sanitation / Cleaning** | 1. Following checkout inspection, unit transitions immediately into Cleaning status; direct return to Available is strictly prohibited (`BR-RET-09`).<br><br>2. Storage units cannot return to Available until assigned facility staff completes sanitation protocol and marks cleaning complete (`BR-RET-09`).<br><br>3. Transitioning units to Maintenance or Out of Service instantly updates available booking quota across public catalogs (`BR-AVL-06`).<br><br>4. Prohibit moving a unit to Inactive if an active contract, pending reservation, or unliquidated goods are associated with it.<br><br>5. Audit log all physical unit status transitions with staff actor ID, reason code, and timestamp (`BR-GEN-06`). |
| **Overdue Monitoring & Daily Penalty Escalation** | 1. Enforce "No Pay, No PIN" policy: immediately revoke Smart Lock PIN access on Day 1 following lease expiry (`BR-OVD-01`, `BR-OVD-05`).<br><br>2. Grace period Days 1 to 3 incurs zero contract violation penalty, accruing daily storage fee of 5% of deposit per day (`BR-OVD-02`).<br><br>3. Daily 10% penalty escalation during Days 4 to 6, capping total accrued overdue fees strictly at 55% of deposit (`BR-OVD-03`, `BR-OVD-04`).<br><br>4. Scheduled daily overdue evaluation jobs run at midnight in isolated transactions against immutable policy versions and release Day 8 units (`BR-AVL-02`).<br><br>5. Full payment of overdue penalty via online gateway resets accrued overdue debt to zero and re-issues a 6-digit access PIN while keeping contract in Overdue status strictly to unlock return notice submission (`BR-OVD-08`). |
| **Eviction, Asset Seizure & Central Warehouse Storage** | 1. At Day 7, overdue contract transitions to Terminated and liquidates 100% of held security deposit (55% overdue fee + 45% impound/transfer fee) (`BR-OVD-07`).<br><br>2. Physical compartment transitions to Maintenance for 1 day on Day 7 while staff seals compartment, inventories contents, and transfers goods to Central Warehouse (`BR-OVD-07`).<br><br>3. Physical storage unit is released to Available on Day 8, perfectly matching the 8-day operational buffer cycle (`BR-AVL-02`).<br><br>4. Confiscated customer goods are held at Central Warehouse for a mandatory 30-day holding period before executing offline public asset liquidation (`BR-OVD-11`).<br><br>5. Eviction inventory log requires dual staff signatures and photographic evidence of all impounded items. |
| **Customer Support Tickets & Incident Resolution** | 1. Customers submit support tickets across 5 categories (Unit Damage, Lock Access, Payment, Belongings, Other), with Lock Access auto-flagged urgent for on-duty shift response without rigid hardcoded countdown timers (`BR-SUP-01`).<br><br>2. Enforce ticket lifecycle workflow: New $\rightarrow$ Assigned $\rightarrow$ In Progress $\rightarrow$ Resolved (or Closed upon direct settlement), with customer confirmation supporting satisfaction closure or reopening (`BR-SUP-02`).<br><br>3. Staff and Managers may access and resolve tickets strictly within their assigned facility scope (`BR-ACC-04`).<br><br>4. When unit relocation is required, staff cannot close ticket prematurely; Facility Manager executes unit reassignment preserving original unit rent and deposit, moving old unit to Maintenance, and closing the ticket (`BR-AVL-05`).<br><br>5. Automated support closing jobs run daily to auto-close non-relocation resolved tickets after 7 working days without customer dispute (`BR-SUP-05`). |
| **Staff Task Dispatch & Daily Operations Worklist** | 1. Facility Manager inspects staff workload and dispatches check-in, return, or incident tasks (`BR-FM-01`, `BR-FM-06`).<br><br>2. Validate that target staff accounts hold Active status and belong to the target facility branch (`BR-ACC-04`).<br><br>3. Maintain daily staff assignments and surface aggregated daily tasks on the Staff Desk worklist, flagging late pending handovers within the check-in grace window (`BR-FM-01`, `BR-FM-06`).<br><br>4. Facility-scoped access checks block cross-branch unit and task operations (`SA-03`).<br><br>5. Audit log task assignments and completion timestamps for operational KPI evaluation (`BR-GEN-06`). |
| **Enterprise Policy Governance & Versioning** | 1. System operating parameters (deposit multiplier, hold hours, buffer days, grace period, penalty rates) are configurable exclusively by BOM (`BR-GEN-01`, `BR-BMP-01`).<br><br>2. Policy updates generate immutable policy version snapshots; retroactive modification of active leases is strictly prohibited (`BR-GEN-02`).<br><br>3. Validate parameter boundaries: positive numerical limits, valid penalty caps ($\le 100\%$), and proper time intervals.<br><br>4. All policy changes require BOM digital signature and are recorded in administrative audit logs (`BR-GEN-06`).<br><br>5. System falls back gracefully to active canonical policy defaults if a specific parameter key is omitted from an experimental profile. |
| **Operational Analytics, Occupancy & Financial Ledger** | 1. Compute real-time facility occupancy and Usage Rate KPI: $\text{Usage Rate} = \text{Occupied Units} / \text{Usable Capacity}$ (`BR-BOM-03`).<br><br>2. Operational analytics query read-only replicas or cached views to prevent performance degradation on transactional workflows.<br><br>3. Multi-facility comparative performance scorecards and revenue velocity metrics are restricted to BOM and Admin roles (`BR-BOM-04`).<br><br>4. Financial ledger audit reconciles payment gateway transactions with contract receivables, reporting discrepancies $> 0$ VND (`BR-BOM-06`).<br><br>5. Report date range filters must validate that start date $\le$ end date and restrict maximum analytical query window to 12 months. |

---

_Report compiled and verified by Antigravity Technical Lead for SWP391 Final Defense._
