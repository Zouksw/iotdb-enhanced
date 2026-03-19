# IoTDB Enhanced - 脚本索引

## 项目脚本概览

项目包含 **11 个脚本**，按功能分为三大类：

### 📍 根目录脚本 (3个)
日常使用的核心脚本

### 🛠️ 维护脚本 (8个)
位于 `scripts/` 目录，用于运维和维护

---

## 核心脚本 (根目录)

### 1. `start.sh` - 启动所有服务
```bash
./start.sh
```

**功能：**
- 检查并启动 IoTDB (DataNode + ConfigNode + REST API)
- 检查并启动 AI Node
- 检查 PostgreSQL 和 Redis
- 使用 PM2 启动后端 (开发模式)
- 使用 PM2 启动前端 (开发模式)
- 保存 PM2 配置以便重启后自动恢复

**特点：**
- 超时保护 (IoTDB 60s, AI Node 40s)
- 自动路径检测
- 服务降级运行 (IoTDB/AI Node 可选)

**相关文档：** [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md)

---

### 2. `stop.sh` - 停止所有服务
```bash
./stop.sh
```

**功能：**
- 停止 PM2 管理的服务 (后端 + 前端)
- 停止 AI Node
- 停止 IoTDB
- 验证端口释放
- 清除 PM2 配置

**特点：**
- 优雅关闭 (30秒超时)
- 强制清理保护
- PostgreSQL 和 Redis 默认保留

---

### 3. `check.sh` - 快速状态检查
```bash
./check.sh
```

**功能：**
- 检查数据库服务状态
- 检查 IoTDB 各组件端口
- 检查 PM2 应用服务
- 显示访问 URL

**输出示例：**
```
✓ PostgreSQL
✓ Redis
✗ IoTDB DataNode
✓ Backend (PM2, port 8000)
✓ Frontend (PM2, port 3000)
```

---

## 维护脚本 (scripts/)

### 1. `health-check.sh` - 综合健康检查
```bash
./scripts/health-check.sh [--verbose] [--timeout N] [--no-color]
```

**功能：**
- 后端健康端点检查
- 前端可访问性检查
- 数据库连接检查 (PostgreSQL, Redis, IoTDB)
- 系统资源检查 (磁盘, 内存, CPU)
- 带重试机制和超时控制

**用途：**
- 部署后验证
- CI/CD 集成
- 定期健康检查
- 返回适当的退出码 (0=成功, 1=失败)

**参数：**
- `--verbose` - 详细输出
- `--timeout N` - 超时秒数 (默认60)
- `--no-color` - 禁用彩色输出

---

### 2. `user-management.sh` - 用户管理
```bash
./scripts/user-management.sh
```

**功能：**
- 创建新用户
- 列出所有用户
- 修改用户角色
- 重置用户密码
- 删除用户

**交互式菜单驱动**

---

### 3. `auto-backup.sh` - 自动备份
```bash
./scripts/auto-backup.sh
```

**功能：**
- 备份 PostgreSQL 数据库
- 备份 IoTDB 数据
- 保留最近 N 天的备份
- 自动清理过期备份

**配置：**
- 备份保留天数
- 备份存储路径

---

### 4. `migrate-db.sh` - 数据库迁移
```bash
./scripts/migrate-db.sh [environment]
```

**功能：**
- 执行 Prisma 数据库迁移
- 环境指定 (development/staging/production)
- 迁移前备份
- 迁移回滚支持

**环境参数：**
- `development` - 开发环境
- `staging` - 预发布环境
- `production` - 生产环境

---

### 5. `optimize-database.sh` - 数据库优化
```bash
./scripts/optimize-database.sh
```

**功能：**
- 分析 PostgreSQL 查询性能
- 更新表统计信息
- 清理过期数据
- 重建索引
- 优化表结构

**优化项目：**
- VACUUM ANALYZE
- 重建碎片化索引
- 清理死元组

---

### 6. `deploy-zero-downtime.sh` - 零停机部署
```bash
./scripts/deploy-zero-downtime.sh
```

**功能：**
- 滚动更新部署
- 零停机切换
- 蓝绿部署
- 自动回滚机制
- 健康检查验证

**部署流程：**
1. 拉取最新代码
2. 构建新版本
3. 启动新版本实例
4. 健康检查验证
5. 切换流量到新版本
6. 关闭旧版本实例

---

### 7. `rollback.sh` - 回滚部署
```bash
./scripts/rollback.sh
```

**功能：**
- 回滚到上一个版本
- 快速恢复服务
- 数据库迁移回滚
- 配置回滚

