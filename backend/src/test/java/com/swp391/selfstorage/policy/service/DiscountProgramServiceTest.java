package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.policy.entity.DiscountProgram;
import com.swp391.selfstorage.policy.repository.DiscountProgramRepository;
import com.swp391.selfstorage.policy.service.impl.DiscountProgramServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscountProgramServiceTest {

    @Mock
    private DiscountProgramRepository discountProgramRepository;

    @InjectMocks
    private DiscountProgramServiceImpl discountProgramService;

    private DiscountProgram program6m;
    private DiscountProgram program12m;

    @BeforeEach
    void setUp() {
        program6m = DiscountProgram.builder()
                .id(1L)
                .name("Ưu đãi 6 tháng (5%)")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(5.0))
                .minRentalMonths(6)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(10))
                .scopeType("SYSTEM")
                .isActive(true)
                .build();

        program12m = DiscountProgram.builder()
                .id(2L)
                .name("Ưu đãi 12 tháng (10%)")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(10.0))
                .minRentalMonths(12)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(10))
                .scopeType("SYSTEM")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Khách thuê 3 tháng: Không có chương trình nào thỏa mãn min_rental_months -> discount = 0")
    void testFindBestDiscount_3Months_NoDiscount() {
        when(discountProgramRepository.findApplicablePrograms(any(), eq(3), eq(1L), eq(2L)))
                .thenReturn(List.of());

        var result = discountProgramService.findBestDiscount(1L, 2L, 3, 3_000_000L, LocalDate.now());

        assertNotNull(result);
        assertNull(result.programId());
        assertEquals(0L, result.discountAmount());
        assertEquals(0.0, result.discountRate());
    }

    @Test
    @DisplayName("Khách thuê 6 tháng: Thỏa mãn chương trình 6 tháng 5% -> giảm 5% làm tròn")
    void testFindBestDiscount_6Months_5Percent() {
        when(discountProgramRepository.findApplicablePrograms(any(), eq(6), eq(1L), eq(2L)))
                .thenReturn(List.of(program6m));

        // 6 tháng * 1.000.000 = 6.000.000đ; 5% = 300.000đ
        var result = discountProgramService.findBestDiscount(1L, 2L, 6, 6_000_000L, LocalDate.now());

        assertEquals(1L, result.programId());
        assertEquals("Ưu đãi 6 tháng (5%)", result.programName());
        assertEquals(0.05, result.discountRate());
        assertEquals(300_000L, result.discountAmount());
    }

    @Test
    @DisplayName("Khách thuê 12 tháng: Thỏa mãn cả 2 chương trình -> Chọn Best Deal (10% > 5%)")
    void testFindBestDiscount_12Months_SelectBestDeal() {
        when(discountProgramRepository.findApplicablePrograms(any(), eq(12), eq(1L), eq(2L)))
                .thenReturn(List.of(program6m, program12m));

        // 12 tháng * 1.000.000 = 12.000.000đ; 10% = 1.200.000đ
        var result = discountProgramService.findBestDiscount(1L, 2L, 12, 12_000_000L, LocalDate.now());

        assertEquals(2L, result.programId());
        assertEquals("Ưu đãi 12 tháng (10%)", result.programName());
        assertEquals(0.10, result.discountRate());
        assertEquals(1_200_000L, result.discountAmount());
    }
}
