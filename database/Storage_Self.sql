/* ============================================================================
   Self-Storage Facility Rental and Management System
   Thiet ke co so du lieu � SQL Server
   Theo quy uoc CONVENTIONS.md Sec 5 (dat ten, kieu du lieu) va toan bo
   BUSINESS-RULES.md / USE-CASES.md / USER-STORIES*.md da chot.

   Ghi chu:
   - Moi bang deu co created_at, updated_at (DATETIMEOFFSET).
   - Tien: BIGINT (don vi dong, khong thap phan) theo BR-GEN-04.
   - Enum: luu VARCHAR(30) + CHECK, ten hang UPPER_SNAKE_CASE khop Java enum.
   - Khoa chinh: id BIGINT IDENTITY(1,1).
   - File nay la 1 khoi de xem ER diagram; khi trien khai that, tach thanh
     nhieu Flyway migration V1__..., V2__... theo CONVENTIONS.md Sec 5.2.
   ============================================================================ */

/* ============================================================================
   1. NGUOI DUNG & PHAN QUYEN (SA-01 .. SA-04)
   ============================================================================ */

CREATE TABLE app_user (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    email               NVARCHAR(255)     NOT NULL,
    password_hash       NVARCHAR(255)     NOT NULL,
    full_name           NVARCHAR(150)     NOT NULL,
    phone               NVARCHAR(20)      NULL,
    -- US-SA-02.1: dung DUNG MOT vai tro cho moi tai khoan
    role                VARCHAR(30)       NOT NULL,
    status              VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT uq_app_user_email UNIQUE (email),
    CONSTRAINT ck_app_user_role CHECK (role IN
        ('STORAGE_CUSTOMER','FACILITY_STAFF','FACILITY_MANAGER',
         'BUSINESS_OPERATIONS_MANAGER','SYSTEM_ADMINISTRATOR')),
    CONSTRAINT ck_app_user_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

-- Facility tao truoc vi user_facility_assignment can FK toi day
CREATE TABLE facility (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                NVARCHAR(20)      NOT NULL,
    name                NVARCHAR(150)     NOT NULL,
    address             NVARCHAR(255)     NOT NULL,
    -- BM-01 (US-BM-01.1/01.2): Active / Inactive theo cap FACILITY,
    -- KHONG dung chung enum voi Storage Unit (xem ghi chu o storage_unit)
    status              VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT uq_facility_code UNIQUE (code),
    CONSTRAINT ck_facility_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

-- SA-03 (UC-F5-08): Facility Staff / Facility Manager duoc gan vao 1 hoac
-- nhieu Facility de phan quyen du lieu theo co so.
CREATE TABLE user_facility_assignment (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id             BIGINT            NOT NULL,
    facility_id         BIGINT            NOT NULL,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_user_facility_assignment_user_id
        FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_user_facility_assignment_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT uq_user_facility_assignment_user_facility
        UNIQUE (user_id, facility_id)
);

-- SA-04: theo doi dang nhap va nhat ky hoat dong
CREATE TABLE login_history (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id             BIGINT            NOT NULL,
    logged_in_at        DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    ip_address          NVARCHAR(64)      NULL,
    user_agent          NVARCHAR(255)     NULL,
    is_success          BIT               NOT NULL,
    CONSTRAINT fk_login_history_user_id
        FOREIGN KEY (user_id) REFERENCES app_user(id)
);

CREATE TABLE audit_log (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id             BIGINT            NULL,
    action              NVARCHAR(100)     NOT NULL,
    entity_type         NVARCHAR(100)     NOT NULL,
    entity_id           BIGINT            NOT NULL,
    before_value        NVARCHAR(MAX)     NULL,
    after_value         NVARCHAR(MAX)     NULL,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_audit_log_user_id
        FOREIGN KEY (user_id) REFERENCES app_user(id)
);

/* ============================================================================
   2. UNIT TYPE & STORAGE UNIT (FM-01, UC-F5-01/02)
   ============================================================================ */

-- UC-F5-01: danh muc Unit Type dung chung toan he thong, gia niem yet
-- rieng theo tung Facility o bang facility_unit_type_price.
CREATE TABLE unit_type (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                NVARCHAR(20)      NOT NULL,
    name                NVARCHAR(100)     NOT NULL,
    width_m             DECIMAL(5,2)      NOT NULL,
    length_m            DECIMAL(5,2)      NOT NULL,
    height_m            DECIMAL(5,2)      NOT NULL,
    description         NVARCHAR(500)     NULL,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT uq_unit_type_code UNIQUE (code)
);

-- US-BM-03.1 (UC-F4-07, BR-GEN-05): don gia thang theo cap Facility x
-- Unit Type. Day la gia HIEN HANH � lich su gia khong can bang rieng vi
-- Reservation da luu snapshot gia luc tao (BR-GEN-05).
CREATE TABLE facility_unit_type_price (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    facility_id         BIGINT            NOT NULL,
    unit_type_id        BIGINT            NOT NULL,
    monthly_price       BIGINT            NOT NULL,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_facility_unit_type_price_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_facility_unit_type_price_unit_type_id
        FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
    CONSTRAINT uq_facility_unit_type_price_facility_unit_type
        UNIQUE (facility_id, unit_type_id),
    CONSTRAINT ck_facility_unit_type_price_monthly_price CHECK (monthly_price > 0)
);

-- UC-F5-02, BR �13.3: vong doi Storage Unit theo state-machine-storage-unit.puml
CREATE TABLE storage_unit (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    facility_id         BIGINT            NOT NULL,
    unit_type_id        BIGINT            NOT NULL,
    code                NVARCHAR(30)      NOT NULL,
    location_note       NVARCHAR(255)     NULL,
    -- Available, Reserved, Occupied, Cleaning, Maintenance, Out of service
    status              VARCHAR(20)       NOT NULL DEFAULT 'AVAILABLE',
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_storage_unit_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_storage_unit_unit_type_id
        FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
    CONSTRAINT uq_storage_unit_facility_code UNIQUE (facility_id, code),
    CONSTRAINT ck_storage_unit_status CHECK (status IN
        ('AVAILABLE','RESERVED','OCCUPIED','CLEANING','MAINTENANCE','OUT_OF_SERVICE'))
);

/* ============================================================================
   3. CHINH SACH & GIA (BM-02, BM-03) � BR-GEN-01/02
   ============================================================================ */

-- Mot ban ghi = MOT phien ban chinh sach day du tai 1 thoi diem ban hanh
-- (BR-GEN-02: "Chinh sach co phien ban"). Reservation/Contract/Renewal deu
-- gan policy_version_id de snapshot dung tham so tai thoi diem do.
CREATE TABLE policy_version (
    id                          BIGINT IDENTITY(1,1) PRIMARY KEY,
    version_no                  INT             NOT NULL,
    effective_from              DATETIMEOFFSET  NOT NULL,
    -- Deposit (BR-DEP-*, US-BM-02.1)
    deposit_multiplier          DECIMAL(5,2)    NOT NULL,
    reservation_hold_hours      INT             NOT NULL,
    -- Check-in / No-show (BR-CHK-*, BR-CAN-04, US-BM-02.3)
    checkin_grace_days          INT             NOT NULL,
    -- Cancellation (BR-CAN-*, US-BM-02.3)
    cancel_full_refund_hours    INT             NOT NULL,
    cancel_late_refund_rate     DECIMAL(5,2)    NOT NULL,
    cancel_no_show_refund_rate  DECIMAL(5,2)    NOT NULL,
    -- Renewal (BR-REN-*, US-BM-02.2). reminder_days luu dang CSV, vd "7,3,1"
    renewal_reminder_days       NVARCHAR(50)    NOT NULL,
    renewal_min_months          INT             NOT NULL,
    renewal_max_months          INT             NOT NULL,
    -- Overdue (BR-OVD-*, US-BM-02.5)
    overdue_grace_days          INT             NOT NULL,
    overdue_daily_rate          DECIMAL(5,2)    NOT NULL,
    overdue_cap_rate            DECIMAL(5,2)    NOT NULL,
    overdue_lock_access_days    INT             NOT NULL,
    overdue_notice_days         INT             NOT NULL,
    overdue_termination_days    INT             NOT NULL,
    -- Return (BR-RET-*, US-BM-02.4)
    return_notice_days          INT             NOT NULL,
    return_refund_working_days  INT             NOT NULL,
    return_early_refund_rate    DECIMAL(5,2)    NOT NULL,
    -- Access (BR-ACC-01)
    access_pin_length           INT             NOT NULL DEFAULT 6,
    -- Support SLA (BR-SUP-*)
    support_urgent_sla_hours          INT       NOT NULL,
    support_auto_close_working_days   INT       NOT NULL,
    published_by                BIGINT          NOT NULL,
    created_at                  DATETIMEOFFSET  NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_policy_version_published_by
        FOREIGN KEY (published_by) REFERENCES app_user(id),
    CONSTRAINT uq_policy_version_version_no UNIQUE (version_no)
);

-- US-BM-03.2: danh muc phu phi (vd cap lai Access Card)
CREATE TABLE extra_fee_type (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                NVARCHAR(30)      NOT NULL,
    name                NVARCHAR(150)     NOT NULL,
    amount              BIGINT            NOT NULL,
    is_active           BIT               NOT NULL DEFAULT 1,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT uq_extra_fee_type_code UNIQUE (code),
    CONSTRAINT ck_extra_fee_type_amount CHECK (amount >= 0)
);

-- US-BM-03.3: chuong trinh giam gia / mien phi
CREATE TABLE discount_program (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    name                NVARCHAR(150)     NOT NULL,
    discount_type       VARCHAR(20)       NOT NULL,
    discount_value      DECIMAL(10,2)     NOT NULL,
    start_date          DATE              NOT NULL,
    end_date            DATE              NOT NULL,
    scope_type          VARCHAR(20)       NOT NULL,
    facility_id         BIGINT            NULL,
    unit_type_id        BIGINT            NULL,
    is_active           BIT               NOT NULL DEFAULT 1,
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_discount_program_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_discount_program_unit_type_id
        FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
    CONSTRAINT ck_discount_program_discount_type CHECK (discount_type IN ('PERCENT','AMOUNT')),
    CONSTRAINT ck_discount_program_scope_type CHECK (scope_type IN ('SYSTEM','FACILITY','UNIT_TYPE')),
    CONSTRAINT ck_discount_program_date_range CHECK (end_date >= start_date)
);

/* ============================================================================
   4. RESERVATION (Flow 1) � state-machine-reservation.puml
   ============================================================================ */

CREATE TABLE reservation (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                    NVARCHAR(30)      NOT NULL,
    customer_id             BIGINT            NOT NULL,
    facility_id             BIGINT            NOT NULL,
    unit_type_id            BIGINT            NOT NULL,
    -- Khoang thue dang [start_date, end_date) � BR-RES-01
    start_date              DATE              NOT NULL,
    rental_months           INT               NOT NULL,
    end_date_exclusive      DATE              NOT NULL,
    -- Snapshot gia & chinh sach tai thoi diem tao � BR-GEN-05, BR-GEN-02
    monthly_price_snapshot  BIGINT            NOT NULL,
    policy_version_id       BIGINT            NOT NULL,
    discount_program_id     BIGINT            NULL,
    discount_amount         BIGINT            NOT NULL DEFAULT 0,
    deposit_amount          BIGINT            NOT NULL,
    total_rental_fee        BIGINT            NOT NULL,
    total_payable           BIGINT            NOT NULL,
    -- Gan sau khi thanh toan thanh cong � BR-AVL-04 (FM gan thu cong)
    storage_unit_id         BIGINT            NULL,
    -- Pending Payment, Confirmed, Fulfilled, Expired, Cancelled, No-show
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING_PAYMENT',
    hold_expires_at         DATETIMEOFFSET    NOT NULL,
    confirmed_at            DATETIMEOFFSET    NULL,
    fulfilled_at            DATETIMEOFFSET    NULL,
    cancelled_at            DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_reservation_customer_id
        FOREIGN KEY (customer_id) REFERENCES app_user(id),
    CONSTRAINT fk_reservation_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_reservation_unit_type_id
        FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
    CONSTRAINT fk_reservation_storage_unit_id
        FOREIGN KEY (storage_unit_id) REFERENCES storage_unit(id),
    CONSTRAINT fk_reservation_policy_version_id
        FOREIGN KEY (policy_version_id) REFERENCES policy_version(id),
    CONSTRAINT fk_reservation_discount_program_id
        FOREIGN KEY (discount_program_id) REFERENCES discount_program(id),
    CONSTRAINT uq_reservation_code UNIQUE (code),
    CONSTRAINT ck_reservation_status CHECK (status IN
        ('PENDING_PAYMENT','CONFIRMED','FULFILLED','EXPIRED','CANCELLED','NO_SHOW')),
    CONSTRAINT ck_reservation_rental_months CHECK (rental_months > 0)
);
CREATE INDEX ix_reservation_customer_id ON reservation(customer_id);
CREATE INDEX ix_reservation_status ON reservation(status);
CREATE INDEX ix_reservation_facility_id_unit_type_id ON reservation(facility_id, unit_type_id);

/* ============================================================================
   5. RENTAL CONTRACT (Flow 2, 3, 6) � state-machine-contract.puml
   ============================================================================ */

CREATE TABLE rental_contract (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                    NVARCHAR(30)      NOT NULL,
    reservation_id          BIGINT            NOT NULL,
    customer_id             BIGINT            NOT NULL,
    facility_id             BIGINT            NOT NULL,
    storage_unit_id         BIGINT            NOT NULL,
    start_date              DATE              NOT NULL,
    end_date                DATE              NOT NULL,
    policy_version_id       BIGINT            NOT NULL,
    monthly_price_snapshot  BIGINT            NOT NULL,
    deposit_amount          BIGINT            NOT NULL,
    -- Pending Check-in, Active, Pending Return, Overdue, Cancelled, Closed, Terminated
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING_CHECK_IN',
    overdue_since           DATE              NULL,
    overdue_fee_accrued     BIGINT            NOT NULL DEFAULT 0,
    activated_at            DATETIMEOFFSET    NULL,
    closed_at               DATETIMEOFFSET    NULL,
    terminated_at           DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_rental_contract_reservation_id
        FOREIGN KEY (reservation_id) REFERENCES reservation(id),
    CONSTRAINT fk_rental_contract_customer_id
        FOREIGN KEY (customer_id) REFERENCES app_user(id),
    CONSTRAINT fk_rental_contract_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_rental_contract_storage_unit_id
        FOREIGN KEY (storage_unit_id) REFERENCES storage_unit(id),
    CONSTRAINT fk_rental_contract_policy_version_id
        FOREIGN KEY (policy_version_id) REFERENCES policy_version(id),
    CONSTRAINT uq_rental_contract_code UNIQUE (code),
    CONSTRAINT uq_rental_contract_reservation_id UNIQUE (reservation_id),
    CONSTRAINT ck_rental_contract_status CHECK (status IN
        ('PENDING_CHECK_IN','ACTIVE','PENDING_RETURN','OVERDUE',
         'CANCELLED','CLOSED','TERMINATED'))
);
CREATE INDEX ix_rental_contract_customer_id ON rental_contract(customer_id);
CREATE INDEX ix_rental_contract_status ON rental_contract(status);
CREATE INDEX ix_rental_contract_storage_unit_id ON rental_contract(storage_unit_id);

-- BR-REN-*: moi lan gia han la 1 ban ghi, dung gia/chinh sach tai thoi
-- diem gia han (co the khac policy_version cua Contract goc)
CREATE TABLE contract_renewal (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    previous_end_date       DATE              NOT NULL,
    new_end_date            DATE              NOT NULL,
    rental_months           INT               NOT NULL,
    monthly_price_snapshot  BIGINT            NOT NULL,
    policy_version_id       BIGINT            NOT NULL,
    overdue_fee_settled     BIGINT            NOT NULL DEFAULT 0,
    rental_fee_amount       BIGINT            NOT NULL,
    total_paid              BIGINT            NOT NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_contract_renewal_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_contract_renewal_policy_version_id
        FOREIGN KEY (policy_version_id) REFERENCES policy_version(id),
    CONSTRAINT ck_contract_renewal_rental_months CHECK (rental_months > 0)
);
CREATE INDEX ix_contract_renewal_contract_id ON contract_renewal(contract_id);

-- BR-CHK-03 (UC-F2-03): bien ban ban giao co chu ky dien tu 2 ben
CREATE TABLE handover_record (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    staff_id                BIGINT            NOT NULL,
    condition_note          NVARCHAR(1000)    NULL,
    customer_signed_at      DATETIMEOFFSET    NULL,
    staff_signed_at         DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_handover_record_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_handover_record_staff_id
        FOREIGN KEY (staff_id) REFERENCES app_user(id),
    CONSTRAINT uq_handover_record_contract_id UNIQUE (contract_id)
);

-- BR-RET-01..12: dang ky tra kho va nghiem thu
CREATE TABLE return_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    requested_at            DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    requested_return_date   DATE              NOT NULL,
    appointment_slot        NVARCHAR(50)      NULL,
    -- Pending, Completed, Cancelled
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING',
    inspected_by            BIGINT            NULL,
    inspected_at            DATETIMEOFFSET    NULL,
    is_intact               BIT               NULL,
    condition_note          NVARCHAR(1000)    NULL,
    damage_cost             BIGINT            NOT NULL DEFAULT 0,
    deposit_refund_amount   BIGINT            NULL,
    cancelled_at            DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_return_request_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_return_request_inspected_by
        FOREIGN KEY (inspected_by) REFERENCES app_user(id),
    CONSTRAINT ck_return_request_status CHECK (status IN ('PENDING','COMPLETED','CANCELLED')),
    CONSTRAINT ck_return_request_damage_cost CHECK (damage_cost >= 0)
);
CREATE INDEX ix_return_request_contract_id ON return_request(contract_id);

-- BR-RET-08: phu phi/hu hai va phu thu khac ghi nhan tren hop dong
CREATE TABLE contract_extra_charge (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    extra_fee_type_id       BIGINT            NOT NULL,
    amount                  BIGINT            NOT NULL,
    reason                  NVARCHAR(500)     NULL,
    recorded_by             BIGINT            NOT NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_contract_extra_charge_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_contract_extra_charge_extra_fee_type_id
        FOREIGN KEY (extra_fee_type_id) REFERENCES extra_fee_type(id),
    CONSTRAINT fk_contract_extra_charge_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES app_user(id)
);
CREATE INDEX ix_contract_extra_charge_contract_id ON contract_extra_charge(contract_id);

-- BR-OVD-10, US-BM-03.4: de xuat mien/giam phi qua han theo vu, can BOM duyet
CREATE TABLE overdue_fee_adjustment_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    requested_by            BIGINT            NOT NULL,
    requested_amount        BIGINT            NOT NULL,
    reason                  NVARCHAR(500)     NOT NULL,
    evidence_note           NVARCHAR(500)     NULL,
    -- Pending, Approved, Rejected
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING',
    reviewed_by             BIGINT            NULL,
    reviewed_amount         BIGINT            NULL,
    review_reason           NVARCHAR(500)     NULL,
    requested_at            DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    reviewed_at             DATETIMEOFFSET    NULL,
    CONSTRAINT fk_overdue_fee_adjustment_request_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_overdue_fee_adjustment_request_requested_by
        FOREIGN KEY (requested_by) REFERENCES app_user(id),
    CONSTRAINT fk_overdue_fee_adjustment_request_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES app_user(id),
    CONSTRAINT ck_overdue_fee_adjustment_request_status CHECK (status IN
        ('PENDING','APPROVED','REJECTED'))
);
CREATE INDEX ix_overdue_fee_adjustment_request_contract_id
    ON overdue_fee_adjustment_request(contract_id);

