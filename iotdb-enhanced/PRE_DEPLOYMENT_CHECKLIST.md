# IoTDB Enhanced - 上线前检查清单

## 📋 检查清单概述

本文档提供了 IoTDB Enhanced 应用上线前的完整检查清单，确保应用安全、稳定地部署到生产环境。

**最后更新**: 2026-02-26
**当前版本**: v0.1.0

### 📚 相关文档

- [安全配置指南](docs/SECURITY_SETUP.md) - 完整的密码、SSL、防火墙配置说明
- [部署脚本](scripts/deploy-production.sh) - 一键生产环境部署
- [备份脚本](scripts/backup-db.sh) - 数据库自动备份
- [恢复脚本](scripts/restore-db.sh) - 数据库恢复

---

## 一、安全检查 (🔴 必须完成)

### 1.1 密钥和密码

- [x] **JWT_SECRET 已更新** - 已生成新的32字符密钥
- [x] **SESSION_SECRET 已更新** - 已生成新的32字符密钥
- [ ] **IoTDB 默认密码已更改** - 需要更改 root/root
  > 📖 详细步骤: [docs/SECURITY_SETUP.md](docs/SECURITY_SETUP.md)#14-更改-iotdb-密码
- [ ] **PostgreSQL 默认密码已更改** - 需要更改 iotdb_password
  > 📖 详细步骤: [docs/SECURITY_SETUP.md](docs/SECURITY_SETUP.md)#13-更改-postgresql-密码
- [ ] **所有密钥强度验证** - 至少32字符

### 🔧 密码更改快捷命令

```bash
# PostgreSQL 密码更改
sudo -u postgres psql -c "ALTER USER iotdb_user WITH PASSWORD 'new_password';"

# IoTDB 密码更改
/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/cli-cli.sh -h localhost -p 6667 -u root -pw root
# 在 CLI 中执行: SET PASSWORD TO new_password

# 更新 .env 后重启
pm2 restart iotdb-backend
```

### 1.2 环境变量配置

```bash
# 检查文件
backend/.env          # 后端环境变量
frontend/.env.local   # 前端环境变量

# 必需配置项
✅ DATABASE_URL       # PostgreSQL连接
✅ JWT_SECRET         # JWT密钥（已更新）
✅ SESSION_SECRET     # 会话密钥（已更新）
✅ REDIS_URL          # Redis连接
✅ CORS_ORIGIN        # 跨域配置
⚠️  IOTDB_USERNAME    # IoTDB用户（需要更改）
⚠️  IOTDB_PASSWORD    # IoTDB密码（需要更改）
```

### 1.3 网络安全

- [ ] **防火墙规则已配置**
  > 📖 详细步骤: [docs/SECURITY_SETUP.md](docs/SECURITY_SETUP.md)#三防火墙配置

  ```bash
  # 快速配置 UFW
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw --force enable
  sudo ufw status verbose
  ```

- [ ] **SSL/TLS 证书已配置** (生产环境)
  > 📖 详细步骤: [docs/SECURITY_SETUP.md](docs/SECURITY_SETUP.md)#二ssltls-配置

  ```bash
  # 使用 Let's Encrypt 获取免费证书
  sudo certbot --nginx -d your-domain.com

  # 或使用一键部署脚本
  ./scripts/deploy-production.sh your-domain.com admin@your-domain.com
  ```

- [ ] **CORS 配置正确** - 仅允许信任的域名
  ```env
  # backend/.env
  CORS_ORIGIN=https://your-domain.com
  ```

---

## 二、服务健康检查 (🔴 必须完成)

### 2.1 当前服务状态

| 服务 | 状态 | 端点 | 备注 |
|------|------|------|------|
| 后端 API | 🟢 运行中 | http://localhost:8000 | ✅ 正常 (PM2) |
| 前端应用 | 🟢 运行中 | http://localhost:3000 | ✅ 正常 (PM2) |
| PostgreSQL | 🟢 运行中 | localhost:5432 | ✅ 正常 |
| Redis | 🟢 运行中 | localhost:6379 | ✅ 正常 |
| IoTDB ConfigNode | 🟢 运行中 | localhost:10710 | ✅ 正常 |
| IoTDB DataNode | 🟢 运行中 | localhost:6667 | ✅ 正常 |
| IoTDB REST API | 🟢 运行中 | localhost:18080 | ✅ 正常 |

