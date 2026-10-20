package com.swp391.selfstorage.common.cache;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý bộ đệm hai tầng kết hợp giữa L1 (Caffeine) và L2 (Redis).
 */
public class TwoLevelCacheManager implements CacheManager {

    private final CacheManager l1CacheManager;
    private final CacheManager l2CacheManager;
    private final Map<String, Cache> cacheMap = new ConcurrentHashMap<>();

    public TwoLevelCacheManager(CacheManager l1CacheManager, CacheManager l2CacheManager) {
        this.l1CacheManager = l1CacheManager;
        this.l2CacheManager = l2CacheManager;
    }

    @Override
    public Cache getCache(String name) {
        return cacheMap.computeIfAbsent(name, cacheName -> {
            Cache l1 = l1CacheManager != null ? l1CacheManager.getCache(cacheName) : null;
            Cache l2 = l2CacheManager != null ? l2CacheManager.getCache(cacheName) : null;
            if (l1 == null && l2 == null) {
                return null;
            }
            if (l1 == null) return l2;
            if (l2 == null) return l1;
            return new TwoLevelCache(cacheName, l1, l2);
        });
    }

    @Override
    public Collection<String> getCacheNames() {
        if (l1CacheManager != null) {
            return l1CacheManager.getCacheNames();
        }
        if (l2CacheManager != null) {
            return l2CacheManager.getCacheNames();
        }
        return Collections.emptyList();
    }
}
