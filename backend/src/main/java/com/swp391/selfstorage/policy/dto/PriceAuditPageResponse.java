package com.swp391.selfstorage.policy.dto;

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
public class PriceAuditPageResponse {
    @Builder.Default
    private List<PriceAuditEntryResponse> content = new ArrayList<>();
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    @Builder.Default
    private List<PriceAuditActorResponse> actors = new ArrayList<>();
}
