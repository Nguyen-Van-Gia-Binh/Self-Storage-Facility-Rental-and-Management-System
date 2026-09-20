-- V5__create_contract_and_handover.sql
-- Ensure rental_contract and handover_record tables are updated with all columns required for Flow 2 (T3.4, T3.6, T3.7)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rental_contract')
BEGIN
    CREATE TABLE rental_contract (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        code                NVARCHAR(30)      NOT NULL,
        reservation_id      BIGINT            NOT NULL,
        customer_id         BIGINT            NOT NULL,
        facility_id         BIGINT            NOT NULL,
        storage_unit_id     BIGINT            NOT NULL,
        unit_type_id        BIGINT            NULL,
        start_date          DATE              NOT NULL,
        end_date            DATE              NOT NULL,
        rental_months       INT               NOT NULL DEFAULT 1,
        monthly_price_snapshot BIGINT         NOT NULL DEFAULT 0,
        total_rental_fee    BIGINT            NOT NULL DEFAULT 0,
        deposit_amount      BIGINT            NOT NULL DEFAULT 0,
        deposit_balance     BIGINT            NOT NULL DEFAULT 0,
        access_code         NVARCHAR(10)      NULL,
        status              VARCHAR(30)       NOT NULL DEFAULT 'PENDING_CHECK_IN',
        checkin_date        DATE              NULL,
        return_date         DATE              NULL,
        policy_snapshot     NVARCHAR(MAX)     NULL,
        created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT uq_rental_contract_code        UNIQUE (code),
        CONSTRAINT uq_rental_contract_reservation UNIQUE (reservation_id),
        CONSTRAINT fk_rental_contract_reservation FOREIGN KEY (reservation_id) REFERENCES reservation(id)
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'unit_type_id')
        ALTER TABLE rental_contract ADD unit_type_id BIGINT NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'rental_months')
        ALTER TABLE rental_contract ADD rental_months INT NOT NULL DEFAULT 1;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'total_rental_fee')
        ALTER TABLE rental_contract ADD total_rental_fee BIGINT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'deposit_balance')
        ALTER TABLE rental_contract ADD deposit_balance BIGINT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'access_code')
        ALTER TABLE rental_contract ADD access_code NVARCHAR(10) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'checkin_date')
        ALTER TABLE rental_contract ADD checkin_date DATE NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'return_date')
        ALTER TABLE rental_contract ADD return_date DATE NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'policy_snapshot')
        ALTER TABLE rental_contract ADD policy_snapshot NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'handover_record')
BEGIN
    CREATE TABLE handover_record (
        id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
        contract_id           BIGINT            NOT NULL,
        staff_id              BIGINT            NOT NULL,
        handover_at           DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        condition_note        NVARCHAR(500)     NULL,
        customer_confirmed    BIT               NOT NULL DEFAULT 0,
        customer_confirmed_at DATETIMEOFFSET    NULL,
        rejected              BIT               NOT NULL DEFAULT 0,
        rejection_reason      NVARCHAR(500)     NULL,
        created_at            DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT fk_handover_record_contract FOREIGN KEY (contract_id) REFERENCES rental_contract(id),
        CONSTRAINT fk_handover_record_staff    FOREIGN KEY (staff_id)    REFERENCES app_user(id)
    );
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('handover_record') AND name = 'handover_at')
        ALTER TABLE handover_record ADD handover_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET();

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('handover_record') AND name = 'customer_confirmed')
        ALTER TABLE handover_record ADD customer_confirmed BIT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('handover_record') AND name = 'customer_confirmed_at')
        ALTER TABLE handover_record ADD customer_confirmed_at DATETIMEOFFSET NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('handover_record') AND name = 'rejected')
        ALTER TABLE handover_record ADD rejected BIT NOT NULL DEFAULT 0;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('handover_record') AND name = 'rejection_reason')
        ALTER TABLE handover_record ADD rejection_reason NVARCHAR(500) NULL;
END
GO
