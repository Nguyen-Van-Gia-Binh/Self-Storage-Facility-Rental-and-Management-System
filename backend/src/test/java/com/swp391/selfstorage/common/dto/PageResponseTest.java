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
    @DisplayName("Chuyển đổi Spring Page sang PageResponse đúng cấu trúc spec")
    void testFromSpringPage() {
        List<String> items = List.of("Facility 1", "Facility 2");
        Page<String> springPage = new PageImpl<>(items, PageRequest.of(0, 10), 2);

        PageResponse<String> pageResponse = PageResponse.from(springPage);

        assertEquals(0, pageResponse.getPage());
        assertEquals(10, pageResponse.getSize());
        assertEquals(2, pageResponse.getTotalElements());
        assertEquals(1, pageResponse.getTotalPages());
        assertEquals(2, pageResponse.getContent().size());
    }
}
