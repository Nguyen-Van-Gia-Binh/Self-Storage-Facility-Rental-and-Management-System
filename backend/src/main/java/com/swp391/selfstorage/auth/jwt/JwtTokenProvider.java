package com.swp391.selfstorage.auth.jwt;

import com.swp391.selfstorage.user.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final String jwtSecret;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs) {
        this.jwtSecret = jwtSecret;
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(AppUser user, List<Long> facilityIds) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .claim("facilityIds", facilityIds != null ? facilityIds : Collections.emptyList())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(AppUser user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        Object userId = getClaims(token).get("userId");
        if (userId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public String getRoleFromToken(String token) {
        return (String) getClaims(token).get("role");
    }

    @SuppressWarnings("unchecked")
    public List<Long> getFacilityIdsFromToken(String token) {
        Object list = getClaims(token).get("facilityIds");
        if (list instanceof List<?> rawList) {
            return rawList.stream()
                    .filter(Number.class::isInstance)
                    .map(item -> ((Number) item).longValue())
                    .toList();
        }
        return Collections.emptyList();
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Chữ ký JWT không hợp lệ: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token không được hỗ trợ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims rỗng hoặc không hợp lệ: {}", e.getMessage());
        } catch (JwtException e) {
            log.error("Lỗi phân tích JWT: {}", e.getMessage());
        }
        return false;
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }
}
