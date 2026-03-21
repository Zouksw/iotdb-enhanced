# Cache Decorator Guide

## Overview

The `cacheRoute` decorator eliminates boilerplate cache code from Express routes. Instead of manually calling `cache.get()`, checking for null, and calling `cache.set()`, you can add caching with a single line of middleware.

## Basic Usage

### Simple Caching

```typescript
import { cacheRoute } from '@/middleware/cacheDecorator';

// Cache for 60 seconds
router.get('/datasets', cacheRoute('datasets:list', 60), async (req, res) => {
  const datasets = await prisma.dataset.findMany();
  res.json(datasets);
});
```

### Custom TTL (Time To Live)

```typescript
// Cache for 5 minutes (300 seconds)
router.get('/datasets', cacheRoute('datasets:list', 300), handler);

// Cache for 1 hour (3600 seconds)
router.get('/stats', cacheRoute('stats:overview', 3600), handler);
```

### Custom Key Generator

```typescript
// Vary cache by query parameter
router.get('/search',
  cacheRoute('search', 60, {
    keyGenerator: (req) => req.query.q as string
  }),
  async (req, res) => {
    const results = await search(req.query.q);
    res.json(results);
  }
);
```

### User-Specific Caching

```typescript
// Each user gets their own cache
router.get('/my-datasets',
  cacheRoute('datasets:my', 300, { varyByUser: true }),
  async (req, res) => {
    const datasets = await prisma.dataset.findMany({
      where: { ownerId: req.user.id }
    });
    res.json(datasets);
  }
);
```

## Cache Invalidation

When data changes, invalidate the related cache:

```typescript
import { invalidateCache } from '@/middleware/cacheDecorator';

// After creating a dataset
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const dataset = await createDataset(req.body);
  invalidateCache('datasets:*'); // Clear all dataset caches
  res.status(201).json(dataset);
}));

// After updating a dataset
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const dataset = await updateDataset(req.params.id, req.body);
  invalidateCache('datasets:*');
  res.json(dataset);
}));

// After deleting a dataset
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  await deleteDataset(req.params.id);
  invalidateCache('datasets:*');
  res.json({ success: true });
}));
```

## How It Works

The decorator:

1. **Generates a cache key** from the key prefix, path, query parameters, and optional user context
2. **Checks Redis** for a cached response
3. **On cache HIT**: Returns the cached response immediately (sets `X-Cache: HIT` header)
4. **On cache MISS**: Calls your route handler, caches the response, then returns it (sets `X-Cache: MISS` header)
5. **Only caches GET requests** with 2xx status codes
6. **Records metrics** for cache hits/misses (10% sampling for performance)

## Cache Key Format

```
{keyPrefix}:{path}:{query_string}:user:{userId}
```

Examples:
- `datasets:list:/api/datasets` - Basic list
- `datasets:list:/api/datasets:search=test` - With search query
- `datasets:list:/api/datasets:user:123` - User-specific
- `datasets:search:/api/search:temperature` - Custom key

## Best Practices

### DO:
- Use caching for read-heavy, write-light endpoints
- Choose appropriate TTLs based on data change frequency
- Invalidate cache after mutations (POST/PATCH/DELETE)
- Use specific key prefixes for different data types
- Consider user-specific caching for personalized data

### DON'T:
- Cache POST/PUT/DELETE requests (decorator skips these automatically)
- Cache sensitive data without proper authentication
- Use very long TTLs for frequently-changing data
- Forget to invalidate cache after data changes

## Migration Guide

### Before (Manual Caching)

```typescript
router.get('/datasets', asyncHandler(async (req, res) => {
  const cacheKey = `datasets:list:${JSON.stringify(req.query)}`;

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Fetch data
  const datasets = await prisma.dataset.findMany();

  // Set cache
  await cache.set(cacheKey, datasets, 300);

  res.json(datasets);
}));
```

### After (With Decorator)

```typescript
router.get('/datasets',
  cacheRoute('datasets:list', 300, {
    keyGenerator: (req) => JSON.stringify(req.query)
  }),
  asyncHandler(async (req, res) => {
    const datasets = await prisma.dataset.findMany();
    res.json(datasets);
  })
);
```

## Advanced Examples

### Paginated Lists

```typescript
router.get('/datasets',
  cacheRoute('datasets:list', 60, {
    keyGenerator: (req) => `page:${req.query.page}:limit:${req.query.limit}`
  }),
  async (req, res) => {
    const { page, limit } = req.query;
    const datasets = await prisma.dataset.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    res.json(datasets);
  }
);
```

### Search Results

```typescript
router.get('/search',
  cacheRoute('datasets:search', 120, {
    keyGenerator: (req) => {
      const params = new URLSearchParams(req.query as any);
      return `query:${params.toString()}`;
    }
  }),
  async (req, res) => {
    const results = await searchDatasets(req.query);
    res.json(results);
  }
);
```

### Time-Series Data

```typescript
router.get('/timeseries/:id/data',
  cacheRoute('timeseries:data', 30, {
    keyGenerator: (req) => {
      const { id } = req.params;
      const { from, to, limit } = req.query;
      return `${id}:${from}:${to}:${limit}`;
    }
  }),
  async (req, res) => {
    const data = await getTimeseriesData(req.params.id, req.query);
    res.json(data);
  }
);
```

## Testing

The decorator includes comprehensive tests. Run them with:

```bash
npm test middleware/__tests__/cacheDecorator.test.ts
```

## Performance

- **Cache HIT**: ~1-2ms (Redis lookup)
- **Cache MISS**: Route handler time + ~1ms (Redis write)
- **Overhead**: Negligible (< 0.5ms for middleware logic)

Typical cache hit rates:
- Public datasets: 60-80%
- User-specific data: 40-60%
- Search results: 20-40%

## Troubleshooting

### Cache not working?
1. Check Redis is running: `redis-cli ping`
2. Verify you're using GET method (POST/PATCH/DELETE are not cached)
3. Check response is 2xx status (errors are not cached)
4. Look for `X-Cache` header in response

### Stale cache?
1. Invalidate after mutations: `invalidateCache('pattern:*')`
2. Reduce TTL for frequently-changing data
3. Check for missing cache invalidation in POST/PATCH/DELETE handlers

### High memory usage?
1. Reduce TTL values
2. Use more specific cache keys
3. Consider cache warming instead of caching everything
4. Monitor Redis memory: `redis-cli INFO memory`

## See Also

- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/caching/)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Express Middleware Guide](https://expressjs.com/en/guide/writing-middleware.html)
