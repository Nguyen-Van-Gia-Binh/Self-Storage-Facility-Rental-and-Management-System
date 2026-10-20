package com.swp391.selfstorage.common.cache;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cache.Cache;
import org.springframework.cache.support.SimpleValueWrapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TwoLevelCacheTest {

    private Cache l1Cache;
    private Cache l2Cache;
    private TwoLevelCache twoLevelCache;

    @BeforeEach
    void setUp() {
        l1Cache = mock(Cache.class);
        l2Cache = mock(Cache.class);
        twoLevelCache = new TwoLevelCache("testCache", l1Cache, l2Cache);
    }

    @Test
    @DisplayName("L1 Hit: Trả về dữ liệu từ L1 và không cần truy vấn L2")
    void testL1Hit_doesNotQueryL2() {
        when(l1Cache.get("key1")).thenReturn(new SimpleValueWrapper("val1"));

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNotNull();
        assertThat(result.get()).isEqualTo("val1");
        verify(l1Cache, times(1)).get("key1");
        verify(l2Cache, never()).get(any());
    }

    @Test
    @DisplayName("L1 Miss, L2 Hit: Lấy dữ liệu từ L2 và nạp ngược lại vào L1")
    void testL1Miss_L2Hit_populatesL1() {
        when(l1Cache.get("key1")).thenReturn(null);
        when(l2Cache.get("key1")).thenReturn(new SimpleValueWrapper("val2"));

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNotNull();
        assertThat(result.get()).isEqualTo("val2");
        verify(l1Cache, times(1)).get("key1");
        verify(l2Cache, times(1)).get("key1");
        verify(l1Cache, times(1)).put("key1", "val2");
    }

    @Test
    @DisplayName("L1 Miss, L2 Miss: Trả về null để service query DB")
    void testBothMiss_returnsNull() {
        when(l1Cache.get("key1")).thenReturn(null);
        when(l2Cache.get("key1")).thenReturn(null);

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNull();
        verify(l1Cache, times(1)).get("key1");
        verify(l2Cache, times(1)).get("key1");
    }

    @Test
    @DisplayName("L2 Error Fault-Tolerance: Khi Redis ném ngoại lệ, hệ thống không bị crash")
    void testL2Error_gracefulDegradation() {
        when(l1Cache.get("key1")).thenReturn(null);
        when(l2Cache.get("key1")).thenThrow(new RuntimeException("Redis connection timed out"));

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNull(); // Fallback an toàn về null để gọi DB
    }

    @Test
    @DisplayName("Put: Ghi đồng thời vào cả L1 và L2")
    void testPut_writesToBothLevels() {
        twoLevelCache.put("key1", "val1");

        verify(l1Cache, times(1)).put("key1", "val1");
        verify(l2Cache, times(1)).put("key1", "val1");
    }

    @Test
    @DisplayName("Evict: Xóa đồng thời ở cả L1 và L2")
    void testEvict_evictsFromBothLevels() {
        twoLevelCache.evict("key1");

        verify(l1Cache, times(1)).evict("key1");
        verify(l2Cache, times(1)).evict("key1");
    }
}
