package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractReturnServiceTest {

    @Mock private RentalContractRepository contractRepository;
    @Mock private ReturnRequestRepository returnRequestRepository;
    @Mock private ContractExtraChargeRepository extraChargeRepository;
    @InjectMocks private ContractServiceImpl contractService;

    @Test
    @DisplayName("FS-04: submitReturnNotice tạo ReturnRequest thành công")
    void testSubmitReturnNotice() {
        RentalContract contract = RentalContract.builder()
                .id(500L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> {
            ReturnRequest r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        ReturnNoticeRequest req = ReturnNoticeRequest.builder()
                .intendedReturnDate(LocalDate.now().plusDays(2))
                .notes("Trả kho đúng hạn")
                .build();

        ReturnNoticeResponse res = contractService.submitReturnNotice(500L, req, List.of(1L));

        assertNotNull(res);
        assertEquals(10L, res.getId());
        assertEquals(500L, res.getContractId());
        assertEquals(ReturnRequestStatus.PENDING, res.getStatus());
    }

    @Test
    @DisplayName("FS-04: submitReturnNotice ném lỗi nếu contract không ACTIVE/OVERDUE")
    void testSubmitReturnNotice_InvalidStatus() {
        RentalContract contract = RentalContract.builder()
                .id(500L)
                .facilityId(1L)
                .status(ContractStatus.TERMINATED)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));

        ReturnNoticeRequest req = ReturnNoticeRequest.builder()
                .intendedReturnDate(LocalDate.now().plusDays(2))
                .build();

        assertThrows(CustomException.class, () -> contractService.submitReturnNotice(500L, req, List.of(1L)));
    }

    @Test
    @DisplayName("FS-04: submitReturnInspection cập nhật PENDING_RETURN và lưu extraCharge nếu có hư hại")
    void testSubmitReturnInspectionWithDamage() {
        RentalContract contract = RentalContract.builder()
                .id(500L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .depositAmount(1_000_000L)
                .depositBalance(1_000_000L)
                .build();

        when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L)).thenReturn(Optional.empty());
        when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

        ReturnInspectionRequest request = ReturnInspectionRequest.builder()
                .returnDate(LocalDate.now())
                .condition("MINOR_DAMAGE")
                .damageNotes("Vỡ bản lề cửa")
                .damageCost(200_000L)
                .evidenceImageUrls("https://storage.example.com/img1.jpg")
                .build();

        ReturnInspectionResponse response = contractService.submitReturnInspection(500L, request, 99L, List.of(1L));

        assertNotNull(response);
        assertEquals(ContractStatus.PENDING_RETURN, contract.getStatus());
        assertEquals(200_000L, response.getDamageCost());
        assertEquals(800_000L, response.getEstimatedDepositRefund());
        verify(extraChargeRepository).save(any(ContractExtraCharge.class));
    }
}
