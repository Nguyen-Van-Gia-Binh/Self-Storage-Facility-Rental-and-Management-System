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

    @BeforeEach
    void setUp() {
        unitTypeService = new UnitTypeServiceImpl(unitTypeRepository, priceRepository, storageUnitRepository, mapper);
    }

    @Test
    @DisplayName("Tạo UnitType mới thành công kèm giá cơ sở")
    void testCreateUnitTypeSuccess() {
        CreateUnitTypeRequest request = CreateUnitTypeRequest.builder()
                .code("UT-S")
                .name("Loại S — 3m²")
                .widthM(new BigDecimal("1.5"))
                .depthM(new BigDecimal("2.0"))
                .heightM(new BigDecimal("2.5"))
                .monthlyPrice(800000L)
                .build();

        when(unitTypeRepository.existsByCode("UT-S")).thenReturn(false);
        when(unitTypeRepository.save(any(UnitType.class))).thenAnswer(inv -> {
            UnitType ut = inv.getArgument(0);
            ut.setId(7L);
            return ut;
        });

        UnitTypeResponse res = unitTypeService.createUnitType(1L, request);

        assertNotNull(res);
        assertEquals(7L, res.getId());
        assertEquals("UT-S", res.getCode());
        verify(priceRepository).save(any(FacilityUnitTypePrice.class));
    }

    @Test
    @DisplayName("Tạo UnitType ném lỗi khi trùng code")
    void testCreateUnitTypeDuplicateCode() {
        CreateUnitTypeRequest request = CreateUnitTypeRequest.builder()
                .code("UT-EXIST")
                .name("Trùng mã")
                .build();

        when(unitTypeRepository.existsByCode("UT-EXIST")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.createUnitType(1L, request));
        assertEquals(ErrorCode.UNIT_TYPE_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Vô hiệu hóa UnitType thất bại khi có ô kho đang active/reserved")
    void testDeactivateUnitTypeConflict() {
        UnitType ut = UnitType.builder().id(7L).isActive(true).build();
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(ut));
        when(storageUnitRepository.countByUnitTypeIdAndStatusIn(eq(7L), anyCollection())).thenReturn(2L);

        CustomException ex = assertThrows(CustomException.class, () -> unitTypeService.deactivateUnitType(1L, 7L));
        assertEquals(ErrorCode.UNIT_TYPE_HAS_ACTIVE_UNITS, ex.getErrorCode());
    }
}
