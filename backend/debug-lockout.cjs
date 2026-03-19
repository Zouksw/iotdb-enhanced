/**
 * Debug Auth Lockout - CommonJS version
 */

const { redis } = require('./dist/lib/redis');
const { recordFailedLogin, checkAccountLockout } = require('./dist/services/authLockout');

async function runDebugTests() {
  console.log('=== Initializing Redis ===');
  await redis();
  const redisClient = await redis();

  // Test 1: 0 attempts
  console.log('\n=== TEST 1: 0 attempts ===');
  const testId1 = `debug-zero-${Date.now()}`;

  const info1 = await checkAccountLockout(testId1);
  console.log('Result:', JSON.stringify(info1, null, 2));

  const attemptsKey1 = `auth:attempts:${testId1}`;
  const lockoutKey1 = `auth:lockout:${testId1}`;
  const attemptsValue1 = await redisClient.get(attemptsKey1);
  const lockoutTTL1 = await redisClient.ttl(lockoutKey1);

  console.log('Redis state:');
  console.log('  attemptsKey value:', attemptsValue1);
  console.log('  lockoutKey TTL:', lockoutTTL1);

  await redisClient.del([attemptsKey1, lockoutKey1]);

  // Test 2: 4 attempts
  console.log('\n=== TEST 2: 4 attempts ===');
  const testId2 = `debug-four-${Date.now()}`;

  for (let i = 0; i < 4; i++) {
    await recordFailedLogin(testId2, '127.0.0.1');
    console.log(`Attempt ${i+1} recorded`);
  }

  const info2 = await checkAccountLockout(testId2);
  console.log('Result:', JSON.stringify(info2, null, 2));

  const attemptsKey2 = `auth:attempts:${testId2}`;
  const lockoutKey2 = `auth:lockout:${testId2}`;
  const attemptsValue2 = await redisClient.get(attemptsKey2);
  const lockoutTTL2 = await redisClient.ttl(lockoutKey2);

  console.log('Redis state:');
  console.log('  attemptsKey value:', attemptsValue2);
  console.log('  lockoutKey TTL:', lockoutTTL2);

  await redisClient.del([attemptsKey2, lockoutKey2]);

  // Test 3: Clear attempts
  console.log('\n=== TEST 3: Clear attempts ===');
  const testId3 = `debug-clear-${Date.now()}`;

  // Lock first
  for (let i = 0; i < 5; i++) {
    await recordFailedLogin(testId3, '127.0.0.1');
  }

  let info3 = await checkAccountLockout(testId3);
  console.log('After 5 attempts (locked):', JSON.stringify(info3, null, 2));

  const { clearFailedLoginAttempts } = require('./dist/services/authLockout');
  await clearFailedLoginAttempts(testId3);
  await redisClient.del(`auth:lockout:${testId3}`);
  console.log('Cleared attempts and lockout key');

  info3 = await checkAccountLockout(testId3);
  console.log('After clear:', JSON.stringify(info3, null, 2));

  const attemptsKey3 = `auth:attempts:${testId3}`;
  const lockoutTTL3 = await redisClient.ttl(`auth:lockout:${testId3}`);
  console.log('Redis state after clear:');
  console.log('  attemptsKey value:', await redisClient.get(attemptsKey3));
  console.log('  lockoutKey TTL:', lockoutTTL3);

  await redisClient.del([
    `auth:attempts:${testId3}`,
    `auth:lockout:${testId3}`
  ]);

  console.log('\n=== All debug tests complete ===');
  await redisClient.quit();
  process.exit(0);
}

runDebugTests().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
