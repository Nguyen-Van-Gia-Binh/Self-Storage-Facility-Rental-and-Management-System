package com.swp391.selfstorage.common.cache;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.SimpleValueWrapper;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    @Test
    @DisplayName("TwoLevelCacheManager: Cache nằm trong l1OnlyCaches chỉ dùng L1, không gọi L2 Redis")
    void testTwoLevelCacheManager_l1OnlySkipsL2() {
        CacheManager l1Manager = mock(CacheManager.class);
        CacheManager l2Manager = mock(CacheManager.class);
        when(l1Manager.getCache("userDetails")).thenReturn(l1Cache);

        TwoLevelCacheManager manager = new TwoLevelCacheManager(l1Manager, l2Manager, Set.of("userDetails"));
        Cache cache = manager.getCache("userDetails");

        assertThat(cache).isSameAs(l1Cache);
        verify(l2Manager, never()).getCache("userDetails");
    }

    @Test
    @DisplayName("CacheConfig: Khởi tạo kết nối Redis với SSL khi url bắt đầu bằng rediss://")
    void testCacheConfig_redisWithSsl() throws Exception {
        com.swp391.selfstorage.common.config.CacheConfig config = new com.swp391.selfstorage.common.config.CacheConfig();
        java.lang.reflect.Field field = com.swp391.selfstorage.common.config.CacheConfig.class.getDeclaredField("redisUrl");
        field.setAccessible(true);
        field.set(config, "rediss://default:dummy@dummy.upstash.io:6379");

        CacheManager manager = config.cacheManager();
        assertThat(manager).isNotNull();
        assertThat(manager).isInstanceOf(TwoLevelCacheManager.class);
    }

    @Test
    @DisplayName("L2 LinkedHashMap Anomaly: Khi L2 trả về LinkedHashMap (lỗi mất class type), TwoLevelCache tự động evict và trả về null để fallback DB")
    void testL2LinkedHashMapAnomaly_evictsAndReturnsNull() {
        when(l1Cache.get("key1")).thenReturn(null);
        Map<String, Object> corruptedMap = new LinkedHashMap<>();
        corruptedMap.put("content", List.of());
        when(l2Cache.get("key1")).thenReturn(new SimpleValueWrapper(corruptedMap));

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNull();
        verify(l2Cache, times(1)).evict("key1");
        verify(l1Cache, never()).put(any(), any());
    }

    @Test
    @DisplayName("L1 LinkedHashMap Anomaly: Khi L1 chứa LinkedHashMap, TwoLevelCache tự động evict khỏi L1")
    void testL1LinkedHashMapAnomaly_evictsAndContinues() {
        Map<String, Object> corruptedMap = new LinkedHashMap<>();
        when(l1Cache.get("key1")).thenReturn(new SimpleValueWrapper(corruptedMap));
        when(l2Cache.get("key1")).thenReturn(new SimpleValueWrapper("validVal"));

        Cache.ValueWrapper result = twoLevelCache.get("key1");

        assertThat(result).isNotNull();
        assertThat(result.get()).isEqualTo("validVal");
        verify(l1Cache, times(1)).evict("key1");
        verify(l1Cache, times(1)).put("key1", "validVal");
    }

    @Test
    @DisplayName("Redis Serializer: Đảm bảo PageResponse<FacilityResponse> serialize và deserialize giữ nguyên kiểu đối tượng (không biến thành LinkedHashMap)")
    void testPageResponseSerialization_retainsType() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        FacilityResponse facility = new FacilityResponse();
        facility.setId(1L);
        facility.setName("Kho Quận 7");
        PageResponse<FacilityResponse> pageResponse = new PageResponse<>(List.of(facility), 0, 10, 1L, 1);

        byte[] serialized = serializer.serialize(pageResponse);
        assertThat(serialized).isNotNull();

        Object deserialized = serializer.deserialize(serialized);
        assertThat(deserialized).isInstanceOf(PageResponse.class);
        PageResponse<?> result = (PageResponse<?>) deserialized;
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0)).isInstanceOf(FacilityResponse.class);
        FacilityResponse deserializedFacility = (FacilityResponse) result.getContent().get(0);
        assertThat(deserializedFacility.getName()).isEqualTo("Kho Quận 7");
    }
}
