package com.swp391.selfstorage.policy.service.impl;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.PriceAuditActorResponse;
import com.swp391.selfstorage.policy.dto.PriceAuditEntryResponse;
import com.swp391.selfstorage.policy.dto.PriceAuditFieldResponse;
import com.swp391.selfstorage.policy.dto.PriceAuditPageResponse;
import com.swp391.selfstorage.policy.entity.ExtraFeeVersion;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.ExtraFeeVersionRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceInfo;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.policy.service.PriceAuditService;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;

@Service
@Transactional(readOnly = true)
public class PriceAuditServiceImpl implements PriceAuditService {

    static final String CATEGORY_RENT = "RENT";
    static final String CATEGORY_SURCHARGE = "SURCHARGE";
    static final String CATEGORY_POLICY = "POLICY";
    private static final String UNKNOWN_ACTOR = "Không rõ";

    private final FacilityUnitTypePriceVersionRepository priceVersionRepository;
    private final ExtraFeeVersionRepository extraFeeVersionRepository;
    private final PolicyVersionRepository policyVersionRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final UserRepository userRepository;
    private final AppliedPriceLookup appliedPriceLookup;

    public PriceAuditServiceImpl(
            FacilityUnitTypePriceVersionRepository priceVersionRepository,
            ExtraFeeVersionRepository extraFeeVersionRepository,
            PolicyVersionRepository policyVersionRepository,
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository,
            UserRepository userRepository,
            AppliedPriceLookup appliedPriceLookup) {
        this.priceVersionRepository = priceVersionRepository;
        this.extraFeeVersionRepository = extraFeeVersionRepository;
        this.policyVersionRepository = policyVersionRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.userRepository = userRepository;
        this.appliedPriceLookup = appliedPriceLookup;
    }

    @Override
    public PriceAuditPageResponse search(
            String category,
            Long facilityId,
            LocalDate from,
            LocalDate to,
            Long actorId,
            int page,
            int size) {
        String normalizedCategory = normalizeCategory(category);
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 100);

        List<PriceAuditEntryResponse> entries = new ArrayList<>();
        if (normalizedCategory == null || CATEGORY_RENT.equals(normalizedCategory)) {
            entries.addAll(rentEntries());
        }
        if (normalizedCategory == null || CATEGORY_SURCHARGE.equals(normalizedCategory)) {
            entries.addAll(surchargeEntries());
        }
        if (normalizedCategory == null || CATEGORY_POLICY.equals(normalizedCategory)) {
            entries.addAll(policyEntries());
        }

        fillNames(entries);

        List<PriceAuditEntryResponse> scoped = entries.stream()
                .filter(entry -> matchesFacility(entry, facilityId))
                .filter(entry -> withinRecordedRange(entry.getRecordedAt(), from, to))
                .toList();

