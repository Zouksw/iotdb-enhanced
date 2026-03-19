import { redis } from './dist/lib/redis.js';
import { recordFailedLogin, checkAccountLockout } from './dist/services/authLockout.js';

const redisClient = await redis();

// Test: 4 attempts
const testId = `debug-test-${Date.now()}`;
console.log('Test ID:', testId);

for (let i = 0; i < 4; i++) {
  await recordFailedLogin(testId, '127.0.0.1');
  console.log(`Attempt ${i+1} recorded`);
}

const info = await checkAccountLockout(testId);
console.log('Result:', JSON.stringify(info, null, 2));

const attemptsKey = `auth:attempts:${testId}`;
const lockoutKey = `auth:lockout:${testId}`;
const attemptsValue = await redisClient.get(attemptsKey);
const lockoutTTL = await redisClient.ttl(lockoutKey);

console.log('Redis state:');
console.log('  attemptsKey value:', attemptsValue);
console.log('  lockoutKey TTL:', lockoutTTL);

// Cleanup
await redisClient.del([attemptsKey, lockoutKey]);
await redisClient.quit();

process.exit(0);
