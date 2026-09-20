package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.ContractExtraCharge;
import com.swp391.selfstorage.contract.entity.ExtraChargeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractExtraChargeRepository extends JpaRepository<ContractExtraCharge, Long> {
    List<ContractExtraCharge> findByContractId(Long contractId);
    List<ContractExtraCharge> findByContractIdAndStatus(Long contractId, ExtraChargeStatus status);
}
