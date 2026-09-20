package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import com.swp391.selfstorage.policy.mapper.SurchargeMapper;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.service.impl.SurchargeServiceImpl;
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
class SurchargeServiceTest {

    @Mock
    private ExtraFeeTypeRepository extraFeeTypeRepository;

    private final SurchargeMapper surchargeMapper = new SurchargeMapper();

    private SurchargeService surchargeService;

    @BeforeEach
    void setUp() {
        surchargeService = new SurchargeServiceImpl(extraFeeTypeRepository, surchargeMapper);
    }

    @Test
    @DisplayName("Tạo phụ phí mới thành công khi mã chưa tồn tại")
    void testCreateSurchargeSuccess() {
        // 1. Arrange (Chuẩn bị dữ liệu)
        CreateSurchargeRequest request = CreateSurchargeRequest.builder()
                .code("FEE_CARD")
                .name("Phí cấp lại thẻ từ")
                .amount(50000L)
                .build();

        when(extraFeeTypeRepository.existsByCode("FEE_CARD")).thenReturn(false);
        when(extraFeeTypeRepository.save(any(ExtraFeeType.class))).thenAnswer(invocation -> {
            ExtraFeeType entity = invocation.getArgument(0);
            entity.setId(1L);
            return entity;
        });

        // 2. Act (Hành động)
        SurchargeResponse response = surchargeService.createSurcharge(request);

        // 3. Assert (Kiểm chứng kết quả)
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("FEE_CARD", response.getCode());
        assertEquals(50000L, response.getAmount());
        assertTrue(response.getIsActive());
        verify(extraFeeTypeRepository, times(1)).save(any(ExtraFeeType.class));
    }

    @Test
    @DisplayName("Ném lỗi CONFLICT khi tạo phụ phí trùng mã đã có")
    void testCreateSurchargeDuplicateCodeThrowsConflict() {
        CreateSurchargeRequest request = CreateSurchargeRequest.builder()
                .code("FEE_CARD")
                .name("Phí cấp lại thẻ từ")
                .amount(50000L)
                .build();

        when(extraFeeTypeRepository.existsByCode("FEE_CARD")).thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> {
            surchargeService.createSurcharge(request);
        });

        assertEquals(ErrorCode.SURCHARGE_CODE_ALREADY_EXISTS, exception.getErrorCode());
        verify(extraFeeTypeRepository, never()).save(any(ExtraFeeType.class));
    }

    @Test
    @DisplayName("Ném lỗi NOT_FOUND khi cập nhật phụ phí với ID không tồn tại")
    void testUpdateSurchargeNotFoundThrowsException() {
        UpdateSurchargeRequest request = UpdateSurchargeRequest.builder()
                .name("Tên mới")
                .amount(60000L)
                .isActive(true)
                .build();

        when(extraFeeTypeRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> {
            surchargeService.updateSurcharge(999L, request);
        });

        assertEquals(ErrorCode.SURCHARGE_NOT_FOUND, exception.getErrorCode());
    }
}
