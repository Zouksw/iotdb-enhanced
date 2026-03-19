const { createClient } = require('redis');

async function debugTest() {
  const client = createClient({ url: 'redis://localhost:6379' });
  await client.connect();
  
  const testId = `debug-test-${Date.now()}`;
  console.log('Test ID:', testId);
  
  const attemptsKey = `auth:attempts:${testId}`;
  const lockoutKey = `auth:lockout:${testId}`;
  
  // Simulate 4 failed attempts
  console.log('\n--- Simulating 4 failed attempts ---');
  for (let i = 1; i <= 4; i++) {
    const attempts = await client.incr(attemptsKey);
    console.log(`Attempt ${i}: attempts = ${attempts}`);
    
    if (i === 1) {
      await client.expire(attemptsKey, 900); // 15 minutes
    }
  }
  
  // Check TTL
  const attemptsTTL = await client.ttl(attemptsKey);
  const lockoutTTL = await client.ttl(lockoutKey);
  
  console.log(`\nAfter 4 attempts:`);
  console.log(`  attemptsKey TTL: ${attemptsTTL}`);
  console.log(`  lockoutKey TTL: ${lockoutTTL}`);
  console.log(`  lockoutKey exists: ${await client.exists(lockoutKey)}`);
  
  // Check the values
  const attemptsValue = await client.get(attemptsKey);
  const lockoutValue = await client.get(lockoutKey);
  console.log(`  attemptsKey value: ${attemptsValue}`);
  console.log(`  lockoutKey value: ${lockoutValue}`);
  
  // Cleanup
  await client.del([attemptsKey, lockoutKey]);
  console.log('\nCleaned up');
  
  await client.quit();
}

debugTest().catch(console.error);
