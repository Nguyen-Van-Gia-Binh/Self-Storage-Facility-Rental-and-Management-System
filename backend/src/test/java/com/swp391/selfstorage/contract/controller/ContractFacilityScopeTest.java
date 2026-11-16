package com.swp391.selfstorage.contract.controller;

import com.swp391.selfstorage.user.entity.UserRole;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ContractFacilityScopeTest {

    @Test
    void staffDispatchedToContractCanReadItOutsideAssignedFacilities() {
        List<Long> scope = ContractController.scopeWhenStaffHasTask(
                UserRole.FACILITY_STAFF, List.of(1L, 2L), true);

        assertTrue(scope.isEmpty());
    }

    @Test
    void staffWithoutThisTaskStaysInsideAssignedFacilities() {
        List<Long> assigned = List.of(1L, 2L);

        List<Long> scope = ContractController.scopeWhenStaffHasTask(
                UserRole.FACILITY_STAFF, assigned, false);

        assertEquals(assigned, scope);
    }
}
