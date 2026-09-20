-- V4: Bo sung floor, position cho storage_unit va is_active cho unit_type (ISS-35)
ALTER TABLE unit_type ADD is_active BIT NOT NULL DEFAULT 1;
GO

ALTER TABLE storage_unit ADD floor INT NULL;
ALTER TABLE storage_unit ADD position NVARCHAR(50) NULL;
GO

-- Cap nhat du lieu mau tu location_note sang floor va position
UPDATE storage_unit SET floor = 1, position = N'Khu A' WHERE location_note LIKE N'%Tầng 1 - Khu A%';
UPDATE storage_unit SET floor = 2, position = N'Khu B' WHERE location_note LIKE N'%Tầng 2 - Khu B%';
UPDATE storage_unit SET floor = 3, position = N'Khu C' WHERE location_note LIKE N'%Tầng 3 - Khu C%';
UPDATE storage_unit SET floor = 4, position = N'Khu D' WHERE location_note LIKE N'%Tầng 4 - Khu D%';
GO
