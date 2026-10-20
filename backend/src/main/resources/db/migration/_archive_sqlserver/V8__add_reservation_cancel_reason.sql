-- Migration V8: Add cancel_reason column to reservation table for cancellation tracking (BR-RES-04)
ALTER TABLE reservation ADD cancel_reason NVARCHAR(500) NULL;
