package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnInspectionRequest {
    @NotNull(message = "Ngày nghiệm thu không được để trống")
    private LocalDate returnDate;
    @NotNull(message = "Tình trạng ô kho không được để trống (GOOD, MINOR_DAMAGE, MAJOR_DAMAGE)")
    private String condition;
    private String damageNotes;
    private long damageCost;
    private String evidenceImageUrls;

    /** Khách ký xác nhận biên bản (BR-RET-08). */
    private Boolean customerConfirmed;

    /** Ảnh chữ ký dạng data URL. */
    private String signatureDataUrl;
}