        List<PriceAuditActorResponse> actors = scoped.stream()
                .filter(entry -> entry.getActorId() != null)
                .collect(Collectors.toMap(
                        PriceAuditEntryResponse::getActorId,
                        entry -> PriceAuditActorResponse.builder()
                                .id(entry.getActorId())
                                .name(entry.getActorName())
                                .build(),
                        (left, right) -> left))
                .values().stream()
                .sorted(Comparator.comparing(PriceAuditActorResponse::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        List<PriceAuditEntryResponse> filtered = scoped.stream()
                .filter(entry -> actorId == null || actorId.equals(entry.getActorId()))
                .sorted(this::newestFirst)
                .toList();

        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil(filtered.size() / (double) safeSize);

        return PriceAuditPageResponse.builder()
                .content(filtered.subList(fromIndex, toIndex))
                .page(safePage)
                .size(safeSize)
                .totalElements(filtered.size())
                .totalPages(totalPages)
                .actors(actors)
                .build();
    }

    private List<PriceAuditEntryResponse> rentEntries() {
        List<FacilityUnitTypePriceVersion> versions = priceVersionRepository.findAll();
        Map<String, List<FacilityUnitTypePriceVersion>> groups = new HashMap<>();
        for (FacilityUnitTypePriceVersion version : versions) {
            String key = version.getFacilityId() + ":" + version.getUnitTypeId();
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(version);
        }
        LocalDate today = AppliedPriceLookup.todayVn();
        List<PriceAuditEntryResponse> entries = new ArrayList<>();
        for (List<FacilityUnitTypePriceVersion> group : groups.values()) {
            group.sort((left, right) -> compareRecorded(
                    left.getCreatedAt(), left.getId(), right.getCreatedAt(), right.getId()));
            FacilityUnitTypePriceVersion previous = null;
            for (FacilityUnitTypePriceVersion version : group) {
                String oldPerM2 = previous == null ? null : money(previous.getPricePerM2()) + " đ/m²";
                String newPerM2 = money(version.getPricePerM2()) + " đ/m²";
                String oldMonthly = previous == null ? null : money(previous.getMonthlyPrice()) + " đ";
                String newMonthly = money(version.getMonthlyPrice()) + " đ";
                List<PriceAuditFieldResponse> changes = List.of(
                        field("pricePerM2", "Đơn giá m²", oldPerM2, newPerM2),
                        field("monthlyPrice", "Giá thuê tháng", oldMonthly, newMonthly));
                entries.add(PriceAuditEntryResponse.builder()
                        .id(CATEGORY_RENT + "-" + version.getId())
                        .category(CATEGORY_RENT)
                        .recordedAt(version.getCreatedAt())
                        .actorId(version.getCreatedBy())
                        .subject("")
                        .facilityId(version.getFacilityId())
                        .changeSummary(arrow("Đơn giá", oldPerM2, newPerM2)
                                + " · " + arrow("Giá thuê tháng", oldMonthly, newMonthly))
                        .changes(changes)
                        .snapshot(changes)
                        .effectiveFrom(version.getEffectiveFrom())
                        .status(appliedPriceLookup.versionStatus(version, today))
                        .build());
                previous = version;
            }
        }
        return entries;
    }

    private List<PriceAuditEntryResponse> surchargeEntries() {
        List<ExtraFeeVersion> versions = extraFeeVersionRepository.findAll();
        Map<Long, List<ExtraFeeVersion>> groups = new HashMap<>();
        for (ExtraFeeVersion version : versions) {
            groups.computeIfAbsent(version.getExtraFeeTypeId(), ignored -> new ArrayList<>()).add(version);
        }
        List<PriceAuditEntryResponse> entries = new ArrayList<>();
        for (List<ExtraFeeVersion> group : groups.values()) {
            group.sort((left, right) -> compareRecorded(
                    left.getCreatedAt(), left.getId(), right.getCreatedAt(), right.getId()));
            ExtraFeeVersion applied = pickApplied(group, ExtraFeeVersion::getEffectiveFrom, ExtraFeeVersion::getId);
            ExtraFeeVersion previous = null;
            for (ExtraFeeVersion version : group) {
                List<PriceAuditFieldResponse> changes = new ArrayList<>();
                String oldAmount = previous == null ? null : formatFee(previous.getAmount(), previous.getFeeType());
                String newAmount = formatFee(version.getAmount(), version.getFeeType());
                changes.add(field("amount", "Mức phí", oldAmount, newAmount));
                if (previous != null && !Objects.equals(previous.getName(), version.getName())) {
                    changes.add(field("name", "Tên phụ phí", previous.getName(), version.getName()));
                }
                if (previous != null && !Objects.equals(previous.getIsActive(), version.getIsActive())) {
                    changes.add(field("isActive", "Trạng thái", activeLabel(previous.getIsActive()), activeLabel(version.getIsActive())));
                }
                String summary = arrow("Mức phí", oldAmount, newAmount);
                if (changes.size() > 1) {
                    summary = summary + " · " + changes.stream().skip(1)
                            .map(change -> arrow(change.getLabel(), change.getOldValue(), change.getNewValue()))
                            .collect(Collectors.joining(" · "));
                }
                boolean isApplied = applied != null && Objects.equals(applied.getId(), version.getId());
                entries.add(PriceAuditEntryResponse.builder()
                        .id(CATEGORY_SURCHARGE + "-" + version.getId())
                        .category(CATEGORY_SURCHARGE)
                        .recordedAt(version.getCreatedAt())
                        .actorId(version.getCreatedBy())
                        .subject(version.getName())
                        .facilityId(version.getFacilityId())
                        .changeSummary(summary)
                        .changes(changes)
                        .snapshot(List.of(
                                field("amount", "Mức phí", oldAmount, newAmount),
                                field("feeType", "Loại phí", previous == null ? null : feeTypeLabel(previous.getFeeType()), feeTypeLabel(version.getFeeType())),
                                field("isActive", "Trạng thái", previous == null ? null : activeLabel(previous.getIsActive()), activeLabel(version.getIsActive())),
                                field("name", "Tên phụ phí", previous == null ? null : previous.getName(), version.getName())))
                        .effectiveFrom(version.getEffectiveFrom())
                        .status(statusFor(version.getEffectiveFrom(), isApplied))
                        .build());
                previous = version;
            }
        }
        return entries;
    }

    private List<PriceAuditEntryResponse> policyEntries() {
        List<PolicyVersion> versions = new ArrayList<>();
        for (PolicyVersion version : policyVersionRepository.findAll()) {
            if (version == null || version.getId() == null || version.getVersionNo() == null) {
                continue;
            }
            versions.add(version);
        }
        versions.sort(Comparator.comparing(PolicyVersion::getVersionNo, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(PolicyVersion::getId, Comparator.nullsLast(Long::compareTo)));
        PolicyVersion applied = pickApplied(versions, this::policyEffectiveDay, PolicyVersion::getId);
        List<PriceAuditEntryResponse> entries = new ArrayList<>();
        PolicyVersion previous = null;
        for (PolicyVersion version : versions) {
            List<PriceAuditFieldResponse> snapshot = policyFields(previous, version, false);
            List<PriceAuditFieldResponse> changes = previous == null
                    ? snapshot
                    : policyFields(previous, version, true);
            String summary = previous == null
                    ? "Ban hành phiên bản đầu"
                    : summarizeChanges(changes);
            boolean isApplied = applied != null && Objects.equals(applied.getId(), version.getId());
            entries.add(PriceAuditEntryResponse.builder()
                    .id(CATEGORY_POLICY + "-" + version.getId())
                    .category(CATEGORY_POLICY)
                    .recordedAt(version.getCreatedAt())
                    .actorId(version.getPublishedBy())
                    .subject("Chính sách v" + version.getVersionNo())
                    .facilityName("Toàn hệ thống")
                    .changeSummary(summary)
                    .changes(changes)
                    .snapshot(snapshot)
                    .effectiveFrom(policyEffectiveDay(version))
                    .status(statusFor(policyEffectiveDay(version), isApplied))
                    .build());
            previous = version;
        }
        return entries;
    }

    private void fillNames(List<PriceAuditEntryResponse> entries) {
        Set<Long> facilityIds = entries.stream()
                .map(PriceAuditEntryResponse::getFacilityId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> actorIds = entries.stream()
                .map(PriceAuditEntryResponse::getActorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> facilityNames = facilityIds.isEmpty()
                ? Map.of()
                : facilityRepository.findAllById(facilityIds).stream()
                        .filter(facility -> facility.getId() != null)
                        .collect(Collectors.toMap(
                                Facility::getId,
                                facility -> blankTo(facility.getName(), "Cơ sở #" + facility.getId()),
                                (left, right) -> left));
        Map<Long, String> actorNames = actorIds.isEmpty()
                ? Map.of()
                : userRepository.findAllById(actorIds).stream()
                        .filter(user -> user.getId() != null)
                        .collect(Collectors.toMap(
                                AppUser::getId,
                                user -> blankTo(user.getFullName(), UNKNOWN_ACTOR),
                                (left, right) -> left));

        boolean hasRent = entries.stream().anyMatch(entry -> CATEGORY_RENT.equals(entry.getCategory()));
        Map<Long, Long> rentUnitTypeIds = new HashMap<>();
        if (hasRent) {
            for (FacilityUnitTypePriceVersion version : priceVersionRepository.findAll()) {
                rentUnitTypeIds.put(version.getId(), version.getUnitTypeId());
            }
        }
        Map<Long, String> unitTypeNames = hasRent
                ? unitTypeRepository.findAll().stream()
                        .collect(Collectors.toMap(UnitType::getId, UnitType::getName, (left, right) -> left))
                : Map.of();

        for (PriceAuditEntryResponse entry : entries) {
            if (entry.getFacilityId() != null) {
                entry.setFacilityName(facilityNames.getOrDefault(entry.getFacilityId(), "Cơ sở #" + entry.getFacilityId()));
            } else if (entry.getFacilityName() == null) {
                entry.setFacilityName("Toàn hệ thống");
            }
            entry.setActorName(entry.getActorId() == null
                    ? UNKNOWN_ACTOR
                    : actorNames.getOrDefault(entry.getActorId(), UNKNOWN_ACTOR));
            if (CATEGORY_RENT.equals(entry.getCategory())) {
                Long unitTypeId = rentUnitTypeIds.get(entrySortId(entry));
                String unitTypeName = unitTypeId == null
                        ? "Loại ô kho"
                        : unitTypeNames.getOrDefault(unitTypeId, "Loại ô kho #" + unitTypeId);
                entry.setSubject(entry.getFacilityName() + " · " + unitTypeName);
            } else if (CATEGORY_SURCHARGE.equals(entry.getCategory())) {
                entry.setSubject(entry.getSubject() + " · " + entry.getFacilityName());
            }
        }
    }

    private List<PriceAuditFieldResponse> policyFields(PolicyVersion previous, PolicyVersion current, boolean onlyChanged) {
        List<PolicyField> fields = policyFieldCatalog();
        List<PriceAuditFieldResponse> result = new ArrayList<>();
        for (PolicyField field : fields) {
            String oldValue = previous == null ? null : readPolicyField(field, previous);
            String newValue = readPolicyField(field, current);
            if (onlyChanged && Objects.equals(display(oldValue), display(newValue))) {
                continue;
            }
            result.add(field(field.key, field.label, oldValue, newValue));
        }
        return result;
    }

    private List<PolicyField> policyFieldCatalog() {
        return List.of(
                new PolicyField("deposit.multiplier", "Hệ số cọc", version -> decimal(version.getDepositMultiplier())),
                new PolicyField("reservation.hold_hours", "Giờ giữ chỗ chờ thanh toán", version -> integer(version.getReservationHoldHours())),
                new PolicyField("rental.buffer_days", "Ngày đệm sau hết hạn", version -> integer(version.getRentalBufferDays())),
                new PolicyField("rental.daily_divisor", "Số ngày quy ước một tháng", version -> integer(version.getRentalDailyDivisor())),
                new PolicyField("checkin.grace_days", "Ân hạn nhận kho (ngày)", version -> integer(version.getCheckinGraceDays())),
                new PolicyField("cancel.full_refund_hours", "Giờ hoàn đủ khi hủy sớm", version -> integer(version.getCancelFullRefundHours())),
                new PolicyField("cancel.late_refund_rate", "Tỷ lệ hoàn cọc khi hủy muộn", version -> percent(version.getCancelLateRefundRate())),
                new PolicyField("cancel.no_show_refund_rate", "Tỷ lệ hoàn cọc khi no-show", version -> percent(version.getCancelNoShowRefundRate())),
                new PolicyField("renewal.reminder_days", "Mốc nhắc gia hạn", version -> text(version.getRenewalReminderDays())),
                new PolicyField("renewal.min_months", "Gia hạn tối thiểu (tháng)", version -> integer(version.getRenewalMinMonths())),
                new PolicyField("renewal.max_months", "Gia hạn tối đa (tháng)", version -> integer(version.getRenewalMaxMonths())),
                new PolicyField("overdue.grace_days", "Ân hạn quá hạn (ngày)", version -> integer(version.getOverdueGraceDays())),
                new PolicyField("overdue.daily_rate", "Phí quá hạn mỗi ngày", version -> percent(version.getOverdueDailyRate())),
                new PolicyField("overdue.cap_rate", "Trần phí quá hạn", version -> percent(version.getOverdueCapRate())),
                new PolicyField("overdue.lock_access_days", "Ngày khóa mã truy cập", version -> integer(version.getOverdueLockAccessDays())),
                new PolicyField("overdue.notice_days", "Ngày thông báo quá hạn", version -> integer(version.getOverdueNoticeDays())),
                new PolicyField("overdue.termination_days", "Ngày chấm dứt hợp đồng", version -> integer(version.getOverdueTerminationDays())),
                new PolicyField("return.notice_days", "Mốc đánh dấu trả kho (ngày)", version -> integer(version.getReturnNoticeDays())),
                new PolicyField("return.refund_working_days", "Ngày làm việc hoàn cọc", version -> integer(version.getReturnRefundWorkingDays())),
                new PolicyField("return.early_refund_rate", "Tỷ lệ hoàn tiền thuê khi trả sớm", version -> percent(version.getReturnEarlyRefundRate())),
                new PolicyField("access.pin_length", "Độ dài mã PIN", version -> integer(version.getAccessPinLength())),
                new PolicyField("support.urgent_sla_hours", "SLA sự cố khẩn cấp (giờ)", version -> integer(version.getSupportUrgentSlaHours())),
                new PolicyField("support.auto_close_working_days", "Ngày tự đóng yêu cầu hỗ trợ", version -> integer(version.getSupportAutoCloseWorkingDays())));
    }

    private String summarizeChanges(List<PriceAuditFieldResponse> changes) {
        if (changes.isEmpty()) {
            return "Không có trường nào thay đổi";
        }
        int shown = Math.min(3, changes.size());
        String head = changes.subList(0, shown).stream()
                .map(change -> arrow(change.getLabel(), change.getOldValue(), change.getNewValue()))
                .collect(Collectors.joining(" · "));
        int rest = changes.size() - shown;
        return rest > 0 ? head + " · và " + rest + " trường khác" : head;
    }

    private <T> T pickApplied(List<T> versions, Function<T, LocalDate> effective, Function<T, Long> id) {
        LocalDate today = AppliedPriceLookup.todayVn();
        return versions.stream()
                .filter(version -> {
                    LocalDate day = effective.apply(version);
                    return day == null || !day.isAfter(today);
                })
                .max(Comparator
                        .comparing((T version) -> {
                            LocalDate day = effective.apply(version);
                            return day == null ? LocalDate.MIN : day;
                        })
                        .thenComparing(id, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
    }

    private String statusFor(LocalDate effectiveFrom, boolean isApplied) {
        if (effectiveFrom != null && effectiveFrom.isAfter(AppliedPriceLookup.todayVn())) {
            return AppliedPriceInfo.STATUS_PENDING;
        }
        return isApplied ? AppliedPriceInfo.STATUS_APPLIED : AppliedPriceInfo.STATUS_REPLACED;
    }

    private String readPolicyField(PolicyField field, PolicyVersion version) {
        if (version == null) {
            return null;
        }
        try {
            return field.read.apply(version);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private LocalDate policyEffectiveDay(PolicyVersion version) {
        if (version == null || version.getEffectiveFrom() == null) {
            return null;
        }
        return version.getEffectiveFrom().atZoneSameInstant(AppliedPriceLookup.VN_ZONE).toLocalDate();
    }

    private boolean matchesFacility(PriceAuditEntryResponse entry, Long facilityId) {
        if (facilityId == null) {
            return true;
        }
        if (CATEGORY_POLICY.equals(entry.getCategory())) {
            return true;
        }
        if (CATEGORY_SURCHARGE.equals(entry.getCategory()) && entry.getFacilityId() == null) {
            return true;
        }
        return facilityId.equals(entry.getFacilityId());
    }

    private boolean withinRecordedRange(OffsetDateTime recordedAt, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return true;
        }
        if (recordedAt == null) {
            return false;
        }
        LocalDate day = recordedAt.atZoneSameInstant(AppliedPriceLookup.VN_ZONE).toLocalDate();
        if (from != null && day.isBefore(from)) {
            return false;
        }
        return to == null || !day.isAfter(to);
    }

    private int newestFirst(PriceAuditEntryResponse left, PriceAuditEntryResponse right) {
        return compareRecorded(right.getRecordedAt(), entrySortId(right), left.getRecordedAt(), entrySortId(left));
    }

    private long entrySortId(PriceAuditEntryResponse entry) {
        if (entry.getId() == null) {
            return 0L;
        }
        int dash = entry.getId().lastIndexOf('-');
        if (dash < 0) {
            return 0L;
        }
        try {
            return Long.parseLong(entry.getId().substring(dash + 1));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private int compareRecorded(OffsetDateTime leftTime, Long leftId, OffsetDateTime rightTime, Long rightId) {
        if (leftTime == null && rightTime == null) {
            return Long.compare(leftId == null ? 0L : leftId, rightId == null ? 0L : rightId);
        }
        if (leftTime == null) {
            return -1;
        }
        if (rightTime == null) {
            return 1;
        }
        int compared = leftTime.compareTo(rightTime);
        if (compared != 0) {
            return compared;
        }
        return Long.compare(leftId == null ? 0L : leftId, rightId == null ? 0L : rightId);
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank() || "ALL".equalsIgnoreCase(category)) {
            return null;
        }
        String normalized = category.trim().toUpperCase(Locale.ROOT);
        if (!CATEGORY_RENT.equals(normalized)
                && !CATEGORY_SURCHARGE.equals(normalized)
                && !CATEGORY_POLICY.equals(normalized)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Loại nhật ký không hợp lệ");
        }
        return normalized;
    }

    private static PriceAuditFieldResponse field(String key, String label, String oldValue, String newValue) {
        return PriceAuditFieldResponse.builder()
                .key(key)
                .label(label)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
    }

    private static String arrow(String label, String oldValue, String newValue) {
        if (oldValue == null || oldValue.isBlank()) {
            return label + " " + display(newValue);
        }
        return label + " " + oldValue + " → " + display(newValue);
    }

    private static String display(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private static String money(Long amount) {
        if (amount == null) {
            return "—";
        }
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setGroupingSeparator('.');
        return new DecimalFormat("#,###", symbols).format(amount);
    }

    private static String formatFee(Long amount, String feeType) {
        if ("PERCENTAGE".equals(feeType)) {
            return (amount == null ? "—" : amount.toString()) + "%";
        }
        return money(amount) + " đ";
    }

    private static String feeTypeLabel(String feeType) {
        return "PERCENTAGE".equals(feeType) ? "Tỷ lệ" : "Số tiền cố định";
    }

    private static String activeLabel(Boolean active) {
        return Boolean.FALSE.equals(active) ? "Ngừng" : "Đang dùng";
    }

    private static String decimal(BigDecimal value) {
        return value == null ? "—" : value.stripTrailingZeros().toPlainString();
    }

    private static String percent(BigDecimal value) {
        if (value == null) {
            return "—";
        }
        return value.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString() + "%";
    }

    private static String integer(Integer value) {
        return value == null ? "—" : value.toString();
    }

    private static String text(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private record PolicyField(String key, String label, Function<PolicyVersion, String> read) {
    }
}
