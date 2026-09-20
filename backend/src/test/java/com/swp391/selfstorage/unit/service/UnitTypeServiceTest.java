package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.unit.dto.CreateUnitTypeRequest;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.dto.UpdateUnitTypeRequest;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.mapper.UnitMapper;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UnitTypeServiceTest {

    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private FacilityUnitTypePriceRepository priceRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    private final UnitMapper mapper = new UnitMapper();

    private UnitTypeService unitTypeService;
    private UnitType unitType;
    private FacilityUnitTypePrice facilityPrice;

    @BeforeEach
    void setUp() {
        unitTypeService = new UnitTypeServiceImpl(unitTypeRepository, priceRepository, storageUnitRepository, mapper);

        unitType = UnitType.builder()
                .id(7L)
                .code("UT-S")
                .name("Loại S — 3m²")
                .description("Phù hợp đồ cá nhân, vali")
                .widthM(new BigDecimal("1.50"))
                .lengthM(new BigDecimal("2.00"))
                .heightM(new BigDecimal("2.50"))
                .isActive(true)
                .build();

        facilityPrice = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(800000L)
                .build();
    }

    @Test
    @DisplayName("US-FM-01.1 AC-1, US-SC-01.2: Lấy danh sách loại ô kho theo cơ sở kèm giá và tổng số unit")
    void shouldReturnPagedUnitTypesWithPricesAndCount_whenQueriedByFacility() {
        Pageable pageable = PageRequest.of(0, 10);
        when(unitTypeRepository.findByFacilityIdAndFilter(eq(1L), eq(true), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(unitType), pageable, 1));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(facilityPrice));
        when(storageUnitRepository.countByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(10L);

        PageResponse<UnitTypeResponse> response = unitTypeService.getUnitTypesByFacility(1L, true, pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        UnitTypeResponse item = response.getContent().get(0);
        assertEquals(7L, item.getId());
        assertEquals("UT-S", item.getCode());
        assertEquals(800000L, item.getMonthlyPrice());
        assertEquals(10L, item.getTotalUnits());
    }

    @Test
    @DisplayName("US-FM-01.1, US-SC-01.2: Lấy chi tiết loại ô kho theo ID thành công")
    void shouldReturnUnitTypeById_whenFound() {
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(facilityPrice));
        when(storageUnitRepository.countByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(10L);

        UnitTypeResponse res = unitTypeService.getUnitTypeById(1L, 7L);

        assertNotNull(res);
        assertEquals(7L, res.getId());
        assertEquals("UT-S", res.getCode());
        assertEquals(800000L, res.getMonthlyPrice());
        assertEquals(10L, res.getTotalUnits());
    }

    @Test
    @DisplayName("US-FM-01.1: Ném lỗi UNIT_TYPE_NOT_FOUND khi tra cứu ID không tồn tại")
    void shouldThrowCustomException_whenUnitTypeNotFoundById() {
        when(unitTypeRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.getUnitTypeById(1L, 99L));
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.1 AC-2: Tạo loại ô kho mới thành công kèm cấu hình giá cơ sở")
    void shouldCreateUnitTypeWithPrice_whenCodeIsUniqueAndPriceProvided() {
        CreateUnitTypeRequest request = CreateUnitTypeRequest.builder()
                .code("UT-M")
                .name("Loại M — 6m²")
                .widthM(new BigDecimal("2.0"))
                .depthM(new BigDecimal("3.0"))
                .heightM(new BigDecimal("2.5"))
                .monthlyPrice(1500000L)
                .build();

        when(unitTypeRepository.existsByCode("UT-M")).thenReturn(false);
        when(unitTypeRepository.save(any(UnitType.class))).thenAnswer(inv -> {
            UnitType ut = inv.getArgument(0);
            ut.setId(8L);
            return ut;
        });

        UnitTypeResponse res = unitTypeService.createUnitType(1L, request);

        assertNotNull(res);
        assertEquals(8L, res.getId());
        assertEquals("UT-M", res.getCode());
        verify(priceRepository).save(any(FacilityUnitTypePrice.class));
    }

    @Test
    @DisplayName("US-FM-01.1 AC-2: Tạo loại ô kho mới thành công khi không nhập giá tháng")
    void shouldCreateUnitTypeWithoutPrice_whenMonthlyPriceIsNull() {
        CreateUnitTypeRequest request = CreateUnitTypeRequest.builder()
                .code("UT-NO-PRICE")
                .name("Loại Chưa Có Giá")
                .build();

        when(unitTypeRepository.existsByCode("UT-NO-PRICE")).thenReturn(false);
        when(unitTypeRepository.save(any(UnitType.class))).thenAnswer(inv -> {
            UnitType ut = inv.getArgument(0);
            ut.setId(9L);
            return ut;
        });

        UnitTypeResponse res = unitTypeService.createUnitType(1L, request);

        assertNotNull(res);
        assertEquals(9L, res.getId());
        verify(priceRepository, never()).save(any(FacilityUnitTypePrice.class));
    }

    @Test
    @DisplayName("US-FM-01.1: Tạo loại ô kho ném lỗi khi trùng mã định danh")
    void shouldThrowCustomException_whenCreatingUnitTypeWithDuplicateCode() {
        CreateUnitTypeRequest request = CreateUnitTypeRequest.builder()
                .code("UT-S")
                .name("Trùng mã S")
                .build();

        when(unitTypeRepository.existsByCode("UT-S")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.createUnitType(1L, request));
        assertEquals(ErrorCode.UNIT_TYPE_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.1: Cập nhật loại ô kho và cập nhật giá tháng khi đã có bản ghi giá")
    void shouldUpdateUnitTypeAndExistingPrice_whenPriceRecordExists() {
        UpdateUnitTypeRequest request = UpdateUnitTypeRequest.builder()
                .name("Loại S — Sửa tên")
                .widthM(new BigDecimal("1.6"))
                .depthM(new BigDecimal("2.1"))
                .heightM(new BigDecimal("2.6"))
                .monthlyPrice(900000L)
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(unitTypeRepository.save(any(UnitType.class))).thenAnswer(inv -> inv.getArgument(0));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(facilityPrice));
        when(storageUnitRepository.countByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(10L);

        UnitTypeResponse res = unitTypeService.updateUnitType(1L, 7L, request);

        assertNotNull(res);
        assertEquals("Loại S — Sửa tên", res.getName());
        verify(priceRepository).save(facilityPrice);
        assertEquals(900000L, facilityPrice.getMonthlyPrice());
    }

    @Test
    @DisplayName("US-FM-01.1: Cập nhật loại ô kho và tạo mới giá cơ sở khi chưa từng có bản ghi giá")
    void shouldUpdateUnitTypeAndCreateNewPrice_whenPriceRecordDoesNotExist() {
        UpdateUnitTypeRequest request = UpdateUnitTypeRequest.builder()
                .name("Loại S — Thêm giá")
                .monthlyPrice(950000L)
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(unitTypeRepository.save(any(UnitType.class))).thenAnswer(inv -> inv.getArgument(0));
        // Lần đầu tìm không thấy để tạo mới
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(FacilityUnitTypePrice.builder().monthlyPrice(950000L).build()));
        when(storageUnitRepository.countByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(10L);

        UnitTypeResponse res = unitTypeService.updateUnitType(1L, 7L, request);

        assertNotNull(res);
        verify(priceRepository).save(any(FacilityUnitTypePrice.class));
    }

    @Test
    @DisplayName("US-FM-01.1: Cập nhật loại ô kho ném lỗi khi không tìm thấy ID")
    void shouldThrowCustomException_whenUpdatingNonExistentUnitType() {
        UpdateUnitTypeRequest request = UpdateUnitTypeRequest.builder().name("Sửa").build();
        when(unitTypeRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.updateUnitType(1L, 99L, request));
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.1: Vô hiệu hóa loại ô kho thành công khi không có ô kho đang active hoặc reserved")
    void shouldDeactivateUnitType_whenNoActiveOrReservedUnitsExist() {
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.countByUnitTypeIdAndStatusIn(eq(7L), anyCollection())).thenReturn(0L);

        unitTypeService.deactivateUnitType(1L, 7L);

        assertFalse(unitType.isActive());
        verify(unitTypeRepository).save(unitType);
    }

    @Test
    @DisplayName("US-FM-01.1 AC-3: Vô hiệu hóa thất bại khi đang có ô kho active hoặc reserved")
    void shouldThrowCustomException_whenDeactivatingUnitTypeWithActiveOrReservedUnits() {
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.countByUnitTypeIdAndStatusIn(eq(7L), anyCollection())).thenReturn(2L);

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.deactivateUnitType(1L, 7L));
        assertEquals(ErrorCode.UNIT_TYPE_HAS_ACTIVE_UNITS, ex.getErrorCode());
    }
}
