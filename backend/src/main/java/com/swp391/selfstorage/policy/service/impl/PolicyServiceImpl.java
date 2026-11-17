package com.swp391.selfstorage.policy.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class PolicyServiceImpl implements PolicyService {

    private final PolicyVersionRepository policyVersionRepository;
    private final PolicyMapper policyMapper;
    private final UserRepository userRepository;

    @Autowired
    public PolicyServiceImpl(
            PolicyVersionRepository policyVersionRepository,
            PolicyMapper policyMapper,
            UserRepository userRepository) {
        this.policyVersionRepository = policyVersionRepository;
        this.policyMapper = policyMapper;
        this.userRepository = userRepository;
    }

    public PolicyServiceImpl(PolicyVersionRepository policyVersionRepository, PolicyMapper policyMapper) {
        this(policyVersionRepository, policyMapper, null);
    }

    /**
     * 1. Lấy phiên bản chính sách đang có hiệu lực tại thời điểm hiện tại.
     * Quy tắc: effectiveFrom <= now() và sắp xếp giảm dần theo effectiveFrom (lấy
     * bản ghi đầu tiên).
     */
    @Override
    public PolicyResponse getActivePolicy() {
        PolicyVersion activePolicy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));

        return enrichPublisherName(policyMapper.toResponse(activePolicy));
    }

    /**
     * 2. Phân trang danh sách tất cả các phiên bản chính sách đã ban hành.
     */
    @Override
    public PageResponse<PolicyResponse> getPolicies(Pageable pageable) {
        Page<PolicyResponse> mapped = policyVersionRepository.findAll(pageable)
                .map(policyMapper::toResponse);
        enrichPublisherNames(mapped.getContent());
        return PageResponse.from(mapped);
    }

    /**
     * 3. Tra cứu chi tiết một phiên bản chính sách theo ID.
     */
    @Override
    public PolicyResponse getPolicyById(Long id) {
        PolicyVersion entity = policyVersionRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));

        return enrichPublisherName(policyMapper.toResponse(entity));
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
        return enrichPublisherName(policyMapper.toResponse(saved));
    }

    private PolicyResponse enrichPublisherName(PolicyResponse response) {
        if (response == null || response.getPublishedBy() == null || userRepository == null) {
            return response;
        }
        userRepository.findById(response.getPublishedBy())
                .map(AppUser::getFullName)
                .filter(name -> name != null && !name.isBlank())
                .ifPresent(response::setPublishedByName);
        return response;
    }

    private void enrichPublisherNames(List<PolicyResponse> responses) {
        if (responses == null || responses.isEmpty() || userRepository == null) {
            return;
        }
        Set<Long> publisherIds = responses.stream()
                .map(PolicyResponse::getPublishedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (publisherIds.isEmpty()) {
            return;
        }
        Map<Long, String> namesById = new HashMap<>();
        for (AppUser user : userRepository.findAllById(publisherIds)) {
            if (user.getId() != null && user.getFullName() != null && !user.getFullName().isBlank()) {
                namesById.put(user.getId(), user.getFullName());
            }
        }
        for (PolicyResponse item : responses) {
            if (item.getPublishedBy() != null) {
                item.setPublishedByName(namesById.get(item.getPublishedBy()));
            }
        }
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
        Integer grace = request.getOverdueGraceDays();
        Integer lock = request.getOverdueLockAccessDays();
        Integer termination = request.getOverdueTerminationDays();
        if (grace == null || lock == null || termination == null || !(grace < termination && lock >= 1 && lock <= termination)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Giai đoạn 1 phải nhỏ hơn ngày chấm dứt, và mốc khóa truy cập phải nằm trong khoảng từ ngày 1 đến ngày chấm dứt");
        }
        request.setOverdueNoticeDays(grace + 1);
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
            if (day <= 20) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Mốc nhắc gia hạn phải lớn hơn 20 ngày vì từ mốc đó cổng tự gia hạn đã khóa");
            }
        }
    }
}
