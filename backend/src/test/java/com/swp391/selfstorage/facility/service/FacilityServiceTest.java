package com.swp391.selfstorage.facility.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityStatusRequest;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.mapper.FacilityMapper;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacilityServiceTest {

    @Mock
    private FacilityRepository facilityRepository;

    private final FacilityMapper facilityMapper = new FacilityMapper();
    private FacilityServiceImpl facilityService;
    private Facility facility;

    @BeforeEach
    void setUp() {
        facilityService = new FacilityServiceImpl(facilityRepository, facilityMapper);

        facility = new Facility();
        facility.setId(1L);
        facility.setCode("FAC-CG");
        facility.setName("Kho Cầu Giấy");
        facility.setAddress("19 Duy Tân, Cầu Giấy");
        facility.setStatus(FacilityStatus.ACTIVE);
    }

    @Test
    @DisplayName("Tạo cơ sở thành công khi mã chưa tồn tại")
    void testCreateFacilitySuccess() {
        CreateFacilityRequest req = new CreateFacilityRequest();
        req.setCode("FAC-NEW");
        req.setName("Kho Mới");
        req.setAddress("456 Cầu Giấy");

        when(facilityRepository.existsByCode("FAC-NEW")).thenReturn(false);
        when(facilityRepository.save(any(Facility.class))).thenAnswer(i -> {
            Facility f = i.getArgument(0);
            f.setId(2L);
            return f;
        });

        FacilityResponse res = facilityService.createFacility(req);
        assertNotNull(res);
        assertEquals("FAC-NEW", res.getCode());
        assertEquals("Kho Mới", res.getName());
    }

    @Test
    @DisplayName("Tạo cơ sở thất bại khi mã đã tồn tại")
    void testCreateFacilityDuplicateCode() {
        CreateFacilityRequest req = new CreateFacilityRequest();
        req.setCode("FAC-CG");
        req.setName("Kho Trùng");
        req.setAddress("456 Cầu Giấy");

        when(facilityRepository.existsByCode("FAC-CG")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.createFacility(req));
        assertEquals(ErrorCode.FACILITY_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngừng khai thác thất bại khi còn hợp đồng đang ACTIVE")
    void testDeactivateFacilityWithActiveContracts() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.countActiveContractsByFacilityId(1L)).thenReturn(3L);

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(false);

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.updateFacilityStatus(1L, req));
        assertEquals(ErrorCode.FACILITY_HAS_ACTIVE_CONTRACTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngừng khai thác thành công khi không còn hợp đồng ACTIVE")
    void testDeactivateFacilitySuccess() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.countActiveContractsByFacilityId(1L)).thenReturn(0L);
        when(facilityRepository.save(any(Facility.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(false);

        FacilityResponse res = facilityService.updateFacilityStatus(1L, req);
        assertFalse(res.isActive());
    }
}
