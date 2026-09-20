/* ============================================================================
   Flyway Migration V3__add_facility_details.sql
   Bo sung cac truong phone, description, opening_hours cho bang facility (BM-01)
   ============================================================================ */

ALTER TABLE facility ADD phone NVARCHAR(20) NULL;
ALTER TABLE facility ADD description NVARCHAR(2000) NULL;
ALTER TABLE facility ADD opening_hours NVARCHAR(50) NULL;