/* ============================================================================
   6. ACCESS CREDENTIAL � BR �13.4, BR-ACC-*
   ============================================================================ */

CREATE TABLE access_credential (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    storage_unit_id         BIGINT            NOT NULL,
    -- PIN, QR, CARD, KEY (BR-ACC-01)
    credential_type         VARCHAR(20)       NOT NULL,
    code_value_hash         NVARCHAR(255)     NOT NULL,
    -- Active, Suspended, Revoked
    status                  VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',
    issued_at               DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    suspended_at            DATETIMEOFFSET    NULL,
    revoked_at              DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_access_credential_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_access_credential_storage_unit_id
        FOREIGN KEY (storage_unit_id) REFERENCES storage_unit(id),
    CONSTRAINT ck_access_credential_credential_type CHECK (credential_type IN
        ('PIN','QR','CARD','KEY')),
    CONSTRAINT ck_access_credential_status CHECK (status IN
        ('ACTIVE','SUSPENDED','REVOKED'))
);
CREATE INDEX ix_access_credential_contract_id ON access_credential(contract_id);

/* ============================================================================
   7. THANH TOAN & LEDGER � BR-PAY-*, BR-DEP-*
   ============================================================================ */

CREATE TABLE payment_transaction (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    reservation_id          BIGINT            NULL,
    contract_id             BIGINT            NULL,
    -- Initial payment, Renewal payment, Extra fee payment, Refund
    transaction_type        VARCHAR(30)       NOT NULL,
    amount                  BIGINT            NOT NULL,
    -- Pending, Success, Failed, Refund Failed
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING',
    payment_method          NVARCHAR(50)      NULL,
    provider_reference      NVARCHAR(100)     NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_payment_transaction_reservation_id
        FOREIGN KEY (reservation_id) REFERENCES reservation(id),
    CONSTRAINT fk_payment_transaction_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT ck_payment_transaction_type CHECK (transaction_type IN
        ('INITIAL_PAYMENT','RENEWAL_PAYMENT','EXTRA_FEE_PAYMENT','REFUND')),
    CONSTRAINT ck_payment_transaction_status CHECK (status IN
        ('PENDING','SUCCESS','FAILED','REFUND_FAILED'))
);
CREATE INDEX ix_payment_transaction_reservation_id ON payment_transaction(reservation_id);
CREATE INDEX ix_payment_transaction_contract_id ON payment_transaction(contract_id);

