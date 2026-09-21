package com.swp391.selfstorage.user.repository;

import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM AppUser u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:status IS NULL OR u.status = :status)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<AppUser> findByFilters(@Param("keyword") String keyword,
                                @Param("role") UserRole role,
                                @Param("status") UserStatus status,
                                Pageable pageable);
}
