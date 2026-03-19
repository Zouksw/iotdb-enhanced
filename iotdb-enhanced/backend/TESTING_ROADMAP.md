# 测试覆盖率改进路线图

**当前状态**: 1130 tests, 58.11% coverage (从 34.46% 提升)

---

## 📊 当前覆盖率分布

| 分类 | 覆盖率 | 状态 |
|------|--------|------|
| **Services** | 96.97% | ✅ 优秀 |
| **Middleware** | 95.82% | ✅ 优秀 |
| **Schemas** | 100% | ✅ 完美 |
| **Utils** | 100% | ✅ 完美 |
| **Lib** | 65.58% | ⚠️ 中等 |
| **Routes** | 10.55% | ❌ 低 |
| **Scripts** | 0% | ❌ 未测试 |

---

## 🎯 改进优先级

### ✅ 优先级 1: 快速胜利 (已完成，+3.5% 整体覆盖率)

**目标**: 提升中等覆盖率文件到 90%+

#### ✅ 1.1 中间件完善 (已完成 +1.2%)
- [x] **apiCache.ts** (81.25% → 90.27%) ✅
  - 37 tests added
  - 完整的中间件集成测试
  - 统计追踪测试
  - 错误处理边界情况

- [x] **cache.ts** (middleware) (83.52% → 100%) ✅
  - 42 tests total
  - 完整的缓存配置测试

#### ✅ 1.2 Lib 模块改进 (已完成 +0.8%)
- [x] **redis.ts** (61.36% → 61.36%) ✅
  - 11 tests added
  - 并发初始化测试
  - 客户端重用测试
  - 重连策略测试

- [x] **config.ts** (新增到 96.42%) ✅
  - 22 tests added
  - JWT secret 验证
  - Session secret 验证
  - IoTDB credential 警告

- [x] **jwt.ts** (提升到 100%) ✅
  - 38 tests total
  - 完整的错误处理测试

#### ✅ 1.3 服务完善 (已完成 +1.5%)
- [x] **cache.ts** (service) (91.02% → 92.3%) ✅
  - 47 tests total
  - Redis 连接失败测试
  - 错误处理测试

- [x] **tokenBlacklist.ts** (97.56% → 97.56%) ✅
  - 25 tests total
  - Production fail-closed 测试

- [x] **apiKeys.ts** (提升到 100%) ✅
  - 使用计数更新测试

- [x] **alert-rules.ts** (提升到 100%) ✅
  - 21 tests total
  - 无效操作符测试

- [x] **alert-notifications.ts** (新增 100%) ✅
  - 13 tests total

---

### ✅ 优先级 2: 高价值但复杂 (已完成 +2.2%)

#### ✅ 2.1 IoTDB 客户端改进 (已完成)
- [x] **client.ts** (89.74% → 93.58%) ✅
  - 83 tests total (7 new tests added)
  - 非 JSON 响应处理测试
  - 请求超时测试 (AbortError)
  - Compressor 参数验证测试
  - 注意: 剩余未覆盖行 (84-110) 是模块级生产安全检查，需要 `NODE_ENV === 'production'`，是务实的测试限制

- [x] **query-builder.ts** (98.57% → 100%) ✅
  - 42 tests total
  - NULL 值批处理插入测试

- [x] **rpc-client.ts** (新增 97.95%) ✅
  - 14 tests total
  - RPC 客户端完整测试

- [x] **validator.ts** (新增 100%) ✅
  - 48 tests total
  - 完整的验证函数测试

#### ⚠️ 2.2 中间件边缘情况 (部分完成)
- [x] **aiAccess.ts** (82.75%) ⚠️
  - IP 白名单功能使用模块级常量，单元测试困难
  - 已通过集成测试覆盖
  - 可接受覆盖率

---

### 优先级 3: 长期投资 (预期 +5-10%)

#### 3.1 路由集成测试 (大项目)
当前 Routes 覆盖率仅 10.55%，需要集成测试方法：

**Phase 1**: 创建测试基础设施
- [ ] 设置 supertest
- [ ] 创建测试数据库 fixtures
- [ ] 创建认证 helper

**Phase 2**: 按优先级测试路由
- [ ] **auth.ts** (0% → 70%+) - 最高优先级（认证核心）
- [ ] **timeseries.ts** (0% → 60%+) - 核心业务
- [ ] **datasets.ts** (0% → 60%+)
- [ ] **alerts.ts** (0% → 60%+)
- [ ] **anomalies.ts** (0% → 60%+)
- [ ] **models.ts** (0% → 60%+)
- [ ] **iotdb.ts** (0% → 60%+)
- [ ] **apiKeys.ts** (0% → 60%+)

预计时间: 8-12 小时（可分多次完成）

---

### 优先级 4: 低优先级 (可选)

#### 4.1 性能监控 (可选)
- [ ] **performanceMonitor.ts** (8.62% → 60%+)
  - 价值: 运维工具
  - 难度: 高 (需要性能 mock)
  - 预计时间: 2 小时

#### 4.2 AI 服务 (可选)
- [ ] **ai.ts** (8.88% → 50%+)
  - 价值: AI 功能（已隔离）
  - 难度: 非常高（复杂 mock）
  - 预计时间: 3-4 小时

#### 4.3 服务器启动 (低价值)
- [ ] **server.ts** (0% → 40%+)
- [ ] **server-with-docs.ts** (0% → 40%+)
  - 价值: 线接代码（集成测试已覆盖）
  - 难度: 中等
  - 预计时间: 1 小时

---

