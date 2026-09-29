package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.*;
import com.swp391.selfstorage.contract.repository.*;
import com.swp391.selfstorage.contract.event.ContractSettledEvent;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractReturnServiceTest {

        @Mock
        private RentalContractRepository contractRepository;
        @Mock
        private ReturnRequestRepository returnRequestRepository;
        @Mock
        private ContractExtraChargeRepository extraChargeRepository;
        @Mock
        private StorageUnitRepository storageUnitRepository;
        @Mock
        private ReservationRepository reservationRepository;
        @Mock
        private ApplicationEventPublisher eventPublisher;
        @InjectMocks
        private ContractServiceImpl contractService;

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
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.empty());
                when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));

                ReturnInspectionRequest request = ReturnInspectionRequest.builder()
                                .returnDate(LocalDate.now())
                                .condition("MINOR_DAMAGE")
                                .damageNotes("Vỡ bản lề cửa")
                                .damageCost(200_000L)
                                .evidenceImageUrls("https://storage.example.com/img1.jpg")
                                .customerConfirmed(true)
                                .signatureDataUrl("data:image/png;base64,abc")
                                .build();

                ReturnInspectionResponse response = contractService.submitReturnInspection(500L, request, 99L,
                                List.of(1L));

                assertNotNull(response);
                assertEquals(ContractStatus.PENDING_RETURN, contract.getStatus());
                assertEquals(200_000L, response.getDamageCost());
                assertEquals(800_000L, response.getEstimatedDepositRefund());
                verify(extraChargeRepository).save(any(ContractExtraCharge.class));
        }

        @Test
        @DisplayName("BR-RET-08: từ chối nghiệm thu khi khách chưa ký")
        void testSubmitReturnInspection_RequiresSignature() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .facilityId(1L)
                                .status(ContractStatus.PENDING_RETURN)
                                .depositBalance(1_000_000L)
                                .build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(ReturnRequest.builder().contractId(500L).build()));

                ReturnInspectionRequest request = ReturnInspectionRequest.builder()
                                .returnDate(LocalDate.now())
                                .condition("GOOD")
                                .damageCost(0)
                                .customerConfirmed(false)
                                .build();

                assertThrows(CustomException.class,
                                () -> contractService.submitReturnInspection(500L, request, 99L, List.of(1L)));
                verify(returnRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("BR-RET-08: từ chối nghiệm thu hư hại khi không có ảnh")
        void testSubmitReturnInspection_DamageRequiresEvidence() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .facilityId(1L)
                                .status(ContractStatus.PENDING_RETURN)
                                .depositBalance(1_000_000L)
                                .build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(ReturnRequest.builder().contractId(500L).build()));

                ReturnInspectionRequest request = ReturnInspectionRequest.builder()
                                .returnDate(LocalDate.now())
                                .condition("MAJOR_DAMAGE")
                                .damageNotes("Gãy khóa")
                                .damageCost(500_000L)
                                .customerConfirmed(true)
                                .signatureDataUrl("data:image/png;base64,abc")
                                .build();

                assertThrows(CustomException.class,
                                () -> contractService.submitReturnInspection(500L, request, 99L, List.of(1L)));
        }

        @Test
        @DisplayName("BR-RET-09: nghiệm thu thu hồi PIN và chuyển ô OCCUPIED sang CLEANING")
        void testSubmitReturnInspection_RevokesPinAndCleansUnit() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .accessCode("123456")
                                .status(ContractStatus.PENDING_RETURN)
                                .depositBalance(1_000_000L)
                                .build();
                StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.OCCUPIED).build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(ReturnRequest.builder().contractId(500L).build()));
                when(returnRequestRepository.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));

                ReturnInspectionRequest request = ReturnInspectionRequest.builder()
                                .returnDate(LocalDate.now())
                                .condition("GOOD")
                                .damageCost(0)
                                .customerConfirmed(true)
                                .signatureDataUrl("data:image/png;base64,abc")
                                .build();

                contractService.submitReturnInspection(500L, request, 99L, List.of(1L));

                assertNull(contract.getAccessCode());
                assertEquals(ContractStatus.PENDING_RETURN, contract.getStatus());
                assertEquals(StorageUnitStatus.CLEANING, unit.getStatus());
        }

        @Test
        @DisplayName("BR-RET-09: dọn xong về RESERVED nếu còn Reservation CONFIRMED, không thì AVAILABLE")
        void testCompleteCleaning_ReservesUnitWhenConfirmedReservationExists() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .facilityId(1L)
                                .storageUnitId(42L)
                                .status(ContractStatus.PENDING_RETURN)
                                .build();
                StorageUnit unit = StorageUnit.builder().id(42L).status(StorageUnitStatus.CLEANING).build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));
                when(reservationRepository.existsByStorageUnitIdAndStatusIn(42L, List.of(ReservationStatus.CONFIRMED)))
                                .thenReturn(true);

                contractService.completeCleaning(500L, List.of(1L));
                assertEquals(StorageUnitStatus.RESERVED, unit.getStatus());

                unit.setStatus(StorageUnitStatus.CLEANING);
                when(reservationRepository.existsByStorageUnitIdAndStatusIn(42L, List.of(ReservationStatus.CONFIRMED)))
                                .thenReturn(false);
                contractService.completeCleaning(500L, List.of(1L));
                assertEquals(StorageUnitStatus.AVAILABLE, unit.getStatus());
        }

        @Test
        @DisplayName("BR-RET-04: không đóng hợp đồng khi còn payableAmount")
        void testApproveSettlement_KeepsContractOpenWhenPayable() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .customerId(15L)
                                .facilityId(1L)
                                .depositAmount(1_000_000L)
                                .depositBalance(1_000_000L)
                                .status(ContractStatus.PENDING_RETURN)
                                .build();
                ReturnRequest returnReq = ReturnRequest.builder().id(20L).contractId(500L).damageCost(1_500_000L).build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());

                SettlementApprovalResponse response = contractService.approveSettlement(500L,
                                SettlementApprovalRequest.builder().build(), 99L, List.of(1L));

                assertEquals(ContractStatus.PENDING_RETURN, contract.getStatus());
                assertEquals(500_000L, response.getPayableAmount());
                ArgumentCaptor<ContractSettledEvent> captor = ArgumentCaptor.forClass(ContractSettledEvent.class);
                verify(eventPublisher).publishEvent(captor.capture());
                assertEquals(500_000L, captor.getValue().getPayableAmount());
                assertEquals(0L, captor.getValue().getDepositRefundAmount());
        }

        @Test
        @DisplayName("BR-RET-05: hoàn cọc đóng hợp đồng và phát sự kiện ghi giao dịch REFUND")
        void testApproveSettlement_PublishesRefundWhenDepositCoversCharges() {
                RentalContract contract = RentalContract.builder()
                                .id(500L)
                                .customerId(15L)
                                .facilityId(1L)
                                .depositAmount(1_000_000L)
                                .depositBalance(1_000_000L)
                                .status(ContractStatus.PENDING_RETURN)
                                .build();
                ReturnRequest returnReq = ReturnRequest.builder().id(20L).contractId(500L).damageCost(200_000L).build();
                when(contractRepository.findByIdAndFacilityIdIn(eq(500L), anyList())).thenReturn(Optional.of(contract));
                when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(500L))
                                .thenReturn(Optional.of(returnReq));
                when(extraChargeRepository.findByContractIdAndStatus(500L, ExtraChargeStatus.UNPAID))
                                .thenReturn(List.of());

                SettlementApprovalResponse response = contractService.approveSettlement(500L,
                                SettlementApprovalRequest.builder().build(), 99L, List.of(1L));

                assertEquals(ContractStatus.CLOSED, response.getStatus());
                ArgumentCaptor<ContractSettledEvent> captor = ArgumentCaptor.forClass(ContractSettledEvent.class);
                verify(eventPublisher).publishEvent(captor.capture());
                assertEquals(800_000L, captor.getValue().getDepositRefundAmount());
                assertEquals(0L, captor.getValue().getPayableAmount());
        }
}