-- BR-PAY-06: ledger entry BAT BIEN, khong duoc UPDATE sau khi tao (chi INSERT)
CREATE TABLE ledger_entry (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    reservation_id          BIGINT            NULL,
    contract_id             BIGINT            NULL,
    payment_transaction_id  BIGINT            NULL,
    -- Collected, Adjusted, Deducted, Refunded, Outstanding
    entry_type              VARCHAR(20)       NOT NULL,
    amount                  BIGINT            NOT NULL,
    description             NVARCHAR(500)     NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_ledger_entry_reservation_id
        FOREIGN KEY (reservation_id) REFERENCES reservation(id),
    CONSTRAINT fk_ledger_entry_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_ledger_entry_payment_transaction_id
        FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction(id),
    CONSTRAINT ck_ledger_entry_entry_type CHECK (entry_type IN
        ('COLLECTED','ADJUSTED','DEDUCTED','REFUNDED','OUTSTANDING'))
);
CREATE INDEX ix_ledger_entry_contract_id ON ledger_entry(contract_id);
CREATE INDEX ix_ledger_entry_reservation_id ON ledger_entry(reservation_id);

/* ============================================================================
   8. SUPPORT REQUEST & PHAN CONG NHAN SU � Flow 7, FM-05
   ============================================================================ */

