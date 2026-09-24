package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.unit.dto.BatchCreateStorageUnitsRequest;
import com.swp391.selfstorage.unit.dto.CreateStorageUnitRequest;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UpdateStorageUnitStatusRequest;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.mapper.UnitMapper;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageUnitServiceTest {

    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    private final UnitMapper mapper = new UnitMapper();

    private StorageUnitService storageUnitService;
    private StorageUnit storageUnit;
    private UnitType unitType;

    @BeforeEach
    void setUp() {
        storageUnitService = new StorageUnitServiceImpl(storageUnitRepository, unitTypeRepository, mapper);

        unitType = UnitType.builder()
                .id(7L)
                .name("Loại S")
                .build();

        storageUnit = StorageUnit.builder()
                .id(42L)
                .facilityId(1L)
                .unitTypeId(7L)
                .code("S-101")
                .floor(1)
                .position("A1")
                .status(StorageUnitStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("US-FM-01.2 AC-1: Lấy danh sách ô kho có phân trang và lọc theo cơ sở, loại ô kho, trạng thái")
    void shouldReturnPagedStorageUnits_whenFilteredByFacilityAndStatus() {
        Pageable pageable = PageRequest.of(0, 10);
        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(7L), eq(StorageUnitStatus.AVAILABLE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(storageUnit), pageable, 1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));

        PageResponse<StorageUnitResponse> response = storageUnitService.getStorageUnitsByFacility(1L, 7L, StorageUnitStatus.AVAILABLE, pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        StorageUnitResponse item = response.getContent().get(0);
        assertEquals(42L, item.getId());
        assertEquals("S-101", item.getCode());
        assertEquals("Loại S", item.getUnitTypeName());
        assertEquals(StorageUnitStatus.AVAILABLE, item.getStatus());
    }

    @Test
    @DisplayName("US-FM-01.2: Lấy danh sách ô kho lọc nâng cao theo Tầng (floor) và Khu vực (position)")
    void shouldReturnPagedStorageUnits_whenFilteredByFloorAndPosition() {
        Pageable pageable = PageRequest.of(0, 10);
        when(storageUnitRepository.findByFacilityIdAndAdvancedFilters(eq(1L), eq(7L), eq(StorageUnitStatus.AVAILABLE), eq(1), eq("Khu A"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(storageUnit), pageable, 1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));

        PageResponse<StorageUnitResponse> response = storageUnitService.getStorageUnitsByFacility(1L, 7L, StorageUnitStatus.AVAILABLE, 1, "Khu A", pageable);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        StorageUnitResponse item = response.getContent().get(0);
        assertEquals(42L, item.getId());
        assertEquals("S-101", item.getCode());
        assertEquals(1, item.getFloor());
        assertEquals("A1", item.getPosition());
    }

    @Test
    @DisplayName("US-FM-01.2: Lấy chi tiết ô kho theo ID và Facility ID thành công")
    void shouldReturnStorageUnit_whenFoundByIdAndFacility() {
        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));

        StorageUnitResponse res = storageUnitService.getStorageUnitById(1L, 42L);

        assertNotNull(res);
        assertEquals(42L, res.getId());
        assertEquals("S-101", res.getCode());
        assertEquals("Loại S", res.getUnitTypeName());
    }

    @Test
    @DisplayName("US-FM-01.2: Ném lỗi STORAGE_UNIT_NOT_FOUND khi tra cứu ID không tồn tại trong cơ sở")
    void shouldThrowCustomException_whenStorageUnitNotFoundByIdAndFacility() {
        when(storageUnitRepository.findByIdAndFacilityId(99L, 1L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.getStorageUnitById(1L, 99L));
        assertEquals(ErrorCode.STORAGE_UNIT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2: Thêm mới ô kho đơn lẻ thành công")
    void shouldCreateStorageUnit_whenUnitTypeExistsAndCodeUnique() {
        CreateStorageUnitRequest req = CreateStorageUnitRequest.builder()
                .unitTypeId(7L)
                .code("S-101")
                .floor(1)
                .position("A1")
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.existsByFacilityIdAndCode(1L, "S-101")).thenReturn(false);
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> {
            StorageUnit su = inv.getArgument(0);
            su.setId(42L);
            return su;
        });

        StorageUnitResponse res = storageUnitService.createStorageUnit(1L, req);

        assertNotNull(res);
        assertEquals("S-101", res.getCode());
        assertEquals(StorageUnitStatus.AVAILABLE, res.getStatus());
    }

    @Test
    @DisplayName("US-FM-01.2: Thêm mới ô kho đơn lẻ thất bại khi UnitType không tồn tại")
    void shouldThrowCustomException_whenCreatingStorageUnitWithNonExistentUnitType() {
        CreateStorageUnitRequest req = CreateStorageUnitRequest.builder()
                .unitTypeId(99L)
                .code("S-999")
                .build();

        when(unitTypeRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.createStorageUnit(1L, req));
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2 AC-3: Thêm ô kho trùng mã trong cùng cơ sở ném lỗi STORAGE_UNIT_CODE_ALREADY_EXISTS")
    void shouldThrowCustomException_whenCreatingStorageUnitWithDuplicateCode() {
        CreateStorageUnitRequest req = CreateStorageUnitRequest.builder()
                .unitTypeId(7L)
                .code("S-101")
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.existsByFacilityIdAndCode(1L, "S-101")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.createStorageUnit(1L, req));
        assertEquals(ErrorCode.STORAGE_UNIT_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2 AC-2: Tạo hàng loạt ô kho sinh đúng số lượng ở trạng thái AVAILABLE")
    void shouldBatchCreateStorageUnits_whenValidRangeAndPrefix() {
        BatchCreateStorageUnitsRequest req = BatchCreateStorageUnitsRequest.builder()
                .unitTypeId(7L)
                .prefix("CG-B")
                .floor(2)
                .position("Dãy B")
                .startNumber(201)
                .endNumber(205)
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.existsByFacilityIdAndCode(eq(1L), anyString())).thenReturn(false);
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        List<StorageUnitResponse> responses = storageUnitService.batchCreateStorageUnits(1L, req);

        assertEquals(5, responses.size());
        assertEquals("CG-B201", responses.get(0).getCode());
        assertEquals("CG-B205", responses.get(4).getCode());
    }

    @Test
    @DisplayName("US-FM-01.2: Tạo hàng loạt ô kho thất bại khi UnitType không tồn tại")
    void shouldThrowCustomException_whenBatchCreateWithNonExistentUnitType() {
        BatchCreateStorageUnitsRequest req = BatchCreateStorageUnitsRequest.builder()
                .unitTypeId(99L)
                .prefix("CG-B")
                .startNumber(1)
                .endNumber(5)
                .build();

        when(unitTypeRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.batchCreateStorageUnits(1L, req));
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2 AC-3: Tạo hàng loạt ném lỗi khi có mã ô kho bị trùng lặp")
    void shouldThrowCustomException_whenBatchCreateEncountersDuplicateCode() {
        BatchCreateStorageUnitsRequest req = BatchCreateStorageUnitsRequest.builder()
                .unitTypeId(7L)
                .prefix("CG-B")
                .startNumber(201)
                .endNumber(205)
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.existsByFacilityIdAndCode(1L, "CG-B201")).thenReturn(false);
        when(storageUnitRepository.existsByFacilityIdAndCode(1L, "CG-B202")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.batchCreateStorageUnits(1L, req));
        assertEquals(ErrorCode.STORAGE_UNIT_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2, FS-03: Cập nhật trạng thái ô kho sang MAINTENANCE thành công")
    void shouldUpdateStorageUnitStatus_whenTransitionIsValid() {
        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.MAINTENANCE)
                .reason("Sửa khóa cửa")
                .build();

        StorageUnitResponse res = storageUnitService.updateStorageUnitStatus(1L, 42L, req);
        assertEquals(StorageUnitStatus.MAINTENANCE, res.getStatus());
    }

    @Test
    @DisplayName("US-FM-01.2, FS-03: Cập nhật trạng thái ô kho giữ nguyên trạng thái hiện tại (idempotent)")
    void shouldUpdateStorageUnitStatus_whenTransitionIsSameStatus() {
        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        StorageUnitResponse res = storageUnitService.updateStorageUnitStatus(1L, 42L, req);
        assertEquals(StorageUnitStatus.AVAILABLE, res.getStatus());
    }

    @Test
    @DisplayName("US-FM-01.2 AC-4: Không được tự ý đổi trạng thái ô kho đang OCCUPIED trực tiếp")
    void shouldThrowCustomException_whenUpdatingStatusForOccupiedStorageUnit() {
        StorageUnit occupiedUnit = StorageUnit.builder()
                .id(42L)
                .facilityId(1L)
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(occupiedUnit));

        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.updateStorageUnitStatus(1L, 42L, req));
        assertEquals(ErrorCode.STORAGE_UNIT_OCCUPIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-01.2, FS-03: Ném lỗi INVALID_STATUS_TRANSITION khi bước chuyển trạng thái vi phạm State Machine")
    void shouldThrowCustomException_whenStatusTransitionIsInvalid() {
        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(storageUnit));

        // AVAILABLE không thể trực tiếp chuyển sang OCCUPIED mà phải qua RESERVED
        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.updateStorageUnitStatus(1L, 42L, req));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
    }
}
