/* ============================================================================
   Self-Storage Facility Rental and Management System
   Flyway Migration V1__init_schema.sql
   Database: SQL Server
   Mapping: database/Storage_Self.sql -> docs/CONVENTIONS.md Sec 5
   ============================================================================ */

-- 1. NGUOI DUNG & PHAN QUYEN (SA-01 .. SA-04)
CREATE TABLE app_user (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    email               NVARCHAR(255)     NOT NULL,
    password_hash       NVARCHAR(255)     NOT NULL,
    full_name           NVARCHAR(150)     NOT NULL,
    phone               NVARCHAR(20)      NULL,
    identity_number     NVARCHAR(20)      NULL,
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

CREATE TABLE facility (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                NVARCHAR(20)      NOT NULL,
    name                NVARCHAR(150)     NOT NULL,
    address             NVARCHAR(255)     NOT NULL,
    status              VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT uq_facility_code UNIQUE (code),
    CONSTRAINT ck_facility_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

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

-- 2. UNIT TYPE & STORAGE UNIT
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

CREATE TABLE storage_unit (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    facility_id         BIGINT            NOT NULL,
    unit_type_id        BIGINT            NOT NULL,
    code                NVARCHAR(30)      NOT NULL,
    location_note       NVARCHAR(255)     NULL,
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

-- 3. CHINH SACH & GIA
CREATE TABLE policy_version (
    id                          BIGINT IDENTITY(1,1) PRIMARY KEY,
    version_no                  INT             NOT NULL,
    effective_from              DATETIMEOFFSET  NOT NULL,
    deposit_multiplier          DECIMAL(5,2)    NOT NULL,
    reservation_hold_hours      INT             NOT NULL,
    checkin_grace_days          INT             NOT NULL,
    cancel_full_refund_hours    INT             NOT NULL,
    cancel_late_refund_rate     DECIMAL(5,2)    NOT NULL,
    cancel_no_show_refund_rate  DECIMAL(5,2)    NOT NULL,
    renewal_reminder_days       NVARCHAR(50)    NOT NULL,
    renewal_min_months          INT             NOT NULL,
    renewal_max_months          INT             NOT NULL,
    overdue_grace_days          INT             NOT NULL,
    overdue_daily_rate          DECIMAL(5,2)    NOT NULL,
    overdue_cap_rate            DECIMAL(5,2)    NOT NULL,
    overdue_lock_access_days    INT             NOT NULL,
    overdue_notice_days         INT             NOT NULL,
    overdue_termination_days    INT             NOT NULL,
    return_notice_days          INT             NOT NULL,
    return_refund_working_days  INT             NOT NULL,
    return_early_refund_rate    DECIMAL(5,2)    NOT NULL,
    access_pin_length           INT             NOT NULL DEFAULT 6,
    support_urgent_sla_hours          INT       NOT NULL,
    support_auto_close_working_days   INT       NOT NULL,
    published_by                BIGINT          NOT NULL,
    created_at                  DATETIMEOFFSET  NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_policy_version_published_by
        FOREIGN KEY (published_by) REFERENCES app_user(id),
    CONSTRAINT uq_policy_version_version_no UNIQUE (version_no)
);

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

-- 4. RESERVATION
CREATE TABLE reservation (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                    NVARCHAR(30)      NOT NULL,
    customer_id             BIGINT            NOT NULL,
    facility_id             BIGINT            NOT NULL,
    unit_type_id            BIGINT            NOT NULL,
    start_date              DATE              NOT NULL,
    rental_months           INT               NOT NULL,
    end_date_exclusive      DATE              NOT NULL,
    monthly_price_snapshot  BIGINT            NOT NULL,
    policy_version_id       BIGINT            NOT NULL,
    discount_program_id     BIGINT            NULL,
    discount_amount         BIGINT            NOT NULL DEFAULT 0,
    deposit_amount          BIGINT            NOT NULL,
    total_rental_fee        BIGINT            NOT NULL,
    total_payable           BIGINT            NOT NULL,
    storage_unit_id         BIGINT            NULL,
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

-- 5. RENTAL CONTRACT
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

CREATE TABLE handover_record (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    staff_id                BIGINT            NOT NULL,
    condition_note          NVARCHAR(1000)    NULL,
    customer_signed_at      DATETIMEOFFSET    NULL,
    staff_signed_at         DATETIMEOFFSET    NULL,
    status                  VARCHAR(20)       NOT NULL DEFAULT 'PENDING_SIGNATURE',
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_handover_record_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_handover_record_staff_id
        FOREIGN KEY (staff_id) REFERENCES app_user(id),
    CONSTRAINT uq_handover_record_contract_id UNIQUE (contract_id),
    CONSTRAINT ck_handover_record_status CHECK (status IN
        ('PENDING_SIGNATURE','COMPLETED','CANCELLED'))
);

CREATE TABLE return_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    requested_at            DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    requested_return_date   DATE              NOT NULL,
    appointment_slot        NVARCHAR(50)      NULL,
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

CREATE TABLE contract_extra_charge (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    extra_fee_type_id       BIGINT            NOT NULL,
    amount                  BIGINT            NOT NULL,
    reason                  NVARCHAR(500)     NULL,
    recorded_by             BIGINT            NOT NULL,
    status                  VARCHAR(20)       NOT NULL DEFAULT 'UNPAID',
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_contract_extra_charge_contract_id
        FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
    CONSTRAINT fk_contract_extra_charge_extra_fee_type_id
        FOREIGN KEY (extra_fee_type_id) REFERENCES extra_fee_type(id),
    CONSTRAINT fk_contract_extra_charge_recorded_by
        FOREIGN KEY (recorded_by) REFERENCES app_user(id),
    CONSTRAINT ck_contract_extra_charge_status CHECK (status IN ('UNPAID','PAID'))
);
CREATE INDEX ix_contract_extra_charge_contract_id ON contract_extra_charge(contract_id);

CREATE TABLE overdue_fee_adjustment_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    requested_by            BIGINT            NOT NULL,
    requested_amount        BIGINT            NOT NULL,
    reason                  NVARCHAR(500)     NOT NULL,
    evidence_note           NVARCHAR(500)     NULL,
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

-- 6. ACCESS CREDENTIAL
CREATE TABLE access_credential (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id             BIGINT            NOT NULL,
    storage_unit_id         BIGINT            NOT NULL,
    credential_type         VARCHAR(20)       NOT NULL,
    code_value_hash         NVARCHAR(255)     NOT NULL,
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

-- 7. THANH TOAN & LEDGER
CREATE TABLE payment_transaction (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    reservation_id          BIGINT            NULL,
    contract_id             BIGINT            NULL,
    transaction_type        VARCHAR(30)       NOT NULL,
    amount                  BIGINT            NOT NULL,
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

CREATE TABLE ledger_entry (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    reservation_id          BIGINT            NULL,
    contract_id             BIGINT            NULL,
    payment_transaction_id  BIGINT            NULL,
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

-- 8. SUPPORT REQUEST
CREATE TABLE support_request (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    code                    NVARCHAR(30)      NOT NULL,
    customer_id             BIGINT            NOT NULL,
    contract_id             BIGINT            NULL,
    storage_unit_id         BIGINT            NULL,
    category                VARCHAR(30)       NOT NULL,
    description             NVARCHAR(1000)    NOT NULL,
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

CREATE TABLE staff_daily_assignment (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    staff_id                BIGINT            NOT NULL,
    facility_id             BIGINT            NOT NULL,
    work_date               DATE              NOT NULL,
    task_type               VARCHAR(20)       NOT NULL,
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

-- 9. ATTACHMENT
CREATE TABLE attachment (
    id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    entity_type             NVARCHAR(30)      NOT NULL,
    entity_id               BIGINT            NOT NULL,
    file_url                NVARCHAR(500)     NOT NULL,
    uploaded_by             BIGINT            NOT NULL,
    created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    CONSTRAINT fk_attachment_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES app_user(id)
);
CREATE INDEX ix_attachment_entity_type_entity_id ON attachment(entity_type, entity_id);