**安全特性：**
- 部署前自动备份
- 回滚前验证
- 回滚失败恢复

---

### 8. `monitoring.sh` - 监控告警
```bash
./scripts/monitoring.sh
```

**功能：**
- 实时监控服务状态
- 资源使用监控
- 异常检测告警
- 日志收集分析
- 性能指标报告

**监控指标：**
- CPU/内存使用率
- 请求响应时间
- 错误率
- 数据库连接数

---

## 脚本使用场景

### 日常开发
```bash
./start.sh          # 启动开发环境
./check.sh          # 检查服务状态
./stop.sh           # 停止服务
```

### 部署上线
```bash
./scripts/health-check.sh --verbose      # 部署后健康检查
./scripts/deploy-zero-downtime.sh       # 零停机部署
./scripts/rollback.sh                    # 回滚(如果需要)
```

### 运维维护
```bash
./scripts/user-management.sh             # 用户管理
./scripts/auto-backup.sh                # 数据备份
./scripts/optimize-database.sh          # 性能优化
./scripts/migrate-db.sh production       # 数据库迁移
```

### 监控诊断
```bash
./check.sh                              # 快速状态
./scripts/health-check.sh               # 全面检查
./scripts/monitoring.sh                 # 实时监控
```

---

## 脚本依赖关系

```
start.sh
  ├─ 启动 IoTDB
  ├─ 启动 AI Node (依赖 IoTDB)
  ├─ 启动 PostgreSQL
  ├─ 启动 Redis
  ├─ 启动 Backend (依赖 PostgreSQL, Redis, IoTDB)
  └─ 启动 Frontend

stop.sh
  ├─ 停止 PM2 服务
  ├─ 停止 AI Node
  └─ 停止 IoTDB

health-check.sh
  ├─ 检查 Backend
  ├─ 检查 Frontend
  ├─ 检查 PostgreSQL
  ├─ 检查 Redis
  ├─ 检查 IoTDB
  └─ 系统资源检查

deploy-zero-downtime.sh
  ├─ 构建项目
  ├─ 健康检查
  ├─ 滚动部署
  └─ rollback.sh (回滚支持)
```

---

## 最佳实践

1. **开发环境**
   - 使用 `start.sh` 启动所有服务
   - 使用 `check.sh` 验证状态
   - 完成工作后使用 `stop.sh` 停止

2. **部署前**
   - 运行 `health-check.sh` 验证当前状态
   - 运行 `auto-backup.sh` 备份数据
   - 运行 `migrate-db.sh` 执行迁移

3. **部署时**
   - 使用 `deploy-zero-downtime.sh` 零停机部署
   - 部署后运行 `health-check.sh` 验证

4. **定期维护**
   - 每日 `auto-backup.sh` 自动备份
   - 每周 `optimize-database.sh` 优化数据库
   - 持续 `monitoring.sh` 监控服务

---

## 故障排查

### 脚本执行权限
```bash
chmod +x /root/iotdb-enhanced/*.sh
chmod +x /root/iotdb-enhanced/scripts/*.sh
```

### 脚本执行失败
```bash
# 检查脚本语法
bash -n /root/iotdb-enhanced/start.sh

# 以调试模式运行
bash -x /root/iotdb-enhanced/start.sh
```

### PM2 相关问题
```bash
pm2 list                  # 查看进程状态
pm2 logs                  # 查看日志
pm2 flush                 # 清空日志
pm2 save                  # 保存配置
```

---

## 更新日志

- **2024-03-04** - 清理冗余脚本，从 14 个减少到 11 个
  - 删除 `status.sh` (与 check.sh 功能重复)
  - 删除 `scripts/check-services.sh` (与 check.sh 功能重复)
  - 删除 `frontend/start-dev.sh` (start.sh 已包含)
  - 保留 `health-check.sh` (更高级的健康检查，用于部署验证)

---

## 快速参考

| 需求 | 使用脚本 |
|------|----------|
| 启动服务 | `./start.sh` |
| 停止服务 | `./stop.sh` |
| 检查状态 | `./check.sh` |
| 健康检查 | `./scripts/health-check.sh` |
| 用户管理 | `./scripts/user-management.sh` |
| 数据备份 | `./scripts/auto-backup.sh` |
| 数据迁移 | `./scripts/migrate-db.sh` |
| 性能优化 | `./scripts/optimize-database.sh` |
| 部署上线 | `./scripts/deploy-zero-downtime.sh` |
| 回滚 | `./scripts/rollback.sh` |
| 监控告警 | `./scripts/monitoring.sh` |
