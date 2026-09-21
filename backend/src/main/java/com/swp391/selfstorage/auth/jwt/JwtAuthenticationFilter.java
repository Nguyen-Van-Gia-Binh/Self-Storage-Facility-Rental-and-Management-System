package com.swp391.selfstorage.auth.jwt;

import com.swp391.selfstorage.auth.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final ObjectProvider<JwtTokenProvider> jwtTokenProvider;
    private final ObjectProvider<CustomUserDetailsService> customUserDetailsService;

    public JwtAuthenticationFilter(ObjectProvider<JwtTokenProvider> jwtTokenProvider,
                                   ObjectProvider<CustomUserDetailsService> customUserDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            JwtTokenProvider tokenProvider = jwtTokenProvider.getIfAvailable();
            CustomUserDetailsService userDetailsService = customUserDetailsService.getIfAvailable();

            if (tokenProvider != null && userDetailsService != null) {
                String jwt = extractJwtFromRequest(request);

                if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                    String email = tokenProvider.getEmailFromToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                    if (userDetails.isEnabled()) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception ex) {
            logger.error("Không thể thiết lập user authentication trong SecurityContext", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
