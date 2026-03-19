# 后续部署配置指南

**更新日期**: 2026-03-04
**适用版本**: IoTDB Enhanced v1.0+

---

## 📋 已完成的改进

### Phase 1 - 基础设施 (1周内)

#### 1. ✅ 测试框架 (169 个测试)
- **状态**: 9 个测试套件全部通过
- **覆盖率**: 0% → 目标 60% (进行中)
- **运行方式**: `npm test`

#### 2. ✅ Sentry 错误追踪
- **文件**: `backend/src/lib/sentry.ts`
- **依赖**: @sentry/node, @sentry/profiling-node
- **功能**: 错误追踪、性能监控、会话重放

#### 3. ✅ 自动备份脚本
- **文件**: `scripts/auto-backup.sh`
- **功能**: PostgreSQL、配置文件、IoTDB 元数据备份
- **S3上传**: 可选

#### 4. ✅ 日志轮转配置
- **文件**: `scripts/logrotate-iotdb-enhanced`
- **功能**: 防止磁盘填满

### Phase 2 - 性能和自动化 (1-2个月)

#### 5. ✅ 数据库优化脚本
- **文件**: `scripts/optimize-database.sh`
- **功能**:
  - VACUUM ANALYZE
  - 索引创建和验证
  - 查询性能分析
  - 自动清理过期数据
- **运行方式**: `./scripts/optimize-database.sh`

#### 6. ✅ Redis 连接池
- **文件**: `backend/src/lib/redisPool.ts`
- **功能**:
  - 自动重连
  - 连接池管理
  - 健康检查
  - 性能统计

#### 7. ✅ API 响应缓存
- **文件**: `backend/src/middleware/apiCache.ts`
- **功能**:
  - Redis 缓存存储
  - TTL 配置
  - 智能缓存键生成
  - 缓存统计

#### 8. ✅ CI/CD 管道
- **文件**: `.github/workflows/ci.yml`
- **功能**:
  - 自动化测试
  - 安全扫描
  - Docker 镜像构建
  - 自动部署
  - 失败自动回滚

#### 9. ✅ 零停机部署
- **文件**: `scripts/deploy-zero-downtime.sh`
- **功能**:
  - 蓝绿部署
  - 健康检查
  - 自动流量切换
  - 失败回滚

#### 10. ✅ 性能监控
- **文件**: `backend/src/lib/performanceMonitor.ts`, `scripts/monitoring.sh`
- **功能**:
  - 请求/响应时间跟踪
  - 系统资源监控
  - 自定义指标收集
  - 告警通知

---

## 🚀 Phase 2 配置步骤

### 第 6 步: 设置数据库优化

```bash
# 添加到 crontab - 每周日凌晨 3 点运行
0 3 * * 0 /root/iotdb-enhanced/scripts/optimize-database.sh >> /var/log/iotdb-enhanced/database-optimization.log 2>&1

# 手动运行优化
./scripts/optimize-database.sh --dry-run  # 预览
./scripts/optimize-database.sh            # 执行
```

### 第 7 步: 启用性能监控

```bash
# 启动监控守护进程
./scripts/monitoring.sh --daemon --interval 60

# 查看监控状态
./scripts/monitoring.sh --status

# 运行一次性检查
./scripts/monitoring.sh --once
```

### 第 8 步: 配置 API 缓存

在 `backend/src/server-with-docs.ts` 中添加：

```typescript
import { apiCache, apiCacheLong } from './middleware/apiCache';

// 为只读路由启用缓存
app.use('/api/timeseries', apiCache);
app.use('/api/datasets', apiCacheLong);
```

### 第 9 步: 配置 CI/CD

1. 添加 GitHub Secrets:
   - `DEPLOY_HOST` - 服务器地址
   - `DEPLOY_USER` - SSH 用户名
   - `DEPLOY_SSH_KEY` - SSH 私钥
   - `SENTRY_DSN` - Sentry DSN
   - `SLACK_WEBHOOK` - Slack 通知 URL (可选)

2. 推送代码到 GitHub，CI/CD 将自动运行

### 第 10 步: 健康检查

```bash
# 部署后运行健康检查
./scripts/health-check.sh --verbose

# 设置自定义超时
./scripts/health-check.sh --timeout 120
```

---

## 🚀 部署步骤 (Phase 1 回顾)

### 第 1 步: 配置环境变量

在服务器上添加以下环境变量到 `.env.production`:

```bash
# Sentry 错误追踪（推荐）
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<commit-sha-or-version>

# 备份配置
BACKUP_DIR=/var/backups/iotdb-enhanced
BACKUP_RETENTION_DAYS=7

# S3 备份（可选）
S3_BUCKET=your-backup-bucket
S3_PREFIX=iotdb-enhanced/backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Telegram 通知（可选）
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 第 2 步: 安装日志轮转配置

```bash
# 复制日志轮转配置
sudo cp scripts/logrotate-iotdb-enhanced /etc/logrotate.d/iotdb-enhanced

# 测试配置
sudo logrotate -d /etc/logrotate.d -f -v /etc/logrotate-iotdb-enhanced

