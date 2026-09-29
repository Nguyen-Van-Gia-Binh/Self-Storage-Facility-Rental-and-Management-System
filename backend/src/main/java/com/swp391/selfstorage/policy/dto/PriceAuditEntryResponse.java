package com.swp391.selfstorage.policy.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAuditEntryResponse {
    private String id;
    private String category;
    private OffsetDateTime recordedAt;
    private Long actorId;
    private String actorName;
    private String subject;
    private Long facilityId;
    private String facilityName;
    private String changeSummary;
    @Builder.Default
    private List<PriceAuditFieldResponse> changes = new ArrayList<>();
    @Builder.Default
    private List<PriceAuditFieldResponse> snapshot = new ArrayList<>();
    private LocalDate effectiveFrom;
    private String status;
}
