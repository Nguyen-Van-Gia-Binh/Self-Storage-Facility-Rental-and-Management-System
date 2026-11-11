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
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;
    private final FacilityMapper facilityMapper;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    public FacilityServiceImpl(FacilityRepository facilityRepository, FacilityMapper facilityMapper) {
        this(facilityRepository, facilityMapper, null);
    }

    @Autowired
    public FacilityServiceImpl(FacilityRepository facilityRepository, FacilityMapper facilityMapper, UserFacilityAssignmentRepository userFacilityAssignmentRepository) {
        this.facilityRepository = facilityRepository;
        this.facilityMapper = facilityMapper;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "facilities", key = "(#keyword != null ? #keyword : '') + '-' + (#isActive != null ? #isActive : '') + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public PageResponse<FacilityResponse> getFacilities(String keyword, Boolean isActive, Pageable pageable) {
        FacilityStatus status = null;
        if (isActive != null) {
            status = isActive ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE;
        }
        Page<Facility> page = facilityRepository.findByFilter(keyword, status, pageable);
        List<Long> facilityIds = page.getContent().stream()
                .map(Facility::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, BigDecimal> lowestPriceMap = resolveAppliedLowestPriceMap(
                facilityIds, toFacilityPriceMap(facilityRepository.findLowestMonthlyPricesGroupedByFacility()));
        Map<Long, Integer> unitTypeCountMap = toUnitTypeCountMap(
                facilityRepository.countActiveUnitTypesGroupedByFacility());

        return PageResponse.from(page.map(facility -> mapWithMetrics(facility, lowestPriceMap, unitTypeCountMap)));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "facilities", key = "#id")
    public FacilityResponse getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
        FacilityResponse resp = facilityMapper.toResponse(facility);
        enrichFacilityMetrics(resp);
        return resp;
    }

    private boolean isAssignableFacility(Facility facility) {
        if (facility == null || facility.getStatus() != FacilityStatus.ACTIVE) {
            return false;
        }
        String name = facility.getName() == null ? "" : facility.getName().toLowerCase();
        String code = facility.getCode() == null ? "" : facility.getCode().toLowerCase();
        return !name.contains("sadas") && !code.contains("sadas");
    }

    private void enrichFacilityMetrics(FacilityResponse resp) {
        if (resp == null || resp.getId() == null) return;
        BigDecimal sqlFallback = facilityRepository.findLowestMonthlyPriceByFacilityId(resp.getId());
        Map<Long, BigDecimal> fallbackMap = sqlFallback != null
                ? Map.of(resp.getId(), sqlFallback)
                : Collections.emptyMap();
        Map<Long, BigDecimal> resolved = resolveAppliedLowestPriceMap(List.of(resp.getId()), fallbackMap);
        resp.setLowestMonthlyPrice(resolved.get(resp.getId()));
        resp.setActiveUnitTypeCount(facilityRepository.countActiveUnitTypesByFacilityId(resp.getId()));
    }

    private static final Pattern FACILITY_CODE_PATTERN = Pattern.compile("^FAC-[A-Z][A-Z0-9]{1,3}$");

    @Override
    @CacheEvict(value = "facilities", allEntries = true)
    public FacilityResponse createFacility(CreateFacilityRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (!FACILITY_CODE_PATTERN.matcher(normalizedCode).matches()) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Mã cơ sở phải có dạng FAC- và 2–4 ký tự, bắt đầu bằng chữ (ví dụ FAC-Q7, FAC-CG)");
        }
        if (facilityRepository.existsByCode(normalizedCode)) {
            throw new CustomException(ErrorCode.FACILITY_CODE_ALREADY_EXISTS);
        }

        Facility facility = facilityMapper.toEntity(request);
        Facility saved = facilityRepository.save(facility);
        return facilityMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = "facilities", allEntries = true)
    public FacilityResponse updateFacility(Long id, UpdateFacilityRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));

        facilityMapper.updateEntity(facility, request);
        Facility updated = facilityRepository.save(facility);
        return facilityMapper.toResponse(updated);
    }

    @Override
    @CacheEvict(value = "facilities", allEntries = true)
    public FacilityResponse updateFacilityStatus(Long id, UpdateFacilityStatusRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));

        boolean targetActive = Boolean.TRUE.equals(request.getIsActive());

        // Nếu chuyển từ ACTIVE sang INACTIVE, phải kiểm tra xem còn hợp đồng hiệu lực không (US-BM-01.2)
        if (!targetActive && facility.getStatus() == FacilityStatus.ACTIVE) {
            long activeContracts = facilityRepository.countActiveContractsByFacilityId(id);
            if (activeContracts > 0) {
                throw new CustomException(ErrorCode.FACILITY_HAS_ACTIVE_CONTRACTS);
            }
        }

        facility.setStatus(targetActive ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE);
        Facility saved = facilityRepository.save(facility);
        return facilityMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "facilities",
            key = "'assigned-' + #currentUser.id + '-' + (#currentUser.role != null ? #currentUser.role.name() : '')",
            condition = "#currentUser != null")
    public List<FacilityResponse> getMyAssignedFacilities(UserPrincipal currentUser) {
        if (currentUser == null) {
            return Collections.emptyList();
        }

        boolean isFullAccess = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                            || a.getAuthority().equals("ROLE_SYSTEM_ADMINISTRATOR")
                            || a.getAuthority().equals("ROLE_BUSINESS_OPERATIONS_MANAGER"));

        List<Facility> facilities;
        if (isFullAccess) {
            facilities = facilityRepository.findAll().stream()
                    .filter(this::isAssignableFacility)
                    .toList();
        } else {
            if (userFacilityAssignmentRepository == null) {
                return Collections.emptyList();
            }
            List<Long> assignedIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(currentUser.getId())
                    .stream()
                    .map(id -> id == null ? null : id.longValue())
                    .filter(id -> id != null)
                    .toList();
            if (assignedIds.isEmpty()) {
                return Collections.emptyList();
            }
            facilities = facilityRepository.findAllById(assignedIds).stream()
                    .filter(this::isAssignableFacility)
                    .toList();
        }

        List<Long> facilityIds = facilities.stream()
                .map(Facility::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, BigDecimal> lowestPriceMap = resolveAppliedLowestPriceMap(
                facilityIds, toFacilityPriceMap(facilityRepository.findLowestMonthlyPricesGroupedByFacility()));
        Map<Long, Integer> unitTypeCountMap = toUnitTypeCountMap(
                facilityRepository.countActiveUnitTypesGroupedByFacility());

        return facilities.stream()
                .map(facility -> mapWithMetrics(facility, lowestPriceMap, unitTypeCountMap))
                .toList();
    }

    private FacilityResponse mapWithMetrics(Facility facility,
                                            Map<Long, BigDecimal> lowestPriceMap,
                                            Map<Long, Integer> unitTypeCountMap) {
        FacilityResponse resp = facilityMapper.toResponse(facility);
        if (resp != null && resp.getId() != null) {
            resp.setLowestMonthlyPrice(lowestPriceMap.get(resp.getId()));
            resp.setActiveUnitTypeCount(unitTypeCountMap.getOrDefault(resp.getId(), 0));
        }
        return resp;
    }

    private Map<Long, BigDecimal> resolveAppliedLowestPriceMap(Collection<Long> facilityIds,
                                                               Map<Long, BigDecimal> sqlFallbackMap) {
        Map<Long, BigDecimal> result = new HashMap<>(sqlFallbackMap);
        if (appliedPriceLookup == null || facilityIds == null || facilityIds.isEmpty()) {
            return result;
        }
        Map<Long, Long> appliedPrices = appliedPriceLookup.resolveLowestMonthlyPricesByFacilityIds(facilityIds);
        if (appliedPrices != null) {
            appliedPrices.forEach((facId, price) -> {
                if (price != null && price > 0) {
                    result.put(facId, BigDecimal.valueOf(price));
                }
            });
        }
        return result;
    }

    private static Map<Long, BigDecimal> toFacilityPriceMap(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }
        return rows.stream()
                .filter(row -> row != null && row.length >= 2 && row[0] != null)
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> toBigDecimal(row[1]),
                        (a, b) -> a));
    }

    private static Map<Long, Integer> toUnitTypeCountMap(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }
        return rows.stream()
                .filter(row -> row != null && row.length >= 2 && row[0] != null && row[1] != null)
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).intValue(),
                        (a, b) -> a));
    }

    private static BigDecimal toBigDecimal(Object val) {
        if (val == null) return null;
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number num) return BigDecimal.valueOf(num.longValue());
        return new BigDecimal(val.toString());
    }
}
