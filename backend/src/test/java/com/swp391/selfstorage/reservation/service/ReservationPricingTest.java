package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.reservation.dto.CalculatePriceRequest;
import com.swp391.selfstorage.reservation.dto.CalculatePriceResponse;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ReservationPricingTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @InjectMocks private ReservationServiceImpl service;

    @Test
    @DisplayName("BR-DEP-01: Tiền cọc an ninh bằng đúng 1 tháng tiền thuê")
    void shouldCalculateCorrectDeposit_accordingToBRDEP01() {
        long monthlyRate = 1_500_000L;
        int months = 3;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        assertNotNull(response);
        assertEquals(monthlyRate, response.getDepositAmount(),
                "Tiền cọc an ninh phải bằng đúng 1 tháng tiền thuê theo BR-DEP-01");
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 3, 5})
    @DisplayName("Chiết khấu: Kỳ hạn dưới 6 tháng được chiết khấu 0%")
    void shouldApplyNoDiscount_whenRentalPeriodLessThan6Months(int months) {
        long monthlyRate = 1_000_000L;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        assertEquals(0.0, response.getDiscountPercentage());
        assertEquals(0L, response.getDiscountAmount());
        assertEquals(monthlyRate * months, response.getFinalRentTotal());
        assertEquals(response.getFinalRentTotal() + response.getDepositAmount(), response.getTotalDueToday());
    }

    @ParameterizedTest
    @ValueSource(ints = {6, 9, 11})
    @DisplayName("Chiết khấu: Kỳ hạn từ 6 đến 11 tháng được chiết khấu 5%")
    void shouldApply5PercentDiscount_whenRentalPeriodBetween6And11Months(int months) {
        long monthlyRate = 1_000_000L;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        long expectedRawRent = monthlyRate * months;
        long expectedDiscount = Math.round((expectedRawRent * 0.05) / 1000.0) * 1000;
        long expectedFinalRent = expectedRawRent - expectedDiscount;

        assertEquals(0.05, response.getDiscountPercentage());
        assertEquals(expectedDiscount, response.getDiscountAmount());
        assertEquals(expectedFinalRent, response.getFinalRentTotal());
        assertEquals(expectedFinalRent + response.getDepositAmount(), response.getTotalDueToday());
    }

    @ParameterizedTest
    @ValueSource(ints = {12, 18, 24})
    @DisplayName("Chiết khấu: Kỳ hạn từ 12 tháng trở lên được chiết khấu 10%")
    void shouldApply10PercentDiscount_whenRentalPeriodIs12MonthsOrMore(int months) {
        long monthlyRate = 2_000_000L;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        long expectedRawRent = monthlyRate * months;
        long expectedDiscount = Math.round((expectedRawRent * 0.10) / 1000.0) * 1000;
        long expectedFinalRent = expectedRawRent - expectedDiscount;

        assertEquals(0.10, response.getDiscountPercentage());
        assertEquals(expectedDiscount, response.getDiscountAmount());
        assertEquals(expectedFinalRent, response.getFinalRentTotal());
        assertEquals(expectedFinalRent + response.getDepositAmount(), response.getTotalDueToday());
    }

    @Test
    @DisplayName("BR-GEN-04: Làm tròn tiền chiết khấu và tiền cọc đến 1.000 VNĐ")
    void shouldRoundToNearest1000Vnd_accordingToBRGEN04() {
        long monthlyRate = 1_234_567L; // Số lẻ không chia hết cho 1.000
        int months = 6;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        // 1_234_567 làm tròn đến 1000 -> 1_235_000
        assertEquals(1_235_000L, response.getDepositAmount());
        assertEquals(0L, response.getDepositAmount() % 1000);
        // rawRent = 1_234_567 * 6 = 7_407_402. Chiết khấu 5% = 370_370.1 -> làm tròn 370_000
        assertEquals(370_000L, response.getDiscountAmount());
        assertEquals(0L, response.getDiscountAmount() % 1000);

        // Khi đơn giá chuẩn bội số của 1.000 VNĐ
        CalculatePriceRequest standardReq = new CalculatePriceRequest(1_234_000L, 6);
        CalculatePriceResponse standardRes = service.calculatePrice(standardReq);
        assertEquals(0L, standardRes.getDepositAmount() % 1000);
        assertEquals(0L, standardRes.getDiscountAmount() % 1000);
        assertEquals(0L, standardRes.getFinalRentTotal() % 1000);
        assertEquals(0L, standardRes.getTotalDueToday() % 1000);
    }

    @Test
    @DisplayName("Tổng số tiền phải trả hôm nay = Tiền thuê sau chiết khấu + Tiền cọc an ninh")
    void shouldCalculateTotalDueToday_asSumOfFinalRentAndDeposit() {
        long monthlyRate = 1_200_000L;
        int months = 6;
        CalculatePriceRequest request = new CalculatePriceRequest(monthlyRate, months);

        CalculatePriceResponse response = service.calculatePrice(request);

        assertEquals(response.getFinalRentTotal() + response.getDepositAmount(), response.getTotalDueToday());
    }

    @Test
    @DisplayName("Xử lý ngoại lệ biên: Giá thuê hoặc số tháng <= 0")
    void shouldHandleEdgeCases_zeroRateOrNegativeMonths() {
        // Giá thuê âm -> đưa về 0
        CalculatePriceRequest negativePriceReq = new CalculatePriceRequest(-500_000L, 3);
        CalculatePriceResponse response1 = service.calculatePrice(negativePriceReq);
        assertEquals(0L, response1.getMonthlyPrice());
        assertEquals(0L, response1.getRawRentTotal());
        assertEquals(0L, response1.getDepositAmount());
        assertEquals(0L, response1.getTotalDueToday());

        // Số tháng <= 0 -> đưa về tối thiểu 1 tháng
        CalculatePriceRequest negativeMonthsReq = new CalculatePriceRequest(1_000_000L, -2);
        CalculatePriceResponse response2 = service.calculatePrice(negativeMonthsReq);
        assertEquals(1, response2.getRentalMonths());
        assertEquals(1_000_000L, response2.getRawRentTotal());
        assertEquals(1_000_000L, response2.getDepositAmount());
        assertEquals(2_000_000L, response2.getTotalDueToday());
    }
}
