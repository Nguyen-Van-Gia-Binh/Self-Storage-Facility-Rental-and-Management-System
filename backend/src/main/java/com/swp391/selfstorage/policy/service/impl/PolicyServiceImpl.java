package com.swp391.selfstorage.policy.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.dto.CreatePolicyRequest;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.mapper.PolicyMapper;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.PolicyService;

@Service
@Transactional(readOnly = true)
public class PolicyServiceImpl implements PolicyService {

    private final PolicyVersionRepository policyVersionRepository;
    private final PolicyMapper policyMapper;

    // Constructor Injection: Tiêm phụ thuộc qua constructor (bất biến và dễ kiểm
    // thử)
    public PolicyServiceImpl(PolicyVersionRepository policyVersionRepository, PolicyMapper policyMapper) {
        this.policyVersionRepository = policyVersionRepository;
        this.policyMapper = policyMapper;
    }

    /**
     * 1. Lấy phiên bản chính sách đang có hiệu lực tại thời điểm hiện tại.
     * Quy tắc: effectiveFrom <= now() và sắp xếp giảm dần theo effectiveFrom (lấy
     * bản ghi đầu tiên).
     */
    @Override
    public PolicyResponse getActivePolicy() {
        PolicyVersion activePolicy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(OffsetDateTime.now())
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));

        return policyMapper.toResponse(activePolicy);
    }

    /**
     * 2. Phân trang danh sách tất cả các phiên bản chính sách đã ban hành.
     */
    @Override
    public PageResponse<PolicyResponse> getPolicies(Pageable pageable) {
        Page<PolicyVersion> page = policyVersionRepository.findAll(pageable);
        return PageResponse.from(page.map(policyMapper::toResponse));
    }

    /**
     * 3. Tra cứu chi tiết một phiên bản chính sách theo ID.
     */
    @Override
    public PolicyResponse getPolicyById(Long id) {
        PolicyVersion entity = policyVersionRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));

        return policyMapper.toResponse(entity);
    }

    /**
     * 4. Ban hành phiên bản chính sách mới.
     * Đánh dấu @Transactional (ghi dữ liệu vào CSDL).
     */
    @Override
    @Transactional
    public PolicyResponse createPolicy(CreatePolicyRequest request, Long publishedBy) {
        validatePublishRules(request);
        Integer calculatedVersionNo;

        // Nhánh 1: Nếu người dùng tự chỉ định số phiên bản (versionNo)
        if (request.getVersionNo() != null) {
            // Kiểm tra trùng lặp trong CSDL -> nếu đã có thì chặn ngay với lỗi CONFLICT 409
            if (policyVersionRepository.existsByVersionNo(request.getVersionNo())) {
                throw new CustomException(ErrorCode.POLICY_VERSION_ALREADY_EXISTS);
            }
            calculatedVersionNo = request.getVersionNo();
        } else {
            // Nhánh 2: Nếu người dùng để trống versionNo -> tự động tăng: version lớn nhất
            // + 1 (hoặc bắt đầu từ 1 nếu DB trống)
            calculatedVersionNo = policyVersionRepository.findTopByOrderByVersionNoDesc()
                    .map(p -> p.getVersionNo() + 1)
                    .orElse(1);
        }

        // Chuyển DTO sang Entity kèm theo số version đã tính và ID người ban hành (BOM)
        PolicyVersion entity = policyMapper.toEntity(request, calculatedVersionNo, publishedBy);
        PolicyVersion saved = policyVersionRepository.save(entity);

        // Trả về DTO kết quả
        return policyMapper.toResponse(saved);
    }

    /**
     * BR-GEN-01 và US-BM-02: ngày hiệu lực không ở quá khứ, hệ số cọc lớn hơn 0,
     * mốc nhắc gia hạn phân biệt, và mốc quá hạn đi theo thứ tự.
     */
    private void validatePublishRules(CreatePolicyRequest request) {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate effectiveDate = request.getEffectiveFrom().atZoneSameInstant(zone).toLocalDate();
        if (effectiveDate.isBefore(LocalDate.now(zone))) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày hiệu lực không được ở quá khứ");
        }
        if (request.getDepositMultiplier() == null
                || request.getDepositMultiplier().compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Hệ số cọc phải lớn hơn 0");
        }
        if (request.getRenewalMinMonths() > request.getRenewalMaxMonths()) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Số tháng gia hạn tối thiểu không được lớn hơn số tháng tối đa");
        }
        validateReminderDays(request.getRenewalReminderDays());
        if (!(request.getOverdueGraceDays() < request.getOverdueNoticeDays()
                && request.getOverdueNoticeDays() <= request.getOverdueLockAccessDays()
                && request.getOverdueLockAccessDays() <= request.getOverdueTerminationDays())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Các mốc quá hạn phải theo thứ tự: ân hạn → bắt đầu tính phí → khóa truy cập → chấm dứt");
        }
    }

    private void validateReminderDays(String raw) {
        String[] parts = raw.split(",");
        Set<Integer> seen = new HashSet<>();
        for (String part : parts) {
            String token = part.trim();
            if (token.isEmpty()) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Mốc nhắc gia hạn phải là số nguyên dương");
            }
            int day;
            try {
                day = Integer.parseInt(token);
            } catch (NumberFormatException ex) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED, "Mốc nhắc gia hạn phải là số nguyên dương");
            }
            if (day <= 0 || !seen.add(day)) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Các mốc nhắc gia hạn phải lớn hơn 0 và không được trùng nhau");
            }
        }
    }
}