CREATE TABLE support_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                    NVARCHAR(30)      NOT NULL,
    customer_id             BIGINT            NOT NULL,
    contract_id             BIGINT            NULL,
    storage_unit_id         BIGINT            NULL,
    -- Unit damage, Lock/Access issue, Payment, Belongings, Other
    category                VARCHAR(30)       NOT NULL,
    description             NVARCHAR(1000)    NOT NULL,
    -- New, Assigned, In progress, Resolved, Closed, Auto closed
    status                  VARCHAR(20)       NOT NULL DEFAULT 'NEW',
    assigned_staff_id       BIGINT            NULL,
    sla_due_at              DATETIMEOFFSET    NULL,
    resolved_at             DATETIMEOFFSET    NULL,
    resolution_note         NVARCHAR(1000)    NULL,
    customer_confirmed_at   DATETIMEOFFSET    NULL,
    auto_closed_at          DATETIMEOFFSET    NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_support_request_customer_id
        FOREIGN KEY (customer_id) REFERENCES app_user(id),
    CONSTRAINT fk_support_request_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_support_request_storage_unit_id
        FOREIGN KEY (storage_unit_id) REFERENCES storage_unit(id),
    CONSTRAINT fk_support_request_assigned_staff_id
        FOREIGN KEY (assigned_staff_id) REFERENCES app_user(id),
    CONSTRAINT uq_support_request_code UNIQUE (code),
    CONSTRAINT ck_support_request_category CHECK (category IN
        ('UNIT_DAMAGE','LOCK_ACCESS','PAYMENT','BELONGINGS','OTHER')),
    CONSTRAINT ck_support_request_status CHECK (status IN
        ('NEW','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','AUTO_CLOSED'))
);
CREATE INDEX ix_support_request_customer_id ON support_request(customer_id);
CREATE INDEX ix_support_request_status ON support_request(status);

