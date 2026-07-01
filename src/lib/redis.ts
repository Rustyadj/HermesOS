import Redis from "ioredis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    redis.on("error", () => { /* suppress — Redis is optional */ });
  }
  return redis;
}

export async function redisGet(key: string): Promise<string | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    return await client.get(key);
  } catch { return null; }
}

export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch { /* ignore */ }
}

export async function redisDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(key);
  } catch { /* ignore */ }
}

export async function redisKeys(pattern: string): Promise<string[]> {
  try {
    const client = getRedis();
    if (!client) return [];
    return await client.keys(pattern);
  } catch { return []; }
}
