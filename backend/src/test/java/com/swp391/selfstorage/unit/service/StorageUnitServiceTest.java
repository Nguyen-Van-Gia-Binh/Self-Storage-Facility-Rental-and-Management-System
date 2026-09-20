package com.swp391.selfstorage.unit.service;

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

    @BeforeEach
    void setUp() {
        storageUnitService = new StorageUnitServiceImpl(storageUnitRepository, unitTypeRepository, mapper);
    }

    @Test
    @DisplayName("Thêm mới ô kho đơn lẻ thành công")
    void testCreateStorageUnitSuccess() {
        CreateStorageUnitRequest req = CreateStorageUnitRequest.builder()
                .unitTypeId(7L)
                .code("S-101")
                .floor(1)
                .position("A1")
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(UnitType.builder().id(7L).name("Loại S").build()));
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
    @DisplayName("Thêm ô kho trùng code trong cùng cơ sở ném lỗi")
    void testCreateDuplicateCodeThrowsException() {
        CreateStorageUnitRequest req = CreateStorageUnitRequest.builder()
                .unitTypeId(7L)
                .code("S-101")
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(UnitType.builder().id(7L).build()));
        when(storageUnitRepository.existsByFacilityIdAndCode(1L, "S-101")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.createStorageUnit(1L, req));
        assertEquals(ErrorCode.STORAGE_UNIT_CODE_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo hàng loạt ô kho sinh đúng số lượng (AC-2)")
    void testBatchCreateStorageUnits() {
        BatchCreateStorageUnitsRequest req = BatchCreateStorageUnitsRequest.builder()
                .unitTypeId(7L)
                .prefix("CG-B")
                .floor(2)
                .position("Dãy B")
                .startNumber(201)
                .endNumber(205)
                .build();

        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(UnitType.builder().id(7L).name("Loại M").build()));
        when(storageUnitRepository.existsByFacilityIdAndCode(eq(1L), anyString())).thenReturn(false);
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        List<StorageUnitResponse> responses = storageUnitService.batchCreateStorageUnits(1L, req);

        assertEquals(5, responses.size());
        assertEquals("CG-B201", responses.get(0).getCode());
        assertEquals("CG-B205", responses.get(4).getCode());
    }

    @Test
    @DisplayName("Cập nhật trạng thái ô kho sang MAINTENANCE thành công")
    void testUpdateStatusSuccess() {
        StorageUnit su = StorageUnit.builder()
                .id(42L)
                .facilityId(1L)
                .unitTypeId(7L)
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(su));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(UnitType.builder().name("Loại S").build()));
        when(storageUnitRepository.save(any(StorageUnit.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.MAINTENANCE)
                .reason("Sửa khóa cửa")
                .build();

        StorageUnitResponse res = storageUnitService.updateStorageUnitStatus(1L, 42L, req);
        assertEquals(StorageUnitStatus.MAINTENANCE, res.getStatus());
    }

    @Test
    @DisplayName("Không được tự ý đổi trạng thái ô kho đang OCCUPIED trực tiếp")
    void testUpdateOccupiedThrowsException() {
        StorageUnit su = StorageUnit.builder()
                .id(42L)
                .facilityId(1L)
                .status(StorageUnitStatus.OCCUPIED)
                .build();

        when(storageUnitRepository.findByIdAndFacilityId(42L, 1L)).thenReturn(Optional.of(su));

        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        CustomException ex = assertThrows(CustomException.class, () -> storageUnitService.updateStorageUnitStatus(1L, 42L, req));
        assertEquals(ErrorCode.STORAGE_UNIT_OCCUPIED, ex.getErrorCode());
    }
}
