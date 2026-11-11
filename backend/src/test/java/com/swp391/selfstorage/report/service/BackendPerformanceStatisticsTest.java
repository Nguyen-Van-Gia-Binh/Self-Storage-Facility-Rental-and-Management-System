package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.service.FacilityService;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "app.cron.payment-reconciliation.enabled=false"
})
class BackendPerformanceStatisticsTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private FacilityService facilityService;

    @Autowired
    private SystemReportService systemReportService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Hibernate Statistics: kiểm chứng số lượng SQL statements hằng số (O(1)) và Cache Hit = 0 SQL")
    void verifyConstantQueryCountsWithHibernateStatistics() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        stats.setStatisticsEnabled(true);

        clearCache("facilities");
        clearCache("assignedFacilities");
        clearCache("userDetails");

        // 1. Đo CustomUserDetailsService (Cold vs Warm)
        List<AppUser> users = userRepository.findAll(PageRequest.of(0, 1)).getContent();
        if (!users.isEmpty()) {
            String email = users.get(0).getEmail();

            stats.clear();
            long t0 = System.nanoTime();
            userDetailsService.loadUserByUsername(email);
            long coldUserSql = stats.getPrepareStatementCount();
            long coldUserMs = (System.nanoTime() - t0) / 1_000_000;

            stats.clear();
            long t1 = System.nanoTime();
            userDetailsService.loadUserByUsername(email);
            long warmUserSql = stats.getPrepareStatementCount();
            long warmUserMs = (System.nanoTime() - t1) / 1_000_000;

            System.out.printf("[PERF] loadUserByUsername: cold=%d SQL (%d ms), warm(L1)=%d SQL (%d ms)%n",
                    coldUserSql, coldUserMs, warmUserSql, warmUserMs);

            assertTrue(coldUserSql <= 3, "Cold user lookup should run <= 3 SQL, actual=" + coldUserSql);
            assertEquals(0, warmUserSql, "Warm userDetails cache hit must execute 0 SQL");
        }

        // 2. Đo FacilityService.getFacilities (Cold vs Warm)
        stats.clear();
        long tf0 = System.nanoTime();
        PageResponse<FacilityResponse> facilitiesPage = facilityService.getFacilities(null, true, PageRequest.of(0, 20));
        long coldFacSql = stats.getPrepareStatementCount();
        long coldFacMs = (System.nanoTime() - tf0) / 1_000_000;

        stats.clear();
        long tf1 = System.nanoTime();
        facilityService.getFacilities(null, true, PageRequest.of(0, 20));
        long warmFacSql = stats.getPrepareStatementCount();
        long warmFacMs = (System.nanoTime() - tf1) / 1_000_000;

        System.out.printf("[PERF] getFacilities(%d items): cold=%d SQL (%d ms), warm(L1)=%d SQL (%d ms)%n",
                facilitiesPage.getContent().size(), coldFacSql, coldFacMs, warmFacSql, warmFacMs);

        assertTrue(coldFacSql <= 8, "Cold getFacilities must stay constant O(1) <= 8 SQL, actual=" + coldFacSql);
        assertEquals(0, warmFacSql, "Warm facilities cache hit must execute 0 SQL");

        // 3. Đo SystemReportService.getSystemRevenueReport
        stats.clear();
        long tr0 = System.nanoTime();
        SystemRevenueReportResponse revenue = systemReportService.getSystemRevenueReport(null, null, null);
        long revSql = stats.getPrepareStatementCount();
        long revMs = (System.nanoTime() - tr0) / 1_000_000;

        System.out.printf("[PERF] getSystemRevenueReport(%d facilities): %d SQL (%d ms)%n",
                revenue.getByFacility().size(), revSql, revMs);

        assertTrue(revSql <= 6, "Revenue report must stay constant O(1) <= 6 SQL, actual=" + revSql);

        // 4. Đo SystemReportService.getSystemOccupancyReport
        stats.clear();
        long to0 = System.nanoTime();
        SystemOccupancyReportResponse occupancy = systemReportService.getSystemOccupancyReport(null);
        long occSql = stats.getPrepareStatementCount();
        long occMs = (System.nanoTime() - to0) / 1_000_000;

        System.out.printf("[PERF] getSystemOccupancyReport(%d facilities): %d SQL (%d ms)%n",
                occupancy.getFacilities().size(), occSql, occMs);

        assertTrue(occSql <= 4, "Occupancy report must stay constant O(1) <= 4 SQL, actual=" + occSql);

        // 5. Đo SystemReportService.getSystemOverdueContracts
        stats.clear();
        long tov0 = System.nanoTime();
        systemReportService.getSystemOverdueContracts(null, null, PageRequest.of(0, 10));
        long ovSql = stats.getPrepareStatementCount();
        long ovMs = (System.nanoTime() - tov0) / 1_000_000;

        System.out.printf("[PERF] getSystemOverdueContracts: %d SQL (%d ms)%n", ovSql, ovMs);

        assertTrue(ovSql <= 5, "Overdue report must stay constant O(1) <= 5 SQL, actual=" + ovSql);
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}