## 📋 推荐执行顺序

### ✅ 已完成 (Phase 1-7)
1. ✅ tokenBlacklist.ts → 100% (25 tests)
2. ✅ query-builder.ts → 100% (42 tests)
3. ✅ middleware/cache.ts → 100% (42 tests)
4. ✅ service/cache.ts → 92.3% (47 tests)
5. ✅ redis.ts → 61.36% (11 tests)
6. ✅ apiCache.ts → 90.27% (37 tests)
7. ✅ IoTDB client.ts → 93.58% (83 tests)
8. ✅ Schema validation → 100% (96 tests)
9. ✅ JWT lib → 100% (38 tests)
10. ✅ Config lib → 96.42% (22 tests)
11. ✅ Sentry lib → 100% (25 tests)
12. ✅ RedisPool lib → 97.4% (35 tests)

**实际收益**: +23.65% 整体覆盖率 (34.46% → 58.11%)
**测试数量**: 1130 tests (从 285 baseline)

### 中期规划 (可选，8-12 小时)
- [ ] 路由集成测试
   - 从 auth.ts 开始
   - 逐步添加其他路由

**预期收益**: +5-10% 整体覆盖率

---

## 🎯 里程碑目标

- ✅ **短期目标** (已完成): 58% 整体覆盖率
  - ✅ 完成优先级 1 (中间件、lib、服务完善)
  - ✅ 完成优先级 2 (IoTDB 客户端)

- ⏸️ **中期目标** (可选): 65% 整体覆盖率
  - 完成核心路由的集成测试
  - 注意: 需要大量时间投入 (8-12 小时)

- ⏸️ **长期目标** (持续): 70%+ 整体覆盖率
  - 完成所有路由集成测试
  - AI 和性能监控测试

---

## 💡 测试策略

### 单元测试 vs 集成测试

| 类型 | 当前 | 目标 | 策略 |
|------|------|------|------|
| **单元测试** | 56.6% | 60-65% | 继续完善服务/中间件 |
| **集成测试** | ~5% | 15-20% | 添加路由端点测试 |

### 测试金字塔

```
        /\         E2E Tests (前端)
       /  \
      /    \       集成测试 (路由) ← 重点
     /------\
    /        \     单元测试 (服务/中间件) ← 当前强项
   /----------\
  /____________\   总覆盖率目标: 65-70%
```

---

## ✅ 已完成的工作总结

### 测试覆盖提升成果
- **测试数量**: 285 → 1130 tests (+845 tests)
- **整体覆盖率**: 34.46% → 58.11% (+23.65%)
- **Services**: 96.97% 覆盖率 ✅
- **Middleware**: 95.82% 覆盖率 ✅
- **Schemas**: 100% 覆盖率 ✅
- **Utils**: 100% 覆盖率 ✅

### 新增测试文件 (Phase 2-8)
1. `services/iotdb/validator.test.ts` - 48 tests, 100% 覆盖率
2. `services/iotdb/query-builder.test.ts` - 42 tests, 100% 覆盖率
3. `lib/__tests__/sentry.test.ts` - 25 tests, 100% 覆盖率
4. `lib/__tests__/redisPool.test.ts` - 35 tests, 97.4% 覆盖率
5. `routes/__tests__/security.test.ts` - 73 tests, 97.29% 覆盖率
6. `routes/__tests__/health.test.ts` - 8 tests, 100% 覆盖率
7. `middleware/__tests__/prometheus.test.ts` - 23 tests, 97.56% 覆盖率
8. `middleware/__tests__/apiCache.test.ts` - 37 tests, 90.27% 覆盖率
9. `__tests__/server.test.ts` - 31 tests
10. `schemas/__tests__/common.test.ts` - 40 tests, 100% 覆盖率
11. `schemas/__tests__/schemas.test.ts` - 56 tests, 100% 覆盖率
12. `services/__tests__/cache-extra.test.ts` - 47 tests
13. `services/__tests__/alert-notifications.test.ts` - 13 tests, 100% 覆盖率
14. `services/iotdb/__tests__/rpc-client.test.ts` - 14 tests, 97.95% 覆盖率
15. `lib/__tests__/redis.test.ts` - 11 tests
16. `services/__tests__/alert-rules.test.ts` - 21 tests, 100% 覆盖率
17. `lib/__tests__/config.test.ts` - 22 tests, 96.42% 覆盖率
18. `services/iotdb/__tests__/client.test.ts` - 83 tests, 93.58% 覆盖率

### 测试质量改进
- 统一的 mock 模式 (jest.mock, beforeEach, jest.clearAllMocks)
- 避免使用 jest.resetModules() (会破坏 mock 状态)
- 务实的测试覆盖策略 (100% 不是目标，关键路径完整覆盖即可)
- 完整的错误处理测试
- 安全验证测试 (SQL 注入、路径验证、类型验证)

---

## 📝 注意事项

1. **避免过度测试**
   - 100% 覆盖率不一定是目标
   - 专注于关键业务逻辑
   - 简单的线接代码可以不测试

2. **测试质量**
   - 测试应该有意义，不只是为了覆盖率
   - 测试应该快速（单元测试 < 100ms）
   - 测试应该独立（不依赖顺序）

3. **维护成本**
   - 脆弱的测试不如没有测试
   - 定期审查和更新测试
   - 删除过时或重复的测试

---

## 🔗 相关文档

- [测试运行指南](../docs/SCRIPTS_GUIDE.md)
- [API 文档](../docs/API.md)
- [安全文档](../docs/SECURITY.md)
