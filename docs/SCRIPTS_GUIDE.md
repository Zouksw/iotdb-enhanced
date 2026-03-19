---
title: "脚本使用指南"
en_title: "Script Usage Guide"
version: "1.0.0"
last_updated: "2026-03-10"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "DevOps Engineer"
  - "System Administrator"
tags:
  - "scripts"
  - "operations"
  - "automation"
target_audience: "运维工程师、系统管理员、开发者"
related_docs:
  - "脚本索引": "SCRIPTS_INDEX.md"
  - "部署指南": "DEPLOYMENT.md"
  - "运行模式": "RUNNING_MODES.md"
changes:
  - version: "1.0.0"
    date: "2026-03-10"
    author: "IoTDB Enhanced Team"
    changes: "Added YAML metadata header"
next_review: "2026-09-10"
approval:
  status: "approved"
  reviewed_by: "DevOps Engineer"
  approved_date: "2026-03-10"
---

# IoTDB Enhanced - 服务控制脚本指南

## 脚本概览

项目包含三个主要的控制脚本：

### 1. `start.sh` - 启动所有服务
```bash
./start.sh
```

**功能：**
- 启动 IoTDB (DataNode + ConfigNode + REST API)
- 启动 AI Node (端口 10810)
- 检查并启动 PostgreSQL 和 Redis
- 使用 PM2 启动后端 (开发模式，端口 8000)
- 使用 PM2 启动前端 (开发模式，端口 3000)
- 保存 PM2 配置以便重启后自动恢复

**超时保护：**
- IoTDB 启动超时: 60秒
- AI Node 启动超时: 40秒
- 超时后自动跳过，继续启动其他服务

**自动检测：**
- 自动检测 IoTDB 和 AI Node 安装路径
- 如果目录不存在，跳过相应服务并显示警告

### 2. `stop.sh` - 停止所有服务
```bash
./stop.sh
```

**功能：**
- 停止 PM2 管理的所有服务 (后端 + 前端)
- 停止 AI Node
- 停止 IoTDB (优雅关闭，30秒后强制结束)
- 验证端口释放状态
- 清除 PM2 配置 (防止重启后自动启动)

**保留服务：**
- PostgreSQL 和 Redis 默认保留 (数据持久化)
- 需要停止它们可取消注释脚本中的相关部分

### 3. `check.sh` - 快速状态检查
```bash
./check.sh
```

**检查项：**
- PostgreSQL 和 Redis 进程状态
- IoTDB DataNode, ConfigNode, AI Node 端口监听状态
- PM2 管理的后端和前端服务状态
- 显示访问 URL

## 使用场景

### 开发环境启动
```bash
# 1. 启动所有服务
./start.sh

# 2. 检查状态
./check.sh

# 3. 查看日志
pm2 logs iotdb-backend
pm2 logs iotdb-frontend
```

### 开发环境停止
```bash
# 1. 停止所有服务
./stop.sh

# 2. 确认已停止
./check.sh
```

### 只重启应用服务 (保留 IoTDB)
```bash
# 仅重启 PM2 服务
pm2 restart all

# 或分别重启
pm2 restart iotdb-backend
pm2 restart iotdb-frontend
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| IoTDB DataNode | 6667 | RPC 服务 |
| IoTDB ConfigNode | 10710 | 配置服务 |
| AI Node | 10810 | AI 预测服务 |
| IoTDB REST API | 18080 | REST 接口 |
| Backend API | 8000 | 后端 API |
| Frontend | 3000 | Web 前端 |

## 故障排查

### 后端无法启动
```bash
# 检查日志
pm2 logs iotdb-backend --err

# 常见问题：
# 1. NODE_ENV=production 导致安全检查失败
#    解决: start.sh 已设置为 development 模式
# 2. IoTDB 未连接
#    解决: 后端会在 IoTDB 不可用时降级运行
```

### 前端无法启动
```bash
# 检查日志
pm2 logs iotdb-frontend

# 常见问题：
# 1. 端口 3000 被占用
#    解决: lsof -ti:3000 | xargs kill -9
# 2. 依赖未安装
#    解决: cd frontend && npm install
```

### IoTDB 无法启动
```bash
# 检查日志
cat /tmp/iotdb.log

# 常见问题：
# 1. 进程残留
#    解决: pkill -9 -f iotdb
# 2. 端口冲突
#    解决: lsof -ti:6667 | xargs kill -9
```

### AI Node 无法启动
```bash
# 检查日志
cat /tmp/ainode.log

# 常见问题：
# 1. IoTDB 未运行 (AI Node 依赖 IoTDB)
# 2. 重复注册
#    解决: start.sh 会自动移除冲突的节点
```

## PM2 常用命令

```bash
# 查看状态
pm2 list

# 查看日志
pm2 logs              # 所有日志
pm2 logs iotdb-backend  # 指定服务

# 重启服务
pm2 restart all
pm2 restart iotdb-backend

# 停止服务
pm2 stop all
pm2 stop iotdb-backend

# 删除服务
pm2 delete all

# 保存配置 (重启后自动恢复)
pm2 save

# 清除配置
pm2 save --force
pm2 flush

# 监控面板
pm2 monit
```

## AI 功能测试

AI 功能需要：
1. ADMIN 用户角色
2. 后端服务运行
3. (可选) IoTDB AI Node 运行用于实际预测

```bash
# 测试 AI 模型列表 API
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:8000/api/iotdb/ai/models
```

## 目录结构

```
iotdb-enhanced/
├── start.sh              # 主启动脚本
├── stop.sh               # 主停止脚本
├── check.sh              # 快速状态检查
├── status.sh             # 详细状态脚本 (原版)
└── scripts/
    └── check-services.sh # 备用检查脚本
```
