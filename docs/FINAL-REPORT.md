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

The following formal specification establishes the system's operational invariants, parameter boundaries, financial calculation models, and concrete enforcement mechanics adhering to the international **BABOK (Business Analysis Body of Knowledge)** Business Rules framework (IIBA Technique 10.9) and **IEEE 830 / ISO/IEC/IEEE 29148** requirements engineering standards.

Rules are classified across four standardized operational categories: **Behavioral Constraint** (enforced boundaries and access restrictions), **Structural Definition** (core domain formulas and dimensional invariants), **Derivation / Calculation** (mathematical formulas and proration algorithms), and **Action Enabler** (automated event triggers and entity state machine transitions). Every rule specifies declarative business logic alongside explicit system enforcement and violation handling actions.

| Rule ID | Rule Name | Category | Business Rule Statement | Enforcement & Error Action |
| :--- | :--- | :--- | :--- | :--- |
| `BR-GEN-07` | **Registration Input Sanitization** | `Structural Definition` | User registration requires normalized textual inputs with trimmed whitespace, domestic 10-digit mobile format (`0xxxxxxxxx`), and valid email structure. | HTTP 400 Bad Request with field-specific validation error details. |
| `BR-ACC-01` | **Password Complexity & BCrypt Hashing** | `Behavioral Constraint` | Passwords require a minimum of 8 characters containing at least one uppercase letter, one lowercase letter, one digit, and one special character, securely salted and hashed using BCrypt. | HTTP 400 Bad Request if complexity criteria fail; plain text passwords are never persisted or logged. |
| `BR-ACC-02` | **Account Identity Uniqueness** | `Behavioral Constraint` | Email addresses and phone numbers must be strictly unique across all active user accounts. | HTTP 409 Conflict if duplicate email or phone number is detected in database. |
| `BR-ACC-03` | **Two-Factor Email Account Activation** | `Action Enabler` | Newly registered accounts initialize in Unverified status; system issues a single-use 6-digit OTP token valid for 10 minutes with a 60-second resend cooldown. | Unverified accounts are blocked from authenticated customer operations; token verification transitions account to Active. |
| `BR-ACC-04` | **Stateless Dual-Token Authentication** | `Structural Definition` | Valid credentials issue a 15-minute stateless JWT access token alongside a 7-day cryptographically random refresh token stored in an HTTP-only, secure, strict same-site cookie. | HTTP 401 Unauthorized on invalid or expired access token; refresh token rotation enforced upon renewal. |
| `BR-ACC-05` | **High-Performance Credential Caching** | `Action Enabler` | User authorization credentials are loaded from a 5-minute in-memory cache during authenticated API requests to eliminate redundant database queries. | Cache entry is automatically evicted upon password change, role reassignment, or account deactivation. |
| `BR-ACC-06` | **Multi-Facility Branch RBAC Isolation** | `Behavioral Constraint` | Facility Staff and Facility Managers can query or modify data strictly within their assigned facility branch. | HTTP 403 Forbidden on cross-facility access attempts; actions restricted to assigned facility scope. |
| `BR-ACC-07` | **Session-Scoped Anti-IDOR Protection** | `Behavioral Constraint` | User profile viewing and modification resolve user identity strictly from authenticated security session context without client-supplied IDs. | HTTP 403 Forbidden if client attempts ID tampering; modifying email or phone revokes verification status. |
| `BR-AVL-01` | **Quota-Based Availability Calculation** | `Derivation / Calculation` | Available storage quota equals total active units of target Unit Type minus overlapping active contracts and pending reservations across requested booking dates. | Units under Maintenance or Out of Service are strictly excluded from usable capacity. |
| `BR-AVL-02` | **Post-Lease Operational Safety Buffer** | `Behavioral Constraint` | System automatically reserves an 8-day operational buffer immediately following every contract expiration date. | Capacity quota remains locked during this 8-day window to prevent double-booking during turnover, cleaning, and overdue recovery. |
| `BR-AVL-03` | **Pessimistic Inventory Locking** | `Behavioral Constraint` | Reservation checkout acquires a pessimistic row-level database lock on the Unit Type inventory record. | Rejects concurrent checkout attempts with HTTP 409 Conflict if remaining capacity quota reaches zero. |
| `BR-RES-01` | **Advance Booking Window Limit** | `Behavioral Constraint` | Reservation start dates must fall between the current date and a maximum of 30 days in advance. | HTTP 400 Bad Request; booking requests beyond 30 days are redirected to the Waitlist CRM. |
| `BR-GEN-03` | **Whole-Month Rental Structure** | `Structural Definition` | Rental durations must be structured in whole positive integer months (minimum 1 month). | Fractional monthly bookings or zero-day spans are rejected with HTTP 400 Bad Request. |
| `BR-SPAM-01` | **Anti-Hoarding Draft Reservation Cap** | `Behavioral Constraint` | Customers are limited to a maximum of 3 concurrent pending draft reservations. | HTTP 429 Too Many Requests; blocks additional draft creation until existing drafts are paid or cancelled. |
| `BR-RES-02` | **48-Hour Temporary Capacity Hold** | `Action Enabler` | Draft reservations hold a capacity quota slot in Pending Payment status for exactly 48 hours without binding a physical unit. | Unpaid draft automatically expires after 48 hours, restoring held capacity to the public pool. |
| `BR-PAY-01` | **Mandatory 100% Upfront Settlement** | `Behavioral Constraint` | Booking checkout requires 100% upfront settlement comprising total rental fees for the term plus a security deposit equal to 1.0 month of rent. | Partial payments, split installments, or deferred settlements are rejected. |
| `BR-PAY-02` | **VNPay Gateway Session Expiration** | `Action Enabler` | Online payment checkout URLs expire in exactly 15 minutes from generation timestamp. | Expired checkout sessions are invalidated; customer must regenerate payment session to proceed. |
| `BR-PAY-04` | **Idempotent Payment Callback Processing** | `Action Enabler` | Payment gateway callbacks validate cryptographic HMAC checksums and process transaction references idempotently. | Duplicate callbacks return HTTP 200 without creating duplicate ledger entries or duplicate contracts. |
| `BR-CAN-01` | **Early Cancellation Full Refund Tier** | `Derivation / Calculation` | Cancellations submitted 7 days or more prior to scheduled move-in receive a 100% refund of rental fees and 100% refund of security deposit. | Approved refund voucher is generated and disbursed within 3 to 7 business days. |
| `BR-CAN-02` | **Mid-Window Cancellation Refund Tier** | `Derivation / Calculation` | Cancellations submitted between 48 hours and 7 days prior to move-in receive a 100% refund of rental fees and forfeit 50% of the security deposit. | 50% security deposit is retained by facility as liquidated damages; 50% deposit and 100% rent refunded. |
| `BR-CAN-03` | **Late Cancellation Deposit Forfeiture** | `Derivation / Calculation` | Cancellations submitted within 48 hours of scheduled move-in receive a 100% refund of rental fees and forfeit 100% of the security deposit. | 100% security deposit is retained by facility as short-notice cancellation penalty. |
| `BR-CAN-05` | **Provider-Fault Full Indemnity** | `Action Enabler` | Cancellations triggered by facility structural emergency or unit defects receive a 100% refund of all paid fees with zero customer penalty. | Customer is granted priority rebooking voucher and immediate expedited refund disbursement. |
| `BR-WAT-01` | **Free FIFO Waitlist CRM Intake** | `Structural Definition` | Customers register in the Waitlist CRM queue free of charge when requested inventory is exhausted or desired move-in exceeds 30 days. | Entries are strictly ordered first-in, first-out by timestamp per facility and Unit Type. |
| `BR-WAT-02` | **Exclusive Telesales Consultation Lock** | `Behavioral Constraint` | Facility Managers opening a waitlist record for consultation acquire an exclusive 2-hour lock in Contacting status. | Other managers are locked from editing the record; lock auto-releases to Waiting after 2 hours if unfinalized. |
| `BR-WAT-03` | **Waitlist 24-Hour Payment Hold Conversion** | `Action Enabler` | Waitlist consultations resulting in customer booking agreement generate a reservation with a 24-hour payment hold. | Capacity slot is held for 24 hours; automatically releases if customer fails to pay within 24 hours. |
| `BR-CHK-01` | **Move-in Pass & Citizen ID Verification** | `Behavioral Constraint` | On-site check-in requires verifying customer digital QR Move-in Pass and government Citizen ID or Passport against booking records. | Check-in is rejected if credentials mismatch or if staff member belongs to a different facility branch. |
| `BR-CHK-02` | **Physical Handover Preconditions** | `Behavioral Constraint` | Physical handover walkthrough requires 100% payment, physical unit allocated in Reserved status matching confirmed Unit Type, and on-duty staff assigned from same branch. | System blocks handover e-form submission if any precondition is unmet. |
| `BR-CHK-03` | **4-Point Handover Inspection & Dual Signatures** | `Behavioral Constraint` | Physical walkthrough requires completing the 4-point inspection checklist (lock, clean, light, HVAC) and executing mutual digital signatures. | Handover completion is blocked without dual electronic signatures confirmed. |
| `BR-CHK-04` | **Lease Activation & Unit State Transition** | `Action Enabler` | Confirmation of mutual digital signatures transitions contract from Pending Check-in to Active, and unit from Reserved to Occupied. | System immediately triggers cryptographic smart access PIN generation and automated delivery. |
| `BR-ACC-01` | **Smart Access PIN Generation** | `Action Enabler` | Lease activation generates a unique cryptographically random 6-digit access PIN operating perimeter gates and unit keypads. | Access PIN operates strictly during active lease term; plain text PIN is never stored. |
| `BR-ACC-07` | **Self-Service PIN Regeneration** | `Action Enabler` | Customers experiencing access lockout or forgotten credentials can regenerate a new access PIN online via self-service portal at zero cost in real-time. | Old PIN is immediately invalidated; new PIN is provisioned instantaneously on smart locks. |
| `BR-CHK-06` | **Instant Defect Unit Swap Protocol** | `Action Enabler` | Pre-assigned units exhibiting defects during walkthrough transition to Maintenance, triggering immediate manager reassignment of an alternative Available unit of identical type. | Contract is preserved without cancellation; no additional payment or rebooking fees required. |
| `BR-RES-06` | **Paid Move-in Reschedule Constraints** | `Behavioral Constraint` | Postponing move-in date requires at least 48 hours advance notice, postponement cannot exceed 7 days, and is limited to 1 reschedule per contract. | Daily holding surcharge equals $\text{Postponed Days} \times (\text{Monthly Rent} / 30)$; full payment required before schedule is updated. |
| `BR-AVL-06` | **Midnight Auto-Assignment & Free Upgrade** | `Action Enabler` | Contracts reaching move-in date without pre-assigned physical units trigger midnight scheduler auto-assignment of an Available unit of matching type. | If matching tier is fully booked, system automatically upgrades customer to a higher unit tier at zero additional charge. |
| `BR-CHK-05` | **10-Day Grace & Unattended Auto-Activation** | `Action Enabler` | Customers failing to check in within 10 days of scheduled start date trigger automated contract activation (Deemed Acceptance) on Day 11. | Storage unit transitions to Occupied, access PIN is dispatched via SMS/email, and 100% of rental revenue is secured. |
| `BR-RET-01` | **Online Return Intent Notice** | `Action Enabler` | Customers vacate by submitting return notice online while contract is Active, transitioning contract status to Pending Return. | Generates an inspection dispatch task on the Staff Desk operational queue. |
| `BR-RET-12` | **Pre-Inspection Return Cancellation Window** | `Behavioral Constraint` | Customers can cancel a pending return notice only before staff initiates physical inspection walkthrough. | Cancelling return restores contract to Active (if before end date) or Overdue (if past end date). |
| `BR-RET-04` | **Available Settlement Balance Evaluation** | `Derivation / Calculation` | Return financial settlement balance evaluates as $\max(\text{Deposit}, \text{Unused Rent})$. | Serves as the maximum baseline credit pool from which damage deductions and outstanding debts are subtracted. |
| `BR-RET-06` | **Win-Win Early Termination Proration** | `Derivation / Calculation` | Move-outs during final month ($\le 30$ days left) refund 100% deposit and retain unused days; premature move-outs ($> 30$ days left) forfeit 100% deposit and refund 100% unused future rental days. | Daily proration calculated as $\text{Monthly Rent} / 30$; 100% deposit and unused rent refunded with zero penalty on facility fault. |
| `BR-RET-02` | **Move-out Physical Inspection & Photo Evidence** | `Behavioral Constraint` | Move-out inspection requires staff to inspect structure, lock, cleanliness, and trash, attaching mandatory timestamped photos for any damage. | Inspection record is blocked from submission without photographic evidence of reported defects. |
| `BR-RET-08` | **Standardized Surcharge Catalog Binding** | `Behavioral Constraint` | Repair and trash clearance deductions must be selected strictly from BOM-approved surcharge price schedules. | Staff is blocked from inputting arbitrary or non-catalog prices; snapshots are immutably bound to inspection record. |
| `BR-RET-05` | **Net Settlement Balancing Formula** | `Derivation / Calculation` | Final net balance computes as $\text{Net Balance} = \text{Available Balance} - \text{Damage Deductions} - \text{Overdue Debt}$. | Positive balance is disbursed to customer bank account within 7 business days; negative deficit is invoiced and paid online before closure. |
| `BR-RET-07` | **Contract Closure Approval Gate** | `Action Enabler` | Reconciling net settlement balance to zero enables Facility Manager approval to transition contract to Closed status. | System revokes remaining permissions and archives contract records. |
| `BR-RET-09` | **Post-Checkout Cleaning Quarantine** | `Action Enabler` | Checkout confirmation transitions storage unit immediately to Cleaning status and revokes smart lock access permanently. | Direct transition to Available is blocked; unit releases to Available or Reserved after staff cleaning confirmation or upon a 5-day automated release. |
| `BR-BOM-01` | **Centralized Master Unit Type Governance** | `Behavioral Constraint` | Creating or updating Unit Types is the exclusive enterprise authority of the Business Operations Manager. | HTTP 403 Forbidden if attempted by Facility Manager or non-BOM roles; catalog applies globally across all facilities. |
| `BR-PRI-01` | **Standard Spatial Metrics Specification** | `Structural Definition` | Unit Types standardize dimensions ($W, L, H$ in meters), deriving usable volume ($V = W \times L \times H$), floor area ($A = W \times L$), and base monthly price. | Derived metrics calculated automatically; duplicate Unit Type code or display name rejected by unique constraint. |
| `BR-BOM-02` | **Unit Type Soft-Delete Relational Guard** | `Behavioral Constraint` | Deleting a Unit Type requires system verification that zero physical units or contracts are linked to that type. | Physical deletion blocked with HTTP 409 Conflict if linked; BOM may only toggle status to Inactive. |
| `BR-BOM-03` | **Inactive Unit Type Grandfathering Protocol** | `Behavioral Constraint` | Deactivated Unit Types are immediately excluded from public search and new bookings while active contracts continue until expiration. | System blocks contract renewal on deactivated Unit Types; units retire Out of Service upon lease return. |
| `BR-GEN-01` | **Dynamic System Parameter Engine** | `Structural Definition` | Operational parameters (multipliers, hold hours, buffers, grace periods, penalty rates) are governed dynamically through system policy without code modifications. | Hardcoded business constants are strictly prohibited; all rules read dynamically from active system policy. |
| `BR-GEN-02` | **Immutable Policy Version Snapshotting** | `Action Enabler` | Confirmed reservations and contracts permanently bind immutable snapshots of policy parameters active at creation timestamp. | Subsequent policy or pricing updates do not apply retroactively to existing active contracts. |
| `BR-PRI-02` | **Regional Facility Price Overrides** | `Behavioral Constraint` | BOM facility-specific pricing configurations supersede catalog base prices for that specific facility branch. | Public catalog and reservation calculations reflect facility-specific rates. |
| `BR-PRI-03` | **Standard 30-Day Monthly Day Divisor** | `Derivation / Calculation` | Daily prorated rental rates compute as monthly rent divided by 30 ($\text{Daily Rent} = \text{Monthly Rent} / 30$). | Uniform 30-day divisor applied across all calculations regardless of actual days in the calendar month. |
| `BR-GEN-04` | **Deterministic Currency Ceiling Rounding** | `Derivation / Calculation` | Calculated fee line items in VND round up to the nearest 1,000 VND ceiling. | Total payable sum equals sum of rounded items without secondary re-rounding. |
| `BR-PRI-04` | **Standardized Auxiliary Surcharge Catalog** | `Structural Definition` | Auxiliary fees are categorized into 4 enterprise groups: Access Key, Cleaning, Damage Repair, and Value-Added Services. | Staff select items strictly from BOM-approved fee schedules with immutable price snapshots. |
| `BR-BOM-05` | **4-Stream Disaggregated Financial Ledgers** | `Structural Definition` | Enterprise financial cash flows partition into 4 distinct streams: Rental Revenues, Security Deposits, Overdue Penalties, and Extra Surcharges. | Each payment transaction record references originating contract and payment order entity. |
| `BR-PAY-06` | **Automated Daily Financial Reconciliation** | `Action Enabler` | Daily reconciliation jobs audit online payment gateway settlements against accounts receivable ledgers. | Discrepancies greater than 0 VND trigger automated security alerts to BOM and Administrator. |
| `BR-FM-01` | **Strict Unit Type Spatial Instantiation** | `Behavioral Constraint` | Provisioning physical storage units requires instantiating active BOM-approved Unit Types. | FM cannot create arbitrary dimensions or unapproved environmental specifications. |
| `BR-FM-02` | **Spatial Grid Coordinate Uniqueness** | `Structural Definition` | Storage compartment spatial grid coordinates (floor, zone, row, column) must be unique within each facility branch. | HTTP 409 Conflict if duplicate spatial position is entered in database. |
| `BR-AVL-05` | **Maintenance Capacity Quota Decrement** | `Action Enabler` | Compartments transitioning to Maintenance or Out of Service immediately decrement branch usable capacity quota. | Prevents overbooking in catalog search and reservation intake engines. |
| `BR-FM-05` | **Shift-Based Same-Branch Task Dispatch** | `Behavioral Constraint` | Dispatching check-in handovers, inspections, or maintenance tasks is restricted to active staff members assigned to that branch. | Cross-facility task dispatch rejected with HTTP 400 Bad Request. |
| `BR-FM-06` | **Staff Desk Worklist Aggregation & Alerts** | `Action Enabler` | Daily operational tasks aggregate on Staff Desk queue and visually flag pending move-ins nearing grace period expiry. | Ensures timely physical handover walkthrough and prevents unattended leakage. |
| `BR-REN-01` | **Self-Service Online Renewal Window** | `Behavioral Constraint` | Self-service online renewal is permitted exclusively while contract is Active and at least 20 days remain before expiration date. | Renewal option locked on UI and API if fewer than 20 days remain or if contract is not Active. |
| `BR-REN-09` | **T-20 Cutoff Rule & Waitlist Trigger** | `Action Enabler` | Contracts reaching 20 days prior to expiration without confirmed renewal lock online self-service and flag unit for expiration. | Unit becomes eligible for waitlist customer matching and advance booking intake. |
| `BR-REN-03` | **Whole-Month Extension Constraints** | `Structural Definition` | Contract renewal extensions must be structured in whole integer months between 1 and 12 months. | Fractional monthly renewal extensions are rejected with HTTP 400 Bad Request. |
| `BR-DEP-05` | **Security Deposit Automatic Rollover** | `Action Enabler` | Contract renewals automatically roll over existing security deposits into the renewed term without duplicate charges. | No additional deposit invoice generated unless rental price has increased. |
| `BR-REN-05` | **Active Catalog Pricing on Renewal** | `Behavioral Constraint` | Contract renewals reflect current active catalog pricing at renewal timestamp rather than original lease rates. | System calculates renewal quote dynamically from current price snapshot. |
| `BR-REN-10` | **Supervised Exception Renewal & Late Fee** | `Behavioral Constraint` | Exception renewals approved within final 20 days require FM authorization, cannot conflict with paid waitlist deposits, and assess a fixed 200,000 VND late fee. | Late administrative fee added to renewal invoice; renewal rejected if waitlist deposit already collected. |
| `BR-REN-11` | **2-Step Unit Tier Change & 24h Dual PIN** | `Action Enabler` | Upgrading or downgrading unit categories requires a 2-step transition (settle old contract, issue new contract) with 24-hour dual-PIN access. | Old PIN automatically revoked after 24 hours, transitioning old compartment to Cleaning (`BR-REN-12`). |
| `BR-OVD-01` | **Day 1 Midnight Overdue Transition & PIN Lock** | `Action Enabler` | Contracts expiring without renewal or return notice transition to Overdue at midnight; access PIN is immediately suspended under the "No Pay, No PIN" policy. | Landlord lien secured; customer blacklisted from booking new units (`BR-OVD-09`) and locked from self-renewal (`BR-REN-06`). |
| `BR-OVD-02` | **Grace Storage Fee Tier (Days 1 to 3)** | `Derivation / Calculation` | Overdue days 1 to 3 assess a daily storage fee of 5% of deposit per day (accumulating up to 15%) with zero contract violation penalty. | System dispatches daily payment reminder emails and SMS notifications. |
| `BR-OVD-03` | **Penalty Escalation Tier (Days 4 to 6)** | `Derivation / Calculation` | Overdue days 4 to 6 incur an additional 10% daily violation penalty on top of storage fees (Day 4: 25%, Day 5: 35%, Day 6: 45%, Day 7: 55%). | Automated daily escalation warnings and eviction notice SMS dispatched (`BR-OVD-06`). |
| `BR-OVD-04` | **55% Cumulative Overdue Fee Cap** | `Behavioral Constraint` | Total cumulative overdue charges (storage fees plus violation penalties) are strictly capped at 55% of the security deposit. | Maximum accrued debt is bounded to 55% of security deposit prior to formal foreclosure. |
| `BR-OVD-08` | **Intra-Day PIN Reprovisioning Protocol** | `Action Enabler` | Settling 100% of accrued overdue debt online restores temporary PIN access valid until 23:59:59 and unlocks return notice submission. | Submitting return notice immediately revokes temporary PIN; failure to submit return before midnight re-locks PIN without extending Day 7 deadline. |
| `BR-OVD-07` | **Day 7 Forced Eviction & 100% Deposit Liquidation** | `Action Enabler` | Contracts reaching Day 7 overdue are forcibly terminated; 100% of security deposit is liquidated (55% for overdue debt, 45% for lock cutting, transport, and inventory auditing). | Unit enters Maintenance for 1-day content inventory and returns to Available on Day 8, satisfying the 8-day buffer (`BR-AVL-02`). |
| `BR-OVD-11` | **Central Warehouse 30-Day Holding & Auction** | `Action Enabler` | Impounded belongings are held in Central Warehouse for up to 30 days; unclaimed goods are liquidated via public auction. | Reclaiming goods within 30 days requires paying storage deficit; FM approves contract closure with zero balance post-auction. |
| `BR-SUP-01` | **Standardized Support Intake & Urgent Routing** | `Structural Definition` | Customer support tickets categorize into 5 classes: Unit Damage, Lock Access, Payment Issue, Belongings Inquiry, and Other. | Lock Access auto-flagged urgent for on-duty shift response; rigid 2-hour countdown timers eliminated. |
| `BR-SUP-02` | **On-Site Liability Attribution & Surcharge Settlement** | `Behavioral Constraint` | Support incident investigation attributes liability: company fault carries 100% facility responsibility; customer fault assesses surcharges from BOM catalog. | Ticket closure blocked until customer settles all assessed surcharges. |
| `BR-SUP-03` | **Emergency Relocation Flag & Unit Reassignment** | `Action Enabler` | Severe structural or environmental hazards threatening stored goods trigger emergency relocation flagging by inspecting staff. | FM reassigns contract to equivalent vacant unit of same type at identical rent, moving damaged unit to Maintenance (`BR-AVL-05`). |
| `BR-SUP-04` | **No-Bailment Commercial Lease Doctrine & Liability Caps** | `Behavioral Constraint` | Tenant stores property under commercial space lease doctrine (no bailment, exclusive tenant key/PIN control); standard damage liability is capped at 10,000,000 VND. | Optional extended protection (50,000 VND/month up to 50,000,000 VND); storing prohibited hazardous contraband voids all liability protection. |
| `BR-BMP-03` | **Force Majeure Disaster Relief Voucher** | `Derivation / Calculation` | Force majeure facility disasters (e.g. fire) provide 100% full refund plus a 1-month rental compensation voucher for future leases. | Disbursed immediately with priority relocation to another facility branch. |
| `BR-SUP-05` | **7 Business Days Inactivity Auto-Close** | `Action Enabler` | Resolved support tickets without customer dispute automatically transition to Closed status after 7 consecutive business days. | Weekends and official public holidays excluded; ticket status transitions to Closed. |
| `BR-BOM-04` | **Database-Push Analytical Aggregation** | `Structural Definition` | Revenue and occupancy analytical reports execute aggregations (SUM, COUNT, GROUP BY) directly within database queries. | In-memory collection filtering prohibited to prevent out-of-memory errors on large contract volumes. |
| `BR-GEN-06` | **Immutable System Activity Audit Logging** | `Action Enabler` | Security authentication events, role changes, financial transactions, and unit status transitions create immutable system audit logs. | Details operator ID, IP address, target entity, old/new value, and timestamp; logs are append-only. |

---

_Report compiled and verified by Antigravity Technical Lead for SWP391 Final Defense._
