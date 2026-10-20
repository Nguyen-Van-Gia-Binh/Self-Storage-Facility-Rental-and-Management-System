package com.swp391.selfstorage.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.swp391.selfstorage.common.cache.TwoLevelCacheManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
@Slf4j
public class CacheConfig {

    @Value("${spring.data.redis.url:${REDIS_URL:}}")
    private String redisUrl;

    @Bean
    public CacheManager cacheManager() {
        // 1. Cấu hình L1 Cache: Caffeine In-Memory (TTL 10 phút, tối đa 500 bản ghi)
        CaffeineCacheManager caffeineCacheManager = new CaffeineCacheManager("facilities", "unitTypes");
        caffeineCacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(500));

        // 2. Cấu hình L2 Cache: Redis Upstash nếu REDIS_URL được cấu hình
        RedisCacheManager redisCacheManager = null;
        if (StringUtils.hasText(redisUrl)) {
            try {
                RedisConfiguration redisConfig = LettuceConnectionFactory.createRedisConfiguration(redisUrl.trim());
                LettuceConnectionFactory connectionFactory = new LettuceConnectionFactory(redisConfig);
                connectionFactory.afterPropertiesSet();

                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.registerModule(new JavaTimeModule());
                objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

                GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

                RedisCacheConfiguration redisCacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                        .entryTtl(Duration.ofMinutes(30))
                        .prefixCacheNameWith("selfstorage:")
                        .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer))
                        .disableCachingNullValues();

                redisCacheManager = RedisCacheManager.builder(connectionFactory)
                        .cacheDefaults(redisCacheConfig)
                        .build();

                log.info("✅ Đã kết nối Redis Upstash thành công làm L2 Cache (TTL 30m)!");
            } catch (Exception e) {
                log.warn("⚠️ Không thể khởi tạo Redis L2 Cache (sẽ chỉ dùng L1 Caffeine): {}", e.getMessage());
            }
        } else {
            log.info("ℹ️ Không tìm thấy REDIS_URL — Hệ thống hoạt động với L1 Caffeine Cache.");
        }

        if (redisCacheManager != null) {
            return new TwoLevelCacheManager(caffeineCacheManager, redisCacheManager);
        }

        return caffeineCacheManager;
    }
}

