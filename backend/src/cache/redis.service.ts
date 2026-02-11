import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  // Generic get method
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      // Silently fail - return null if cache is unavailable
      return null;
    }
  }

  // Generic set method
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      // Silently fail - caching is not critical
    }
  }

  // Delete specific key
  async del(key: string): Promise<void> {
    try {
      // Check if store exists and has del method
      const store = (this.cacheManager as any).store;
      if (store && typeof store.del === 'function') {
        await store.del(key);
      } else if (typeof this.cacheManager.del === 'function') {
        await this.cacheManager.del(key);
      }
      // If neither method exists, silently skip - cache invalidation is not critical
    } catch (error) {
      // Silently fail - cache invalidation is not critical
      // Don't log to avoid cluttering console
    }
  }

  // Clear all cache
  async reset(): Promise<void> {
    try {
      if (typeof (this.cacheManager as any).clear === 'function') {
        await (this.cacheManager as any).clear();
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Leaderboard specific caching
  async getLeaderboard(key: string) {
    return await this.get(key);
  }

  async setLeaderboard(key: string, data: any, ttl = 300) {
    // 5 minutes for leaderboards
    await this.set(key, data, ttl);
  }

  // Club data caching
  async getClubData(clubId: string) {
    return await this.get(`club:${clubId}`);
  }

  async setClubData(clubId: string, data: any, ttl = 600) {
    // 10 minutes for club data
    await this.set(`club:${clubId}`, data, ttl);
  }

  async invalidateClubCache(clubId: string) {
    await this.del(`club:${clubId}`);
  }

  // Quiz caching
  async getQuizData(quizId: string) {
    return await this.get(`quiz:${quizId}`);
  }

  async setQuizData(quizId: string, data: any, ttl = 1800) {
    // 30 minutes for quiz data
    await this.set(`quiz:${quizId}`, data, ttl);
  }

  // User session caching
  async getUserSession(userId: string) {
    return await this.get(`session:${userId}`);
  }

  async setUserSession(userId: string, data: any, ttl = 3600) {
    // 1 hour for sessions
    await this.set(`session:${userId}`, data, ttl);
  }

  async clearUserSession(userId: string) {
    await this.del(`session:${userId}`);
  }
}


