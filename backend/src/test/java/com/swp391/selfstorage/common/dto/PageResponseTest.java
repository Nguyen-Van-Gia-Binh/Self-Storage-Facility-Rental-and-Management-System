package com.swp391.selfstorage.common.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PageResponseTest {

    @Test
    @DisplayName("Chuyển đổi Spring Page sang PageResponse chính xác")
    void testFromSpringPage() {
        List<String> items = List.of("Unit 1", "Unit 2");
        Page<String> page = new PageImpl<>(items, PageRequest.of(0, 10), 2);

        PageResponse<String> response = PageResponse.from(page);

        assertEquals(2, response.getContent().size());
        assertEquals(0, response.getPage());
        assertEquals(10, response.getSize());
        assertEquals(2, response.getTotalElements());
        assertEquals(1, response.getTotalPages());
    }
}
