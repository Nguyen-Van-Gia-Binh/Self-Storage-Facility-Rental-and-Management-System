package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.support.dto.TaskAssignmentRequest;
import com.swp391.selfstorage.support.dto.TaskAssignmentResponse;

public interface StaffAssignmentService {
    TaskAssignmentResponse assignStaff(TaskAssignmentRequest request, UserPrincipal currentUser);
}
