-- BR-GEN-01 / BR-AVL-02 / BR-PRI-03
-- rental.buffer_days = 15, rental.daily_divisor = 30
IF COL_LENGTH('policy_version', 'rental_buffer_days') IS NULL
BEGIN
    ALTER TABLE policy_version
        ADD rental_buffer_days INT NOT NULL
            CONSTRAINT df_policy_version_rental_buffer_days DEFAULT 15;
END;

IF COL_LENGTH('policy_version', 'rental_daily_divisor') IS NULL
BEGIN
    ALTER TABLE policy_version
        ADD rental_daily_divisor INT NOT NULL
            CONSTRAINT df_policy_version_rental_daily_divisor DEFAULT 30;
END;
