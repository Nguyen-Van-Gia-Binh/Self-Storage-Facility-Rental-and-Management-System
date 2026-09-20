package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.unit.dto.AvailabilityResponse;

import java.time.LocalDate;

public interface AvailabilityService {
    AvailabilityResponse checkAvailability(Long facilityId, Long unitTypeId, LocalDate startDate, Integer rentalMonths);
}