### 2.2 健康检查端点

```bash
# 基础健康检查
curl http://localhost:8000/health
# 预期: {"status":"ok","timestamp":"...","uptime":...}

# 就绪检查
curl http://localhost:8000/health/ready
# 预期: {"status":"ready","checks":{"database":true,...}}

# 存活检查
curl http://localhost:8000/health/live
# 预期: {"status":"alive","timestamp":"..."}
```

### 2.3 PM2 进程管理

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

---

## 三、数据库准备 (🔴 必须完成)

### 3.1 数据库迁移

- [x] **Prisma Client 已生成**
  ```bash
  cd backend && npx prisma generate
  ```

- [ ] **数据库迁移已应用** (需要数据库权限)
  ```bash
  cd backend
  npx prisma db push --accept-data-loss
  # 或生产环境
  npx prisma migrate deploy
  ```

### 3.2 备份配置

- [x] **备份脚本已创建** - `scripts/backup-db.sh`
- [x] **恢复脚本已创建** - `scripts/restore-db.sh`
- [x] **备份目录已创建** - `/var/backups/iotdb-enhanced`
- [ ] **自动备份已配置** - 添加到 crontab

```bash
# 配置每日自动备份（凌晨2点）
crontab -e
# 添加: 0 2 * * * /root/iotdb-enhanced/scripts/backup-db.sh
```

### 3.3 测试备份

- [x] **备份脚本测试通过** - 已成功运行
  ```bash
  /root/iotdb-enhanced/scripts/backup-db.sh
  ```

---

## 四、测试准备 (🟡 建议完成)

### 4.1 测试框架

- [x] **Jest 已配置** - `jest.config.js`
- [x] **测试设置文件已创建** - `src/__tests__/setup.ts`
- [x] **测试脚本已添加** - `package.json`

### 4.2 测试用例

- [x] **健康检查测试** - `src/__tests__/health.test.ts`
- [x] **认证工具测试** - `src/__tests__/auth.test.ts`
- [x] **输入验证测试** - `src/__tests__/validation.test.ts`

### 4.3 运行测试

```bash
cd backend

# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

---

## 五、容器化部署 (🟡 建议完成)

### 5.1 Docker 配置

- [x] **后端 Dockerfile** - `backend/Dockerfile`
- [x] **前端 Dockerfile** - `frontend/Dockerfile`
- [x] **Docker Compose** - `docker-compose.yml`

### 5.2 构建和测试

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 六、生产环境配置 (🟡 建议完成)

### 6.1 Nginx 反向代理

- [ ] **Nginx 配置文件** - `nginx/nginx.conf`
- [ ] **SSL 证书已配置**
- [ ] **安全头部已设置**

### 6.2 环境模式

- [ ] **NODE_ENV 设置为 production**
  ```env
  NODE_ENV=production
  ```

- [ ] **调试模式已禁用**
- [ ] **源映射已禁用** (生产构建)

### 6.3 监控配置

- [ ] **Prometheus 已配置**
- [ ] **Grafana 仪表板已设置**
- [ ] **告警规则已配置**

---

## 七、上线前最终检查

### 7.1 功能测试清单

**用户认证**
- [ ] 用户注册
- [ ] 用户登录
- [ ] 密码重置
- [ ] 登出功能

**数据管理**
- [ ] 创建数据集
- [ ] 删除数据集
- [ ] 添加时间序列
- [ ] 插入数据
- [ ] 查询数据
- [ ] 导出数据

**AI 功能**
- [ ] 时间序列预测
- [ ] 异常检测
- [ ] 查看模型列表

**告警功能**
- [ ] 创建告警规则
- [ ] 测试告警触发
- [ ] 查看告警历史

### 7.2 性能测试

```bash
# 使用 Apache Bench 进行压力测试
ab -n 1000 -c 10 http://localhost:8000/health
ab -n 5000 -c 50 http://localhost:8000/health

# 预期结果
# 响应时间 < 200ms
# 错误率 < 1%
```

### 7.3 安全测试

```bash
# SQL 注入测试
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin\" OR 1=1 --", "password": "test"}'

