package com.swp391.selfstorage.user.service.impl;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.dto.AuditLogFilterRequest;
import com.swp391.selfstorage.user.dto.AuditLogResponse;
import com.swp391.selfstorage.user.dto.LoginHistoryFilterRequest;
import com.swp391.selfstorage.user.dto.LoginHistoryResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.AuditLog;
import com.swp391.selfstorage.user.entity.LoginHistory;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.repository.AuditLogRepository;
import com.swp391.selfstorage.user.repository.LoginHistoryRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.user.service.AuditLogService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CSV_DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssXXX");
    private static final Pattern SENSITIVE_DATA_PATTERN = Pattern.compile("(?i)(password|passwordHash|accessCode|token)[\"']?\\s*[:=]\\s*[\"']?([^,\"'}\\s]+)", Pattern.CASE_INSENSITIVE);

    private final LoginHistoryRepository loginHistoryRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLogin(Long userId, String email, String ipAddress, String userAgent, boolean isSuccess, String failureReason) {
        try {
            LoginHistory history = LoginHistory.builder()
                    .userId(userId)
                    .email(email != null ? email.trim().toLowerCase() : null)
                    .ipAddress(cleanString(ipAddress, 64))
                    .userAgent(cleanString(userAgent, 255))
                    .success(isSuccess)
                    .failureReason(cleanString(failureReason, 255))
                    .loggedInAt(OffsetDateTime.now(VN_ZONE))
                    .build();

            loginHistoryRepository.save(history);
            log.info("Recorded login attempt: email={}, success={}, ip={}", email, isSuccess, ipAddress);
        } catch (Exception e) {
            log.warn("Failed to record login history for email={}: {}", email, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<LoginHistoryResponse> getLoginHistories(LoginHistoryFilterRequest filter, Pageable pageable) {
        Specification<LoginHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
                    predicates.add(cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().trim().toLowerCase() + "%"));
                }
                if (filter.getIsSuccess() != null) {
                    predicates.add(cb.equal(root.get("success"), filter.getIsSuccess()));
                }
                if (filter.getFrom() != null) {
                    OffsetDateTime fromDateTime = filter.getFrom().atStartOfDay(VN_ZONE).toOffsetDateTime();
                    predicates.add(cb.greaterThanOrEqualTo(root.get("loggedInAt"), fromDateTime));
                }
                if (filter.getTo() != null) {
                    OffsetDateTime toDateTime = filter.getTo().plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();
                    predicates.add(cb.lessThan(root.get("loggedInAt"), toDateTime));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<LoginHistory> page = loginHistoryRepository.findAll(spec, pageable);

        List<LoginHistoryResponse> content = page.getContent().stream().map(h -> LoginHistoryResponse.builder()
                .id(h.getId())
                .userId(h.getUserId())
                .email(h.getEmail())
                .loggedInAt(h.getLoggedInAt())
                .ipAddress(h.getIpAddress())
                .userAgent(h.getUserAgent())
                .isSuccess(h.isSuccess())
                .failureReason(h.getFailureReason())
                .build()
        ).toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(Long userId, String action, String entityType, Long entityId, String beforeValue, String afterValue) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .action(cleanString(action, 100))
                    .entityType(cleanString(entityType, 100))
                    .entityId(entityId != null ? entityId : 0L)
                    .beforeValue(sanitizeSensitiveData(beforeValue))
                    .afterValue(sanitizeSensitiveData(afterValue))
                    .createdAt(OffsetDateTime.now(VN_ZONE))
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Recorded audit log: action={}, entityType={}, entityId={}, userId={}",
                    action, entityType, entityId, userId);
        } catch (Exception e) {
            log.warn("Failed to record audit log: action={}, entityId={}: {}", action, entityId, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(AuditLogFilterRequest filter, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter != null) {
                if (filter.getUserId() != null) {
                    predicates.add(cb.equal(root.get("userId"), filter.getUserId()));
                }
                if (filter.getAction() != null && !filter.getAction().isBlank()) {
                    predicates.add(cb.equal(root.get("action"), filter.getAction().trim()));
                }
                if (filter.getEntityType() != null && !filter.getEntityType().isBlank()) {
                    predicates.add(cb.equal(root.get("entityType"), filter.getEntityType().trim()));
                }
                if (filter.getFrom() != null) {
                    OffsetDateTime fromDateTime = filter.getFrom().atStartOfDay(VN_ZONE).toOffsetDateTime();
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDateTime));
                }
                if (filter.getTo() != null) {
                    OffsetDateTime toDateTime = filter.getTo().plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();
                    predicates.add(cb.lessThan(root.get("createdAt"), toDateTime));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);

        Set<Long> userIds = page.getContent().stream()
                .map(AuditLog::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, AppUser> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream().collect(Collectors.toMap(AppUser::getId, u -> u, (u1, u2) -> u1));

        List<AuditLogResponse> content = page.getContent().stream().map(logItem -> {
            AppUser actor = logItem.getUserId() != null ? userMap.get(logItem.getUserId()) : null;
            return AuditLogResponse.builder()
                    .id(logItem.getId())
                    .userId(logItem.getUserId())
                    .userEmail(actor != null ? actor.getEmail() : null)
                    .userFullName(actor != null ? actor.getFullName() : (logItem.getUserId() == null ? "Hệ thống" : "N/A"))
                    .action(logItem.getAction())
                    .entityType(logItem.getEntityType())
                    .entityId(logItem.getEntityId())
                    .beforeValue(logItem.getBeforeValue())
                    .afterValue(logItem.getAfterValue())
                    .createdAt(logItem.getCreatedAt())
                    .build();
        }).toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getUserActivityLogs(Long targetUserId, AuditLogFilterRequest filter, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Yêu cầu đăng nhập");
        }

        boolean isAdmin = currentUser.getRole() == UserRole.SYSTEM_ADMINISTRATOR;
        boolean isSelf = currentUser.getId() != null && currentUser.getId().equals(targetUserId);

        if (!isAdmin && !isSelf) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Không có quyền xem nhật ký hoạt động của tài khoản khác");
        }

        AuditLogFilterRequest effectiveFilter = filter != null ? filter : new AuditLogFilterRequest();
        effectiveFilter.setUserId(targetUserId);

        return getAuditLogs(effectiveFilter, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAuditLogsCsv(AuditLogFilterRequest filter) {
        Pageable unpaged = PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AuditLogResponse> page = getAuditLogs(filter, unpaged);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {
            // Write UTF-8 BOM so Excel opens Vietnamese properly
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);

            // Header line
            writer.println("ID,Thời điểm (Asia/Ho_Chi_Minh),Mã người dùng,Email,Họ và tên,Hành động,Đối tượng,Mã đối tượng,Giá trị trước,Giá trị sau");

            for (AuditLogResponse item : page.getContent()) {
                String timeStr = item.getCreatedAt() != null ? item.getCreatedAt().format(CSV_DATETIME_FORMATTER) : "";
                writer.println(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s",
                        escapeCsv(item.getId() != null ? item.getId().toString() : ""),
                        escapeCsv(timeStr),
                        escapeCsv(item.getUserId() != null ? item.getUserId().toString() : ""),
                        escapeCsv(item.getUserEmail() != null ? item.getUserEmail() : ""),
                        escapeCsv(item.getUserFullName() != null ? item.getUserFullName() : ""),
                        escapeCsv(item.getAction() != null ? item.getAction() : ""),
                        escapeCsv(item.getEntityType() != null ? item.getEntityType() : ""),
                        escapeCsv(item.getEntityId() != null ? item.getEntityId().toString() : ""),
                        escapeCsv(sanitizeSensitiveData(item.getBeforeValue())),
                        escapeCsv(sanitizeSensitiveData(item.getAfterValue()))
                ));
            }
            writer.flush();
        } catch (Exception e) {
            log.error("Error generating CSV export for audit logs: {}", e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private String cleanString(String input, int maxLength) {
        if (input == null) return null;
        String trimmed = input.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    private String sanitizeSensitiveData(String data) {
        if (data == null) return null;
        return SENSITIVE_DATA_PATTERN.matcher(data).replaceAll("$1=\"***\"");
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
