package com.swp391.selfstorage.seed;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

public class DatabaseSeedRunnerTest {

    private static final String DEFAULT_DB_URL = "jdbc:postgresql://ep-round-rice-b3raiy2r-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    private static final String DEFAULT_USER = "neondb_owner";
    private static final String DEFAULT_PASS = "npg_gpKMC1tJS5lq";

    @Test
    @DisplayName("Nap lai du lieu kiem thu chuan (Seed & Reset Test Scenarios)")
    void seedAndResetTestScenarios() throws Exception {
        String dbUrl = System.getenv().getOrDefault("DB_URL", DEFAULT_DB_URL);
        String dbUser = System.getenv().getOrDefault("DB_USERNAME", DEFAULT_USER);
        String dbPass = System.getenv().getOrDefault("DB_PASSWORD", DEFAULT_PASS);

        Path sqlPath = Paths.get("../database/scripts/seed_test_scenarios.sql");
        if (!Files.exists(sqlPath)) {
            sqlPath = Paths.get("database/scripts/seed_test_scenarios.sql");
        }
        assertThat(sqlPath).exists();

        String sqlContent = Files.readString(sqlPath);

        System.out.println("========================================================================================================================");
        System.out.println(">>> [SMARTSTORAGE] DANG THUC THI V28 MIGRATION (CHUAN HOA CO SO VA O KHO Q1)...");
        Path v28Path = Paths.get("src/main/resources/db/migration/V28__focus_three_key_facilities_and_standardize_q1_units.sql");
        if (!Files.exists(v28Path)) {
            v28Path = Paths.get("backend/src/main/resources/db/migration/V28__focus_three_key_facilities_and_standardize_q1_units.sql");
        }
        if (!Files.exists(v28Path)) {
            v28Path = Paths.get("../backend/src/main/resources/db/migration/V28__focus_three_key_facilities_and_standardize_q1_units.sql");
        }
        assertThat(v28Path).exists();
        String v28Sql = Files.readString(v28Path);

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
             Statement stmt = conn.createStatement()) {
            stmt.execute(v28Sql);
            System.out.println(">>> THUC THI V28 SQL THANH CONG!");

            // Ghi nhan vao flyway_schema_history neu chua co
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '28'");
            if (rs.next() && rs.getInt(1) == 0) {
                stmt.execute("INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) " +
                        "VALUES ((SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history), '28', 'focus three key facilities and standardize q1 units', 'SQL', 'V28__focus_three_key_facilities_and_standardize_q1_units.sql', 0, 'neondb_owner', CURRENT_TIMESTAMP, 50, TRUE)");
                System.out.println(">>> DONG BO BAN GHI V28 VAO FLYWAY_SCHEMA_HISTORY THANH CONG!");
            }
        }

