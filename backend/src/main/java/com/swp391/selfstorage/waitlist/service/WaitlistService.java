package com.swp391.selfstorage.waitlist.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.CreateWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.FollowUpWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.RejectWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.WaitlistResponse;

import java.util.List;

public interface WaitlistService {

    WaitlistResponse registerWaitlist(CreateWaitlistRequest request, UserPrincipal currentUser);

    List<WaitlistResponse> getMyWaitlists(UserPrincipal currentUser);

    WaitlistResponse extendWaitlist(Long id, UserPrincipal currentUser);

    WaitlistResponse cancelWaitlist(Long id, UserPrincipal currentUser);

    List<WaitlistResponse> getFacilityWaitlists(Long facilityId, UserPrincipal currentUser);

    WaitlistResponse startContacting(Long id, UserPrincipal currentUser);

    WaitlistResponse convertToReservation(Long id, ConvertWaitlistRequest request, UserPrincipal currentUser);

    WaitlistResponse convertToContract(Long id, com.swp391.selfstorage.waitlist.dto.ConvertWaitlistToContractRequest request, UserPrincipal currentUser);

    WaitlistResponse reject(Long id, RejectWaitlistRequest request, UserPrincipal currentUser);

    WaitlistResponse followUp(Long id, FollowUpWaitlistRequest request, UserPrincipal currentUser);

    int cleanupExpiredLocks();
}
