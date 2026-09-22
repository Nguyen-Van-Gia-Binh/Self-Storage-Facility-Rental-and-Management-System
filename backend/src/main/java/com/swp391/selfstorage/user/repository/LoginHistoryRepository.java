package com.swp391.selfstorage.user.repository;

import com.swp391.selfstorage.user.entity.LoginHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long>, JpaSpecificationExecutor<LoginHistory> {
    List<LoginHistory> findByUserIdOrderByLoggedInAtDesc(Long userId);
    Page<LoginHistory> findByUserId(Long userId, Pageable pageable);
}
