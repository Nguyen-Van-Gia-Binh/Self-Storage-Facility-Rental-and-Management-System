package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.contract.dto.*;
import java.util.List;

public interface ContractService {
    ContractResponse createFromReservation(Long reservationId);
    ContractResponse getContractById(Long contractId, List<Long> facilityIds);
    CheckInResponse checkIn(Long contractId, CheckInRequest request, Long staffId, List<Long> facilityIds);
    HandoverRejectionResponse rejectHandover(Long contractId, HandoverRejectionRequest request,
                                              Long staffId, List<Long> facilityIds);
}