-- V6__create_return_request_and_extra_charge_enhancements.sql
-- Ensure return_request and contract_extra_charge tables exist and support inspection evidence & settlement

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'return_request')
BEGIN
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
        evidence_image_urls     NVARCHAR(MAX)     NULL,
        deposit_refund_amount   BIGINT            NULL,
        settled_by              BIGINT            NULL,
        settled_at              DATETIMEOFFSET    NULL,
        rejection_reason        NVARCHAR(500)     NULL,
        cancelled_at            DATETIMEOFFSET    NULL,
        created_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at              DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT fk_return_request_contract FOREIGN KEY (contract_id) REFERENCES rental_contract(id)
    );
    CREATE INDEX ix_return_request_contract_id ON return_request(contract_id);
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('return_request') AND name = 'evidence_image_urls')
        ALTER TABLE return_request ADD evidence_image_urls NVARCHAR(MAX) NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('return_request') AND name = 'settled_by')
        ALTER TABLE return_request ADD settled_by BIGINT NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('return_request') AND name = 'settled_at')
        ALTER TABLE return_request ADD settled_at DATETIMEOFFSET NULL;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('return_request') AND name = 'rejection_reason')
        ALTER TABLE return_request ADD rejection_reason NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contract_extra_charge')
BEGIN
    CREATE TABLE contract_extra_charge (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        contract_id         BIGINT            NOT NULL,
        extra_fee_type_id   BIGINT            NULL,
        amount              BIGINT            NOT NULL,
        reason              NVARCHAR(500)     NULL,
        recorded_by         BIGINT            NULL,
        status              VARCHAR(20)       NOT NULL DEFAULT 'UNPAID',
        created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT fk_contract_extra_charge_contract FOREIGN KEY (contract_id) REFERENCES rental_contract(id)
    );
    CREATE INDEX ix_contract_extra_charge_contract ON contract_extra_charge(contract_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'overdue_fee_accrued')
    ALTER TABLE rental_contract ADD overdue_fee_accrued BIGINT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('rental_contract') AND name = 'closed_at')
    ALTER TABLE rental_contract ADD closed_at DATETIMEOFFSET NULL;
GO