-- FM-05 (UC-F2-09, UC-F5-04, UC-F7-04): phan cong Facility Staff theo cong
-- viec trong ngay � dung chung cho Handover, Return, Support
CREATE TABLE staff_daily_assignment (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    staff_id                BIGINT            NOT NULL,
    facility_id             BIGINT            NOT NULL,
    work_date               DATE              NOT NULL,
    -- Handover, Return, Support, Inspection
    task_type               VARCHAR(20)       NOT NULL,
    -- Tham chieu mem toi doi tuong cong viec (Reservation, Return Request,
    -- Support Request...) de khong phai tao FK rieng cho tung loai
    reference_type          NVARCHAR(30)      NOT NULL,
    reference_id            BIGINT            NOT NULL,
    assigned_by             BIGINT            NOT NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_staff_daily_assignment_staff_id
        FOREIGN KEY (staff_id) REFERENCES app_user(id),
    CONSTRAINT fk_staff_daily_assignment_facility_id
        FOREIGN KEY (facility_id) REFERENCES facility(id),
    CONSTRAINT fk_staff_daily_assignment_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES app_user(id),
    CONSTRAINT ck_staff_daily_assignment_task_type CHECK (task_type IN
        ('HANDOVER','RETURN','SUPPORT','INSPECTION'))
);
CREATE INDEX ix_staff_daily_assignment_staff_id_work_date
    ON staff_daily_assignment(staff_id, work_date);