# 速率限制测试
for i in {1..100}; do curl http://localhost:8000/api/health; done
```

---

## 八、部署流程

### 8.1 预部署步骤

```bash
# 1. 备份当前数据库
/root/iotdb-enhanced/scripts/backup-db.sh

# 2. 停止服务
pm2 stop all

# 3. 更新代码
git pull origin main

# 4. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 5. 构建项目
cd backend && npm run build
cd ../frontend && npm run build

# 6. 数据库迁移
cd backend
npx prisma generate
npx prisma migrate deploy

# 7. 重启服务
pm2 restart all

# 8. 验证健康检查
curl http://localhost:8000/health
```

### 8.2 回滚计划

```bash
# 如果部署失败，执行回滚
pm2 stop all

# 恢复数据库
psql $DATABASE_URL < /var/backups/iotdb-enhanced/db_YYYYMMDD_HHMMSS.sql.gz

# 回退代码版本
git checkout HEAD~1

# 重新构建
cd backend && npm install && npm run build
cd frontend && npm install && npm run build

# 重启服务
pm2 restart all
```

---

## 九、上线后监控

### 9.1 关键指标

| 指标 | 目标值 | 告警阈值 |
|------|--------|----------|
| API 响应时间 | < 200ms | > 500ms |
| 错误率 | < 0.1% | > 1% |
| CPU 使用率 | < 70% | > 85% |
| 内存使用率 | < 80% | > 90% |
| 数据库连接 | 正常 | 失败 |

### 9.2 日志监控

```bash
# PM2 日志
pm2 logs

# 错误日志
tail -f /root/.pm2/logs/backend-error.log

# 系统日志
journalctl -u pm2-root -f
```

---

## 十、完成状态总览

### ✅ 已完成项目

- [x] 安全密钥更新（JWT_SECRET, SESSION_SECRET）
- [x] Redis 服务启动并验证
- [x] PostgreSQL 服务运行中
- [x] 数据库备份脚本创建并测试
- [x] Docker 配置文件创建
- [x] 服务健康状态验证
- [x] **IoTDB 服务启动和配置** (ConfigNode, DataNode, REST API)
- [x] **PM2 进程管理配置** (Backend, Frontend)
- [x] **前端路由修复** (所有页面正常工作)
- [x] **数据库架构简化** (移除 Organization, MFA 等功能)
- [x] **功能测试验证** (认证, 数据集, AI 模型)
- [x] **所有前端路由验证** (11 个页面全部正常)

### ⚠️ 待完成项目（上线前必须）

- [ ] **更改默认密码（IoTDB root/root, PostgreSQL）**
- [ ] **配置 SSL/TLS 证书**（生产环境）
- [ ] **配置防火墙规则**（生产环境）

### 🟢 可选项目（建议完成）

- [ ] 运行完整测试套件
- [ ] 配置自动备份计划任务
- [ ] 设置监控告警
- [ ] 配置 Nginx 反向代理
- [ ] 性能压力测试

---

## 十一、快速命令参考

```bash
# 服务管理
pm2 start|stop|restart|status|logs
pm2 save
pm2 startup

# 数据库备份
/root/iotdb-enhanced/scripts/backup-db.sh

# 数据库恢复
/root/iotdb-enhanced/scripts/restore-db.sh <backup_file>

# 健康检查
curl http://localhost:8000/health
curl http://localhost:8000/health/ready
curl http://localhost:8000/health/live

# Redis 状态
redis-cli ping
redis-cli info stats

# PostgreSQL 状态
pg_isready -h localhost -U iotdb_user

# 测试
cd backend && npm test
```

---

**检查清单状态**: 🟢 核心完成（所有服务和功能正常运行）

**最新更新**: 2026-02-26 23:00
- ✅ IoTDB 所有服务已启动 (ConfigNode, DataNode, REST API)
- ✅ PM2 进程管理已配置
- ✅ 前端路由已修复，所有页面正常访问
- ✅ 数据库架构简化完成（移除 Organization, MFA）
- ✅ 功能测试通过（认证, 数据集, AI 模型, IoTDB 状态）

**建议**: 在生产环境部署前，请确保所有 "待完成项目" 已全部完成。