        System.out.println(">>> DANG KET NOI VAO NEON CLOUD DATABASE DE SEED 8 KICH BAN THU NGHIEM VANG...");
        System.out.println("========================================================================================================================");

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
             Statement stmt = conn.createStatement()) {

            stmt.execute(sqlContent);

            System.out.println(">>> SEED DU LIEU THANH CONG! DANH SACH 8 HOP DONG TEST MAU (CO SO QUAN 1 - FAC-Q1):");
            System.out.println("------------------------------------------------------------------------------------------------------------------------");
            System.out.printf("%-15s | %-10s | %-15s | %-15s | %-12s | %-15s | %-15s | %-18s%n",
                    "MA HOP DONG", "O KHO", "TRANG THAI HD", "KHO VAT LY", "HET HAN", "TIEN COC (VND)", "NO PHAT (VND)", "MA PIN");
            System.out.println("------------------------------------------------------------------------------------------------------------------------");

            String query = """
                SELECT 
                    c.id AS contract_id,
                    c.code AS contract_code,
                    su.code AS unit_code,
                    c.status AS contract_status,
                    su.status AS unit_status,
                    c.end_date AS end_date,
                    c.deposit_amount AS deposit,
                    c.overdue_fee_accrued AS overdue_fee,
                    CASE WHEN c.access_code IS NOT NULL THEN 'PIN: ' || c.access_code ELSE 'BI KHOA (LOCKED)' END AS pin_state
                FROM rental_contract c
                JOIN storage_unit su ON c.storage_unit_id = su.id
                WHERE c.customer_id = 10
                ORDER BY c.id ASC;
                """;

            try (ResultSet rs = stmt.executeQuery(query)) {
                int count = 0;
                while (rs.next()) {
                    count++;
                    System.out.printf("%-15s | %-10s | %-15s | %-15s | %-12s | %,15d | %,15d | %-18s%n",
                            rs.getString("contract_code"),
                            rs.getString("unit_code"),
                            rs.getString("contract_status"),
                            rs.getString("unit_status"),
                            rs.getString("end_date"),
                            rs.getLong("deposit"),
                            rs.getLong("overdue_fee"),
                            rs.getString("pin_state"));
                }
                assertThat(count).isEqualTo(8);
            }
            System.out.println("------------------------------------------------------------------------------------------------------------------------");
            System.out.println(">>> TAI KHOAN DANG NHAP DE TEST (MAT KHAU: password123):");
            System.out.println("   [1] Khach hang (Customer)  : nhi.customer@gmail.com   -> Xem kho cua toi, bao tra kho, nop phat");
            System.out.println("   [2] Quan ly co so (FM)     : fm.q1@smartstorage.vn    -> Nguyen Van Gia Binh (Duyet quyet toan, Kho Tong)");
            System.out.println("   [3] Nhan vien ca truc (FS) : staff.q1@smartstorage.vn -> Tran Van Hung (Nghiem thu hien truong, checklist)");
            System.out.println("========================================================================================================================");

            System.out.println(">>> [KIEM TRA DOI SOAT 1] TRANG THAI CAC CO SO (FACILITIES):");
            try (ResultSet rsFac = stmt.executeQuery("SELECT id, code, name, status FROM facility ORDER BY id ASC")) {
                while (rsFac.next()) {
                    System.out.printf("   - ID %-2d | %-8s | %-32s | TRANG THAI: %s%n",
                            rsFac.getInt("id"), rsFac.getString("code"), rsFac.getString("name"), rsFac.getString("status"));
                }
            }

            System.out.println(">>> [KIEM TRA DOI SOAT 2] DO PHU 10 LOAI O KHO TAI CO SO QUAN 1 (FAC-Q1 - ID 5):");
            try (ResultSet rsUnits = stmt.executeQuery(
                    "SELECT ut.id AS type_id, ut.code AS type_code, ut.name AS type_name, " +
                    "COUNT(su.id) AS total_units, " +
                    "COUNT(CASE WHEN su.status = 'AVAILABLE' THEN 1 END) AS available_units, " +
                    "COUNT(CASE WHEN su.status = 'OCCUPIED' THEN 1 END) AS occupied_units, " +
                    "COUNT(CASE WHEN su.status = 'CLEANING' THEN 1 END) AS cleaning_units, " +
                    "COUNT(CASE WHEN su.status = 'MAINTENANCE' THEN 1 END) AS maint_units " +
                    "FROM unit_type ut " +
                    "LEFT JOIN storage_unit su ON su.unit_type_id = ut.id AND su.facility_id = 5 " +
                    "GROUP BY ut.id, ut.code, ut.name " +
                    "ORDER BY ut.id ASC")) {
                while (rsUnits.next()) {
                    System.out.printf("   - [%2d] %-12s | %-20s | TONG: %2d | SAN SANG (AVAILABLE): %2d | OCCUPIED: %2d | CLEANING: %2d | MAINT: %2d%n",
                            rsUnits.getInt("type_id"), rsUnits.getString("type_code"), rsUnits.getString("type_name"),
                            rsUnits.getInt("total_units"), rsUnits.getInt("available_units"),
                            rsUnits.getInt("occupied_units"), rsUnits.getInt("cleaning_units"), rsUnits.getInt("maint_units"));
                }
            }

            System.out.println(">>> [KIEM TRA DOI SOAT 3] TONG QUAN DU LIEU GIAO DICH TOAN HE THONG (GLOBAL CLEAN SLATE):");
            try (ResultSet rsStats = stmt.executeQuery(
                    "SELECT " +
                    "(SELECT COUNT(*) FROM rental_contract) AS total_contracts, " +
                    "(SELECT COUNT(*) FROM reservation) AS total_reservations, " +
                    "(SELECT COUNT(*) FROM return_request) AS total_returns, " +
                    "(SELECT COUNT(*) FROM handover_record) AS total_handovers, " +
                    "(SELECT COUNT(*) FROM payment_transaction) AS total_payments")) {
                if (rsStats.next()) {
                    System.out.printf("   - Tong Hop dong: %d | Tong Dat cho: %d | Tong Yeu cau tra: %d | Tong Ban giao: %d | Tong Giao dich: %d%n",
                            rsStats.getInt("total_contracts"), rsStats.getInt("total_reservations"),
                            rsStats.getInt("total_returns"), rsStats.getInt("total_handovers"), rsStats.getInt("total_payments"));
                }
            }

            System.out.println(">>> [KIEM TRA DOI SOAT 4] TRANG THAI O KHO THEO 3 CO SO ACTIVE:");
            try (ResultSet rsFacUnits = stmt.executeQuery(
                    "SELECT f.id, f.code, f.name, " +
                    "COUNT(su.id) AS total_units, " +
                    "COUNT(CASE WHEN su.status = 'AVAILABLE' THEN 1 END) AS avail_units, " +
                    "COUNT(CASE WHEN su.status != 'AVAILABLE' THEN 1 END) AS in_use_units " +
                    "FROM facility f " +
                    "LEFT JOIN storage_unit su ON su.facility_id = f.id " +
                    "WHERE f.status = 'ACTIVE' " +
                    "GROUP BY f.id, f.code, f.name " +
                    "ORDER BY f.id ASC")) {
                while (rsFacUnits.next()) {
                    System.out.printf("   - %-8s (%-25s) | Tong o kho: %2d | SAN SANG (AVAILABLE): %2d | DANG DUNG (TEST): %2d%n",
                            rsFacUnits.getString("code"), rsFacUnits.getString("name"),
                            rsFacUnits.getInt("total_units"), rsFacUnits.getInt("avail_units"), rsFacUnits.getInt("in_use_units"));
                }
            }
            System.out.println("========================================================================================================================");
        }
    }
}
