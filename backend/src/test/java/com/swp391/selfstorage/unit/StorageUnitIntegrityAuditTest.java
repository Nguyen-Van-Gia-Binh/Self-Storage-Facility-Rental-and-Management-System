package com.swp391.selfstorage.unit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class StorageUnitIntegrityAuditTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Kiểm toán toàn hệ thống: Không được tồn tại ô kho OCCUPIED mồ côi (không có hợp đồng hoạt động)")
    void assertNoOrphanOccupiedUnits() {
        List<Map<String, Object>> orphanOccupied = jdbcTemplate.queryForList("""
            SELECT su.id, su.code, f.code AS fac_code, su.status
            FROM storage_unit su
            JOIN facility f ON su.facility_id = f.id
            LEFT JOIN rental_contract rc ON su.id = rc.storage_unit_id 
                AND rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'PENDING_CHECK_IN')
            WHERE su.status = 'OCCUPIED' AND rc.id IS NULL
        """);

        assertThat(orphanOccupied)
            .as("Không được có ô kho nào mang trạng thái OCCUPIED mà thiếu hợp đồng liên kết")
            .isEmpty();
    }

    @Test
    @DisplayName("Kiểm toán toàn hệ thống: Không được tồn tại ô kho RESERVED mồ côi (không có đơn giữ chỗ hoặc hợp đồng chờ check-in)")
    void assertNoOrphanReservedUnits() {
        List<Map<String, Object>> orphanReserved = jdbcTemplate.queryForList("""
            SELECT su.id, su.code, f.code AS fac_code, su.status
            FROM storage_unit su
            JOIN facility f ON su.facility_id = f.id
            LEFT JOIN reservation r ON su.id = r.storage_unit_id 
                AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED')
            LEFT JOIN rental_contract rc ON su.id = rc.storage_unit_id
                AND rc.status = 'PENDING_CHECK_IN'
            WHERE su.status = 'RESERVED' AND r.id IS NULL AND rc.id IS NULL
        """);

        assertThat(orphanReserved)
            .as("Không được có ô kho nào mang trạng thái RESERVED mà thiếu đơn giữ chỗ hoặc hợp đồng chờ check-in")
            .isEmpty();
    }

    @Test
    @DisplayName("Kiểm toán toàn hệ thống: Hợp đồng ACTIVE/OVERDUE/PENDING_RETURN bắt buộc ô kho phải là OCCUPIED")
    void assertContractUnitStatusSynchronized() {
        List<Map<String, Object>> mismatchContracts = jdbcTemplate.queryForList("""
            SELECT rc.code AS contract_code, rc.status AS contract_status,
                   su.code AS unit_code, su.status AS unit_status, f.code AS fac_code
            FROM rental_contract rc
            JOIN storage_unit su ON rc.storage_unit_id = su.id
            JOIN facility f ON rc.facility_id = f.id
            WHERE rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN') AND su.status <> 'OCCUPIED'
        """);

        assertThat(mismatchContracts)
            .as("Hợp đồng ACTIVE/OVERDUE/PENDING_RETURN phải gắn với ô kho có status OCCUPIED")
            .isEmpty();
    }

    @Test
    @DisplayName("Kiểm toán toàn hệ thống: Kiểm tra ô kho bị gán nhiều hợp đồng ACTIVE/OVERDUE/PENDING_RETURN đồng thời")
    void testConflictingContractsOnSameUnit() {
        List<Map<String, Object>> conflicts = jdbcTemplate.queryForList("""
            SELECT su.id AS unit_id, su.code AS unit_code, f.code AS fac_code, COUNT(rc.id) AS active_contract_count
            FROM storage_unit su
            JOIN facility f ON su.facility_id = f.id
            JOIN rental_contract rc ON su.id = rc.storage_unit_id
            WHERE rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'PENDING_CHECK_IN')
            GROUP BY su.id, su.code, f.code
            HAVING COUNT(rc.id) > 1
        """);

        conflicts.forEach(c -> {
            System.out.println("CONFLICTING UNIT: " + c);
            List<Map<String, Object>> details = jdbcTemplate.queryForList("""
                SELECT rc.id, rc.code, rc.status, u.full_name, u.email, rc.start_date, rc.end_date
                FROM rental_contract rc
                JOIN app_user u ON rc.customer_id = u.id
                WHERE rc.storage_unit_id = ? AND rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'PENDING_CHECK_IN')
            """, c.get("unit_id"));
            details.forEach(d -> System.out.println("   --> " + d));
        });
    }
}
