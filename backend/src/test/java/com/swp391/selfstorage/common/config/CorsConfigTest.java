package com.swp391.selfstorage.common.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    @Test
    @DisplayName("CorsConfig cho phép dynamic localhost origins (5173, 5174, 3000, 127.0.0.1) qua allowedOriginPatterns")
    void testAllowedOriginPatterns() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        CorsFilter corsFilter = corsConfig.corsFilter();

        assertNotNull(corsFilter);

        // Lấy configuration từ UrlBasedCorsConfigurationSource
        Field configSourceField = CorsFilter.class.getDeclaredField("configSource");
        configSourceField.setAccessible(true);
        UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource) configSourceField.get(corsFilter);

        // Kiểm tra request từ http://localhost:5173
        MockHttpServletRequest req5173 = new MockHttpServletRequest("GET", "/api/v1/auth/login");
        req5173.addHeader("Origin", "http://localhost:5173");
        CorsConfiguration config5173 = source.getCorsConfiguration(req5173);
        assertNotNull(config5173);
        assertEquals("http://localhost:5173", config5173.checkOrigin("http://localhost:5173"));

        // Kiểm tra request từ http://localhost:5174 (cổng động khi 5173 bận)
        MockHttpServletRequest req5174 = new MockHttpServletRequest("GET", "/api/v1/auth/login");
        req5174.addHeader("Origin", "http://localhost:5174");
        CorsConfiguration config5174 = source.getCorsConfiguration(req5174);
        assertNotNull(config5174);
        assertEquals("http://localhost:5174", config5174.checkOrigin("http://localhost:5174"));

        // Kiểm tra request từ http://127.0.0.1:5174
        assertEquals("http://127.0.0.1:5174", config5174.checkOrigin("http://127.0.0.1:5174"));

        // Kiểm tra allowCredentials
        assertTrue(config5174.getAllowCredentials());
    }
}
