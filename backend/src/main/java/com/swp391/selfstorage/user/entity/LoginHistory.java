package com.swp391.selfstorage.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "login_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "logged_in_at", nullable = false)
    private OffsetDateTime loggedInAt;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "is_success", nullable = false)
    private boolean success;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @PrePersist
    protected void onCreate() {
        if (loggedInAt == null) {
            loggedInAt = OffsetDateTime.now();
        }
    }
}
