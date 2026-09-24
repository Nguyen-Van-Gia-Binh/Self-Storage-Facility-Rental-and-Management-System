package com.swp391.selfstorage.facility.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityRequest;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    @DisplayName("US-BM-01.1 AC-1: Lấy danh sách cơ sở có phân trang và bộ lọc từ khóa/trạng thái")
    void shouldReturnPagedFacilities_whenFilteredByKeywordAndStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        when(facilityRepository.findByFilter(eq("Cầu Giấy"), eq(FacilityStatus.ACTIVE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(facility), pageable, 1));

        PageResponse<FacilityResponse> response = facilityService.getFacilities("Cầu Giấy", true, pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("FAC-CG", response.getContent().get(0).getCode());
        assertEquals(0, response.getPage());
        assertEquals(1, response.getTotalElements());
    }

    @Test
    @DisplayName("US-BM-01.1: Lấy chi tiết cơ sở thành công khi ID tồn tại")
    void shouldReturnFacility_whenFoundById() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.findLowestMonthlyPriceByFacilityId(1L)).thenReturn(new java.math.BigDecimal("500000"));
        when(facilityRepository.countActiveUnitTypesByFacilityId(1L)).thenReturn(4);

        FacilityResponse response = facilityService.getFacilityById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("FAC-CG", response.getCode());
        assertEquals("Kho Cầu Giấy", response.getName());
        assertEquals(new java.math.BigDecimal("500000"), response.getLowestMonthlyPrice());
        assertEquals(4, response.getActiveUnitTypeCount());
    }

    @Test
    @DisplayName("US-BM-01.1: Ném lỗi FACILITY_NOT_FOUND khi tra cứu ID không tồn tại")
    void shouldThrowCustomException_whenFacilityNotFoundById() {
        when(facilityRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.getFacilityById(99L));
        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-01.1 AC-2: Tạo cơ sở thành công khi mã chưa tồn tại")
    void shouldCreateFacility_whenCodeIsUnique() {
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
    @DisplayName("US-BM-01.1 AC-4: Tạo cơ sở thất bại khi mã đã tồn tại")
    void shouldThrowCustomException_whenCreatingFacilityWithDuplicateCode() {
        CreateFacilityRequest req = new CreateFacilityRequest();
        req.setCode("FAC-CG");
        req.setName("Kho Trùng");
        req.setAddress("456 Cầu Giấy");

        when(facilityRepository.existsByCode("FAC-CG")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.createFacility(req));
        assertEquals(ErrorCode.FACILITY_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-01.1 AC-3: Cập nhật thông tin tên và địa chỉ cơ sở thành công")
    void shouldUpdateFacility_whenValidRequest() {
        UpdateFacilityRequest req = new UpdateFacilityRequest();
        req.setName("Kho Cầu Giấy Mới");
        req.setAddress("21 Duy Tân, Cầu Giấy");

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.save(any(Facility.class))).thenAnswer(i -> i.getArgument(0));

        FacilityResponse res = facilityService.updateFacility(1L, req);

        assertNotNull(res);
        assertEquals("Kho Cầu Giấy Mới", res.getName());
        assertEquals("21 Duy Tân, Cầu Giấy", res.getAddress());
    }

    @Test
    @DisplayName("US-BM-01.1: Cập nhật cơ sở thất bại khi không tìm thấy ID")
    void shouldThrowCustomException_whenUpdatingNonExistentFacility() {
        UpdateFacilityRequest req = new UpdateFacilityRequest();
        req.setName("Kho Không Tồn Tại");

        when(facilityRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.updateFacility(99L, req));
        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-01.2 AC-1: Ngừng khai thác thành công khi không còn hợp đồng ACTIVE")
    void shouldDeactivateFacility_whenNoActiveContracts() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.countActiveContractsByFacilityId(1L)).thenReturn(0L);
        when(facilityRepository.save(any(Facility.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(false);

        FacilityResponse res = facilityService.updateFacilityStatus(1L, req);
        assertFalse(res.isActive());
    }

    @Test
    @DisplayName("US-BM-01.2 AC-2: Ngừng khai thác thất bại khi còn hợp đồng đang ACTIVE")
    void shouldThrowCustomException_whenDeactivatingFacilityWithActiveContracts() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.countActiveContractsByFacilityId(1L)).thenReturn(3L);

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(false);

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.updateFacilityStatus(1L, req));
        assertEquals(ErrorCode.FACILITY_HAS_ACTIVE_CONTRACTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-01.2 AC-5: Tái kích hoạt cơ sở sang ACTIVE thành công")
    void shouldActivateFacility_whenTargetStatusIsActive() {
        facility.setStatus(FacilityStatus.INACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(facilityRepository.save(any(Facility.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(true);

        FacilityResponse res = facilityService.updateFacilityStatus(1L, req);
        assertTrue(res.isActive());
    }

    @Test
    @DisplayName("US-BM-01.2: Đổi trạng thái thất bại khi cơ sở không tồn tại")
    void shouldThrowCustomException_whenUpdatingStatusForNonExistentFacility() {
        when(facilityRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(true);

        CustomException ex = assertThrows(CustomException.class, () -> facilityService.updateFacilityStatus(99L, req));
        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }
}
