import Redis from 'ioredis-mock';

let mockRedis: Redis | null = null;

/**
 * Creates a mock Redis client using ioredis-mock.
 * Returns the same instance if already created.
 */
export function createMockRedis(): Redis {
  if (!mockRedis) {
    mockRedis = new Redis();
  }
  return mockRedis;
}

/**
 * Clears all data in the mock Redis instance.
 * Call this in beforeEach() to isolate test cases.
 */
export async function clearMockRedis(): Promise<void> {
  if (mockRedis) {
    await mockRedis.flushall();
  }
}

/**
 * Resets the mock Redis instance entirely.
 * Call this in afterAll() for cleanup.
 */
export function resetMockRedis(): void {
  if (mockRedis) {
    mockRedis.disconnect();
    mockRedis = null;
  }
}

/**
 * Sets up jest mock for the Redis client module.
 * Call this at the top of test files that need mocked Redis.
 */
export function setupRedisMock(): void {
  jest.mock('@infrastructure/redis/client', () => ({
    getRedisClient: () => createMockRedis(),
    redisClient: createMockRedis(),
  }));
}

/**
 * Helper to manually set a value in mock Redis.
 * Useful for setting up test preconditions.
 */
export async function setMockRedisValue(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const redis = createMockRedis();
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, value);
  } else {
    await redis.set(key, value);
  }
}

/**
 * Helper to get a value from mock Redis.
 * Useful for asserting test outcomes.
 */
export async function getMockRedisValue(key: string): Promise<string | null> {
  const redis = createMockRedis();
  return redis.get(key);
}
