import Redis from "ioredis";

let redis = null;
let isRedisAvailable = false;

/**
 * Connects to Redis. If connection fails, the app continues without caching.
 * @returns {Promise<Redis|null>}
 */
export async function connectRedis() {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  return new Promise((resolve) => {
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            console.warn("⚠️  Redis: Max retries reached. Running without cache.");
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      redis.on("error", (err) => {
        if (isRedisAvailable) {
          console.error("❌ Redis connection lost:", err.message);
          isRedisAvailable = false;
        }
      });

      redis.on("connect", () => {
        console.log("✅ Redis connected successfully");
        isRedisAvailable = true;
      });

      redis.on("close", () => {
        isRedisAvailable = false;
      });

      redis
        .connect()
        .then(() => {
          isRedisAvailable = true;
          resolve(redis);
        })
        .catch((err) => {
          console.warn(
            `⚠️  Redis unavailable (${err.message}). Running without cache.`
          );
          isRedisAvailable = false;
          resolve(null);
        });
    } catch (err) {
      console.warn(`⚠️  Redis init error: ${err.message}. Running without cache.`);
      isRedisAvailable = false;
      resolve(null);
    }
  });
}

/**
 * Get cached value by key. Returns parsed JSON or null.
 */
export async function getCache(key) {
  if (!isRedisAvailable || !redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis GET error for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Set cache with a TTL in seconds.
 */
export async function setCache(key, data, ttlSeconds = 60) {
  if (!isRedisAvailable || !redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error(`Redis SET error for key "${key}":`, err.message);
  }
}

/**
 * Delete a specific cache key.
 */
export async function delCache(key) {
  if (!isRedisAvailable || !redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Redis DEL error for key "${key}":`, err.message);
  }
}

/**
 * Delete all keys matching a pattern (e.g., "equipment:*").
 * Uses SCAN for safety (no KEYS in production).
 */
export async function delCachePattern(pattern) {
  if (!isRedisAvailable || !redis) return;
  try {
    let cursor = "0";
    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    console.error(`Redis DEL pattern error for "${pattern}":`, err.message);
  }
}

/**
 * Returns the raw Redis client instance (for advanced use).
 */
export function getRedisClient() {
  return redis;
}

/**
 * Returns whether Redis is currently connected and available.
 */
export function isRedisConnected() {
  return isRedisAvailable;
}
