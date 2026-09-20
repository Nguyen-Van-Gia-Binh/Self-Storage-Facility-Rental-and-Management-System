package com.swp391.selfstorage.facility.mapper;

import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityRequest;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import org.springframework.stereotype.Component;

@Component
public class FacilityMapper {

    public Facility toEntity(CreateFacilityRequest request) {
        if (request == null) return null;
        Facility facility = new Facility();
        facility.setCode(request.getCode().trim().toUpperCase());
        facility.setName(request.getName().trim());
        facility.setAddress(request.getAddress().trim());
        facility.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        facility.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        facility.setOpeningHours(request.getOpeningHours() != null ? request.getOpeningHours().trim() : null);
        facility.setStatus(FacilityStatus.ACTIVE);
        return facility;
    }

    public void updateEntity(Facility facility, UpdateFacilityRequest request) {
        if (facility == null || request == null) return;
        facility.setName(request.getName().trim());
        facility.setAddress(request.getAddress().trim());
        facility.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        facility.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        facility.setOpeningHours(request.getOpeningHours() != null ? request.getOpeningHours().trim() : null);
    }

    public FacilityResponse toResponse(Facility facility) {
        if (facility == null) return null;
        FacilityResponse res = new FacilityResponse();
        res.setId(facility.getId());
        res.setCode(facility.getCode());
        res.setName(facility.getName());
        res.setAddress(facility.getAddress());
        res.setPhone(facility.getPhone());
        res.setDescription(facility.getDescription());
        res.setOpeningHours(facility.getOpeningHours());
        res.setActive(facility.isActive());
        res.setCreatedAt(facility.getCreatedAt());
        res.setUpdatedAt(facility.getUpdatedAt());
        return res;
    }
}
