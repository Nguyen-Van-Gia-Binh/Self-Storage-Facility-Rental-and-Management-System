package com.swp391.selfstorage.seed;

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
    @DisplayName("Nạp lại dữ liệu kiểm thử chuẩn (Seed & Reset Test Scenarios)")
    void seedAndResetTestScenarios() throws Exception {
        String dbUrl = System.getenv().getOrDefault("DB_URL", DEFAULT_DB_URL);
        String dbUser = System.getenv().getOrDefault("DB_USERNAME", DEFAULT_USER);
        String dbPass = System.getenv().getOrDefault("DB_PASSWORD", DEFAULT_PASS);

        Path sqlPath = Paths.get("../database/scripts/seed_test_scenarios_flow3_and_flow6.sql");
        if (!Files.exists(sqlPath)) {
            sqlPath = Paths.get("database/scripts/seed_test_scenarios_flow3_and_flow6.sql");
        }
        assertThat(sqlPath).exists();

        String sqlContent = Files.readString(sqlPath);

        System.out.println("=============================================================================");
        System.out.println(">>> ĐANG KẾT NỐI VÀO DATABASE ĐỂ SEED 8 KỊCH BẢN THỬ NGHIỆM VÀNG...");
        System.out.println("=============================================================================");

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
             Statement stmt = conn.createStatement()) {

            stmt.execute(sqlContent);

            System.out.println(">>> SEED DỮ LIỆU THÀNH CÔNG! DANH SÁCH 8 HỢP ĐỒNG TEST MẪU:");
            System.out.println("------------------------------------------------------------------------------------------------------------------------");
            System.out.printf("%-15s | %-10s | %-15s | %-15s | %-12s | %-12s | %-12s | %-15s%n",
                    "MÃ HỢP ĐỒNG", "Ô KHO", "TRẠNG THÁI", "KHO VẬT LÝ", "HẾT HẠN", "TIỀN CỌC", "NỢ PHẠT", "MÃ PIN");
            System.out.println("------------------------------------------------------------------------------------------------------------------------");

            String query = """
                SELECT 
                    c.code AS contract_code,
                    su.code AS unit_code,
                    c.status AS contract_status,
                    su.status AS unit_status,
                    c.end_date AS end_date,
                    c.deposit_amount AS deposit,
                    c.overdue_fee_accrued AS overdue_fee,
                    CASE WHEN c.access_code IS NOT NULL THEN 'PIN: ' || c.access_code ELSE 'BỊ KHÓA' END AS pin_state
                FROM rental_contract c
                JOIN storage_unit su ON c.storage_unit_id = su.id
                WHERE c.code LIKE 'CTR-TEST-%'
                ORDER BY c.id ASC;
                """;

            try (ResultSet rs = stmt.executeQuery(query)) {
                int count = 0;
                while (rs.next()) {
                    count++;
                    System.out.printf("%-15s | %-10s | %-15s | %-15s | %-12s | %-12d | %-12d | %-15s%n",
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
            System.out.println(">>> TÀI KHOẢN ĐĂNG NHẬP ĐỂ TEST:");
            System.out.println("   - Khách hàng (Customer): nhi.customer@gmail.com / password123");
            System.out.println("   - Quản lý cơ sở (FM)  : fm.q1@smartstorage.vn  / password123 (Nguyễn Văn Gia Bình - Q1)");
            System.out.println("   - Nhân viên ca trực (FS): staff.q1@smartstorage.vn / password123 (Trần Văn Hùng - Q1)");
            System.out.println("=============================================================================");
        }
    }
}
