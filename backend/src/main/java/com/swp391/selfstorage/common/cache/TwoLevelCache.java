package com.swp391.selfstorage.common.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;

import java.util.concurrent.Callable;

/**
 * Hai tầng Cache (Two-Level Cache):
 * - L1: Caffeine Cache (In-Memory JVM cực nhanh)
 * - L2: Redis Cache (Phân tán trên Upstash qua SSL/TLS)
 * 
 * Luồng hoạt động:
 * 1. Đọc: L1 -> (nếu miss) -> L2 -> (nếu hit thì nạp vào L1) -> (nếu miss cả hai thì query DB).
 * 2. Ghi / Xóa: Đồng bộ ghi hoặc xóa ở cả L1 lẫn L2.
 * 3. Chịu lỗi (Fault-Tolerance): Mọi ngoại lệ từ Redis đều được bắt và ghi log warning, không làm fail request.
 */
@Slf4j
public class TwoLevelCache implements Cache {

    private final String name;
    private final Cache l1Cache;
    private final Cache l2Cache;

    public TwoLevelCache(String name, Cache l1Cache, Cache l2Cache) {
        this.name = name;
        this.l1Cache = l1Cache;
        this.l2Cache = l2Cache;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public Object getNativeCache() {
        return this;
    }

    @Override
    public ValueWrapper get(Object key) {
        // 1. Kiểm tra L1 Cache (Caffeine)
        if (l1Cache != null) {
            ValueWrapper l1Val = l1Cache.get(key);
            if (l1Val != null) {
                log.trace("[L1 HIT] Cache key: '{}' in cache '{}'", key, name);
                return l1Val;
            }
        }

        // 2. L1 Miss -> Kiểm tra L2 Cache (Redis Upstash)
        if (l2Cache != null) {
            try {
                ValueWrapper l2Val = l2Cache.get(key);
                if (l2Val != null) {
                    log.debug("[L1 MISS, L2 HIT] Cache key: '{}' in cache '{}'. Đang nạp ngược vào L1.", key, name);
                    if (l1Cache != null) {
                        l1Cache.put(key, l2Val.get());
                    }
                    return l2Val;
                }
            } catch (Exception e) {
                log.warn("[L2 REDIS ERROR] Lỗi khi đọc Redis key '{}': {}. Fallback an toàn sang DB.", key, e.getMessage());
            }
        }

        log.trace("[L1 & L2 MISS] Cache key: '{}' in cache '{}'", key, name);
        return null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(Object key, Class<T> type) {
        ValueWrapper wrapper = get(key);
        if (wrapper == null) {
            return null;
        }
        Object value = wrapper.get();
        if (value != null && type != null && !type.isInstance(value)) {
            throw new IllegalStateException("Giá trị cache không đúng kiểu [" + type.getName() + "]: " + value);
        }
        return (T) value;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(Object key, Callable<T> valueLoader) {
        ValueWrapper wrapper = get(key);
        if (wrapper != null) {
            return (T) wrapper.get();
        }

        try {
            T value = valueLoader.call();
            put(key, value);
            return value;
        } catch (Exception e) {
            throw new ValueRetrievalException(key, valueLoader, e);
        }
    }

    @Override
    public void put(Object key, Object value) {
        if (l1Cache != null) {
            l1Cache.put(key, value);
        }
        if (l2Cache != null) {
            try {
                l2Cache.put(key, value);
                log.trace("[L2 PUT] Đã lưu key '{}' vào Redis cache '{}'", key, name);
            } catch (Exception e) {
                log.warn("[L2 REDIS ERROR] Lỗi khi ghi Redis key '{}': {}", key, e.getMessage());
            }
        }
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        ValueWrapper existing = get(key);
        if (existing == null) {
            put(key, value);
            return null;
        }
        return existing;
    }

    @Override
    public void evict(Object key) {
        if (l1Cache != null) {
            l1Cache.evict(key);
        }
        if (l2Cache != null) {
            try {
                l2Cache.evict(key);
                log.trace("[L2 EVICT] Đã xóa key '{}' khỏi Redis cache '{}'", key, name);
            } catch (Exception e) {
                log.warn("[L2 REDIS ERROR] Lỗi khi xóa Redis key '{}': {}", key, e.getMessage());
            }
        }
    }

    @Override
    public void clear() {
        if (l1Cache != null) {
            l1Cache.clear();
        }
        if (l2Cache != null) {
            try {
                l2Cache.clear();
                log.trace("[L2 CLEAR] Đã xóa toàn bộ Redis cache '{}'", name);
            } catch (Exception e) {
                log.warn("[L2 REDIS ERROR] Lỗi khi xóa toàn bộ Redis cache '{}': {}", name, e.getMessage());
            }
        }
    }
}