# 确保日志目录存在
sudo mkdir -p /var/log/iotdb-enhanced
sudo chown www-data:www-data /var/log/iotdb-enhanced
```

### 第 3 步: 设置自动备份 cron 任务

```bash
# 编辑 crontab
crontab -e

# 添加以下行：
# 每天凌晨 2 点自动备份
0 2 * * * /root/iotdb-enhanced/scripts/auto-backup.sh >> /var/log/iotdb-enhanced/backup.log 2>&1

# 每周日凌晨 3 点清理日志
0 3 * * 0 /usr/sbin/logrotate -f /etc/logrotate.d/iotdb-enhanced >/dev/null 2>&1
```

### 第 4 步: 初始化 Sentry

在 `backend/src/server-with-docs.ts` 中添加：

```typescript
import { initSentry } from './lib/sentry';

// 在服务器启动前初始化 Sentry
initSentry();
```

### 第 5 步: 验证配置

```bash
# 运行测试
cd backend && npm test

# 测试备份脚本（干运行）
/root/iotdb-enhanced/scripts/auto-backup.sh --dry-run

# 检查日志轮转配置
sudo logrotate -d /etc/logrotate.d -f -v /etc/logrotate-iotdb-enhanced
```

---

## 🧪 运行测试

### 后端测试
```bash
cd /root/iotdb-enhanced/backend

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式（开发时）
npm run test:watch
```

### 预期结果
```
Test Suites: 9 passed, 9 total
Tests:       169 passed, 169 total
Snapshots:   0 total
Time:        ~2s
```

---

## 📊 监控和告警

### Sentry Dashboard 设置

1. 登录 Sentry.io
2. 创建新项目
3. 获取 DSN
4. 配置告警规则：
   - 错误率 > 1%
   - 响应时间 > 2s
   - 新错误出现

### Telegram 通知设置（可选）

1. 创建 Telegram Bot (@BotFather)
2. 获取 Bot Token
3. 创建聊天组并添加 Bot
4. 获取 Chat ID
5. 设置环境变量 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`

---

## 🔧 运维脚本

### 手动备份
```bash
# 立即备份
/root/iotdb-enhanced/scripts/auto-backup.sh

# 完整备份（包括 IoTDB）
/root/iotdb-enhanced/scripts/auto-backup.sh --full

# 仅备份配置
/root/iotdb-enhanced/scripts/auto-backup.sh --quiet
```

### 恢复备份
```bash
# 恢复 PostgreSQL
gunzip -c /var/backups/iotdb-enhanced/postgresql/db_YYYYMMDD_HHMMSS.sql.gz | psql -U postgres

# 恢复配置
tar xzf /var/backups/iotdb-enhanced/config/config_YYYYMMDD_HHMMSS.tar.gz -C /root/iotdb-enhanced
```

### 日志查看
```bash
# 应用日志
tail -f /var/log/iotdb-enhanced/combined.log

# 错误日志
tail -f /var/log/iotdb-enhanced/error.log

# 备份日志
tail -f /var/log/iotdb-enhanced/backup.log
```

---

## 📈 性能优化建议

### 数据库优化

```sql
-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 定期清理过期数据
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM sessions WHERE expires_at < NOW();
```

### Redis 优化

```bash
# 检查 Redis 内存使用
redis-cli INFO memory

# 清理过期键
redis-cli --scan --pattern "csrf:*" | xargs redis-cli DEL
```

---

## 🔄 CI/CD 更新

在 `.github/workflows/deploy.yml` 中添加测试步骤：

```yaml
- name: Run tests
  run: |
    cd backend
    npm test
    npm run test:coverage
```

---

## ✅ 验证清单

部署后验证以下功能：

- [ ] **测试运行**: `npm test` - 169 个测试通过
- [ ] **Sentry 初始化**: 检查 Sentry 仪表板
- [ ] **备份执行**: 手动运行一次备份脚本
- [ ] **日志轮转**: 检查日志目录大小是否稳定
- [ ] **cron 任务**: 检查 cron 日志确认备份自动运行

---

## 🆘 故障排查

### 备份失败
```bash
# 检查日志
tail -50 /var/log/iotdb-enhanced/backup.log

# 手动测试
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h localhost -U postgres iotdb_enhanced | gzip > test.sql.gz
```

### Sentry 不发送错误
```bash
# 检查环境变量
echo $SENTRY_DSN

# 查看 Sentry 日志
journalctl -u iotdb-backend -f | grep -i sentry
```

### 日志轮转不工作
```bash
# 调试 logrotate
sudo logrotate -d /etc/logrotate.d -f -v /etc/logrotate.d/iotdb-enhanced

# 手动运行日志轮转
sudo logrotate -f /etc/logrotate.d/iotdb-enhanced
```

---

## 📞 支持

如有问题，请检查：
1. 日志文件：`/var/log/iotdb-enhanced/`
2. 备份日志：`/var/log/iotdb-enhanced/backup.log`
3. Sentry Dashboard
4. GitHub Issues: https://github.com/your-org/iotdb-enhanced/issues
