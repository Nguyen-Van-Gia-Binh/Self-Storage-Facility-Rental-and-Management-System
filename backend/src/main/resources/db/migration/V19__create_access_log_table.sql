-- V19__create_access_log_table.sql
-- Bảng nhật ký ra vào ô kho điện tử (SC-05, US-SC-05.2, BR-ACC-02)

CREATE TABLE access_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    contract_id BIGINT NOT NULL,
    storage_unit_id BIGINT NULL,
    accessed_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    method NVARCHAR(30) NOT NULL, -- 'PIN_CODE', 'QR_PASS', 'STAFF_OVERRIDE'
    accessor_name NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
    device_info NVARCHAR(200) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_access_log_contract FOREIGN KEY (contract_id) REFERENCES rental_contract(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_log_storage_unit FOREIGN KEY (storage_unit_id) REFERENCES storage_unit(id)
);

CREATE INDEX idx_access_log_contract_id ON access_log(contract_id);
CREATE INDEX idx_access_log_accessed_at ON access_log(accessed_at);

-- Seed dữ liệu mẫu ban đầu cho hợp đồng số 1 (nếu đã tồn tại)
IF EXISTS (SELECT 1 FROM rental_contract WHERE id = 1)
BEGIN
    INSERT INTO access_log (contract_id, storage_unit_id, accessed_at, method, accessor_name, status, device_info)
    VALUES 
    (1, (SELECT storage_unit_id FROM rental_contract WHERE id = 1), DATEADD(HOUR, -2, GETDATE()), 'PIN_CODE', N'Khách hàng chính chủ', 'SUCCESS', N'Bàn phím cảm ứng tủ ô kho'),
    (1, (SELECT storage_unit_id FROM rental_contract WHERE id = 1), DATEADD(DAY, -1, GETDATE()), 'QR_PASS', N'Khách hàng chính chủ', 'SUCCESS', N'Đầu đọc mã QR cổng chính'),
    (1, (SELECT storage_unit_id FROM rental_contract WHERE id = 1), DATEADD(DAY, -3, GETDATE()), 'PIN_CODE', N'Khách nhập mã', 'FAILED', N'Nhập sai mã PIN lần 1');
END
