import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Servicio de Redis con fallback a memoria
 * Proporciona operaciones de cache, pub/sub, y rate limiting
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryCache = new Map<string, CacheEntry<string>>();
  private readonly isRedisEnabled: boolean;

  constructor(private readonly redis: Redis | null) {
    this.isRedisEnabled = redis !== null;

    if (!this.isRedisEnabled) {
      this.logger.log('Running with in-memory cache fallback');
      // Limpieza periódica del cache en memoria
      setInterval(() => this.cleanExpiredMemoryEntries(), 60000);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Obtiene un valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisEnabled && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }

      // Fallback a memoria
      const entry = this.memoryCache.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }

      return JSON.parse(entry.value);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Guarda un valor en el cache
   * @param key Clave
   * @param value Valor a guardar
   * @param ttlSeconds TTL en segundos (default: 1 hora)
   */
  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (this.isRedisEnabled && this.redis) {
        await this.redis.setex(key, ttlSeconds, serialized);
        return;
      }

      // Fallback a memoria
      this.memoryCache.set(key, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  /**
   * Elimina un valor del cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.isRedisEnabled && this.redis) {
        await this.redis.del(key);
        return;
      }

      this.memoryCache.delete(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  /**
   * Elimina valores que coincidan con un patrón
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (this.isRedisEnabled && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      }

      // Fallback a memoria - convertir patrón glob a regex
      const regex = new RegExp(
        pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      );
      let count = 0;

      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          count++;
        }
      }

      return count;
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Verifica si una clave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisEnabled && this.redis) {
        return (await this.redis.exists(key)) === 1;
      }

      const entry = this.memoryCache.get(key);
      if (!entry) return false;

      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Incrementa un contador
   */
  async incr(key: string): Promise<number> {
    try {
      if (this.isRedisEnabled && this.redis) {
        return await this.redis.incr(key);
      }

      // Fallback a memoria
      const entry = this.memoryCache.get(key);
      const currentValue = entry ? parseInt(entry.value, 10) || 0 : 0;
      const newValue = currentValue + 1;

      this.memoryCache.set(key, {
        value: String(newValue),
        expiresAt: entry?.expiresAt || Date.now() + 3600000,
      });

      return newValue;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Establece expiración en una clave
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      if (this.isRedisEnabled && this.redis) {
        await this.redis.expire(key, seconds);
        return;
      }

      // Fallback a memoria
      const entry = this.memoryCache.get(key);
      if (entry) {
        entry.expiresAt = Date.now() + seconds * 1000;
      }
    } catch (error) {
      this.logger.error(`Error setting expire on key ${key}:`, error);
    }
  }

  /**
   * Rate limiting - verifica si se puede proceder
   * @param key Clave identificadora (ej: "ratelimit:user:123")
   * @param limit Número máximo de requests
   * @param windowSeconds Ventana de tiempo en segundos
   */
  async isRateLimited(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ limited: boolean; remaining: number; resetIn: number }> {
    try {
      const fullKey = `ratelimit:${key}`;

      if (this.isRedisEnabled && this.redis) {
        const multi = this.redis.multi();
        multi.incr(fullKey);
        multi.ttl(fullKey);

        const results = await multi.exec();
        const count = results?.[0]?.[1] as number;
        let ttl = results?.[1]?.[1] as number;

        // Si es nuevo, establecer expiración
        if (ttl === -1) {
          await this.redis.expire(fullKey, windowSeconds);
          ttl = windowSeconds;
        }

        return {
          limited: count > limit,
          remaining: Math.max(0, limit - count),
          resetIn: ttl,
        };
      }

      // Fallback a memoria
      const count = await this.incr(fullKey);
      if (count === 1) {
        await this.expire(fullKey, windowSeconds);
      }

      const entry = this.memoryCache.get(fullKey);
      const resetIn = entry
        ? Math.ceil((entry.expiresAt - Date.now()) / 1000)
        : windowSeconds;

      return {
        limited: count > limit,
        remaining: Math.max(0, limit - count),
        resetIn,
      };
    } catch (error) {
      this.logger.error(`Error checking rate limit for ${key}:`, error);
      return { limited: false, remaining: limit, resetIn: windowSeconds };
    }
  }

  /**
   * Cache-aside pattern helper
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 3600,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Obtiene estadísticas del cache
   */
  async getStats(): Promise<{
    isRedisEnabled: boolean;
    memoryCacheSize: number;
    redisInfo?: Record<string, string>;
  }> {
    const stats: any = {
      isRedisEnabled: this.isRedisEnabled,
      memoryCacheSize: this.memoryCache.size,
    };

    if (this.isRedisEnabled && this.redis) {
      try {
        const info = await this.redis.info('memory');
        const lines = info.split('\r\n');
        stats.redisInfo = {};

        for (const line of lines) {
          const [key, value] = line.split(':');
          if (key && value) {
            stats.redisInfo[key] = value;
          }
        }
      } catch (error) {
        this.logger.error('Error getting Redis info:', error);
      }
    }

    return stats;
  }

  /**
   * Limpia el cache
   */
  async flush(): Promise<void> {
    try {
      if (this.isRedisEnabled && this.redis) {
        await this.redis.flushdb();
        this.logger.log('Redis database flushed');
        return;
      }

      this.memoryCache.clear();
      this.logger.log('Memory cache cleared');
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
    }
  }

  /**
   * Limpia entradas expiradas del cache en memoria
   */
  private cleanExpiredMemoryEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired memory cache entries`);
    }
  }
}