/* ============================================================================
   9. TEP DINH KEM DUNG CHUNG � anh bien ban ban giao, tra kho, sua chua...
   ============================================================================ */

CREATE TABLE attachment (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    -- 'HANDOVER_RECORD', 'RETURN_REQUEST', 'SUPPORT_REQUEST', ...
    entity_type             NVARCHAR(30)      NOT NULL,
    entity_id               BIGINT            NOT NULL,
    file_url                NVARCHAR(500)     NOT NULL,
    uploaded_by             BIGINT            NOT NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_attachment_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES app_user(id)
);
CREATE INDEX ix_attachment_entity_type_entity_id ON attachment(entity_type, entity_id);



/* ============================================================================
   Trigger dam bao tinh nhat quan cho 3 truong hop du thua co chu dich
   (denormalization) da chot khi review chuan hoa 3NF/BCNF:

   1) rental_contract.facility_id / customer_id  <-> storage_unit / reservation
   2) reservation.facility_id / unit_type_id     <-> storage_unit (khi da gan)
   3) access_credential.storage_unit_id          <-> rental_contract

   Nguyen tac chung: KHONG cho app tu set tay cac cot du thua nay --
   trigger se TU DONG gan lai gia tri dung dua tren cot nguon (storage_unit_id/
   reservation_id/contract_id) o moi lan INSERT/UPDATE, nen du app co lo gui
   sai gia tri thi DB van tu sua ve dung, khong bao gio lech.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   1) rental_contract: dong bo facility_id (theo storage_unit_id)
      va customer_id (theo reservation_id) moi khi INSERT/UPDATE
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER trg_rental_contract_sync_derived
ON rental_contract
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE rc
    SET rc.facility_id = su.facility_id,
        rc.customer_id = r.customer_id
    FROM rental_contract rc
    INNER JOIN inserted i       ON i.id = rc.id
    INNER JOIN storage_unit su  ON su.id = rc.storage_unit_id
    INNER JOIN reservation r    ON r.id  = rc.reservation_id;
END;
GO

/* ----------------------------------------------------------------------------
   2) reservation: khi storage_unit_id duoc gan (BR-AVL-04), doi chieu va
      dong bo lai facility_id / unit_type_id theo dung unit vua gan.
      Day la truong hop QUAN TRONG NHAT (anh huong logic phan bo kho),
      nen thay vi chi "im lang sua", trigger se BAO LOI ro rang neu unit
      duoc gan sai facility/unit_type so voi luc khach dat cho -- vi day
      la dau hieu BUG phan bo, khong phai chuyen "vo hai" nhu case 1.
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER trg_reservation_validate_storage_unit
ON reservation
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN storage_unit su ON su.id = i.storage_unit_id
        WHERE i.storage_unit_id IS NOT NULL
          AND (su.facility_id <> i.facility_id OR su.unit_type_id <> i.unit_type_id)
    )
    BEGIN
        RAISERROR(
            N'storage_unit duoc gan khong khop facility_id/unit_type_id da chon o Reservation (BR-AVL-04).',
            16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

/* ----------------------------------------------------------------------------
   3) access_credential: dong bo storage_unit_id theo contract_id
      (1 hop dong = 1 unit co dinh suot vong doi -- BR-DEP-06)
   ---------------------------------------------------------------------------- */
CREATE OR ALTER TRIGGER trg_access_credential_sync_storage_unit
ON access_credential
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ac
    SET ac.storage_unit_id = rc.storage_unit_id
    FROM access_credential ac
    INNER JOIN inserted i        ON i.id = ac.id
    INNER JOIN rental_contract rc ON rc.id = ac.contract_id;
END;
GO