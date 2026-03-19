---
title: "IoTDB Enhanced 使用指南"
en_title: "IoTDB Enhanced User Guide"
version: "1.0.0"
last_updated: "2026-03-03"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "Technical Writer"
  - "Product Manager"
tags:
  - "guide"
  - "user-guide"
  - "tutorial"
  - "getting-started"
target_audience: "最终用户、开发者、运维工程师"
related_docs:
  - "部署指南": "DEPLOYMENT.md"
  - "安全配置": "SECURITY.md"
  - "API 参考": "API.md"
  - "文档规范": "DOCUMENTATION_METADATA.md"
changes:
  - version: "1.0.0"
    date: "2026-03-03"
    author: "IoTDB Enhanced Team"
    changes: "初始版本 - 整合使用指南和快速参考"
next_review: "2026-06-03"
approval:
  status: "approved"
  reviewed_by: "Product Manager"
  approved_date: "2026-03-03"
---

# IoTDB Enhanced 使用指南

本文档提供了 IoTDB Enhanced 平台的完整使用指南，包括项目概述、快速开始、服务管理、核心功能使用、故障排查和最佳实践。

---

## 目录

1. [项目概述](#项目概述)
2. [快速开始](#快速开始)
3. [服务管理](#服务管理)
4. [核心功能](#核心功能)
5. [管理命令](#管理命令)
6. [开发指南](#开发指南)
7. [故障排查](#故障排查)
8. [最佳实践](#最佳实践)

---

## 项目概述

### 什么是 IoTDB Enhanced

IoTDB Enhanced Platform 是基于 Apache IoTDB 2.0.5 + AI Node 的增强型时序数据库平台，提供完整的时序数据存储、查询和 AI 预测分析功能。

### 核心特性

| 特性 | 说明 |
|------|------|
| **时序数据库** | Apache IoTDB 2.0.5 高性能存储 |
| **AI 集成** | 内置 AI Node，支持 7 种预测算法 |
| **RESTful API** | 完整的 REST API 接口 |
| **Web 界面** | 现代化的管理界面 |
| **多租户支持** | 用户认证与授权 |
| **告警系统** | 多通道告警通知 |

### 技术栈

**后端**:
- Node.js + Express + TypeScript
- PostgreSQL + Redis
- Apache IoTDB 2.0.5 + AI Node
- JWT 认证

**前端**:
- Next.js 14 + React 19
- Ant Design 组件库
- React Context + Hooks

**基础设施**:
- Docker + Docker Compose
- Nginx 反向代理
- PM2 进程管理

---

## 快速开始

### 前置要求

- Docker 和 Docker Compose（推荐方式）
- 或 Node.js 18+、PostgreSQL 14+、Redis 6+（手动部署）

### 一键启动（Docker）

```bash
# 1. 克隆项目
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

# 2. 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. 启动所有服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps
```

### 手动启动

```bash
# 1. 启动所有服务
./start.sh

# 2. 查看状态
./status.sh

# 3. 停止服务
./stop.sh
```

### 访问地址

启动成功后，可通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost:3000 | Web 管理界面 |
| 后端 API | http://localhost:8000 | RESTful API |
| API 文档 | http://localhost:8000/api-docs | Swagger 文档 |
| IoTDB REST | http://localhost:18080 | IoTDB 原生 API |

### 首次登录

默认管理员账户：
- 邮箱: `admin@example.com`
- 密码: `admin123`

**重要**: 生产环境请立即修改默认密码！

---

## 服务管理

### 启动脚本

项目提供统一的服务管理脚本：

#### start.sh - 启动所有服务

```bash
./start.sh
```

功能：
- 按顺序启动 IoTDB、后端、前端
- 自动检测和等待服务就绪
- 显示启动进度和状态

#### stop.sh - 停止所有服务

```bash
./stop.sh
```

功能：
- 安全停止所有服务
- 验证端口释放
- 清理临时文件

#### status.sh - 查看服务状态

```bash
./status.sh
```

显示内容：
- 服务运行状态
- 端口占用情况
- 进程信息
- 健康检查结果

### PM2 进程管理

生产环境使用 PM2 管理进程：

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs
pm2 logs iotdb-backend --lines 100

# 重启服务
pm2 restart all
pm2 restart iotdb-backend

# 停止服务
pm2 stop all

# 监控面板
pm2 monit
```

### 单独管理 IoTDB

```bash
# 单独启动 IoTDB
./scripts/start-iotdb.sh

# 单独停止 IoTDB
./scripts/stop-iotdb.sh

# 检查 IoTDB 状态
./scripts/check-iotdb.sh
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| IoTDB ConfigNode | 10710 | 配置服务 |
| IoTDB DataNode | 6667 | 数据服务 |
| AI Node | 10810 | AI 服务 |
| IoTDB REST API | 18080 | REST 接口 |
| Backend API | 8000 | 后端服务 |
| Frontend | 3000 | 前端应用 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

---

## 核心功能

### 时序数据管理

#### 创建时间序列

```bash
curl -X POST http://localhost:8000/api/iotdb/timeseries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "path": "root.sg1.device1.sensor",
    "dataType": "DOUBLE",
    "encoding": "GORILLA"
  }'
```

#### 插入数据

```bash
curl -X POST http://localhost:8000/api/iotdb/insert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "records": [
      {
        "device": "root.sg1.device1",
        "timestamp": 1708774800000,
        "measurements": ["sensor1", "sensor2"],
        "values": [25.5, 30.2]
      }
    ]
  }'
```

#### 查询数据

```bash
curl -X POST http://localhost:8000/api/iotdb/sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sql": "SELECT * FROM root.sg1.device1 LIMIT 10"
  }'
```

### AI 分析功能

#### 支持的 AI 算法

| 算法 | 类型 | 说明 | 最小数据点 |
|------|------|------|-----------|
| `arima` | ML | ARIMA 自回归移动平均 | 10 |
| `timer_xl` | DL | LSTM 长短期记忆网络 | 96 |
| `sundial` | DL | Transformer 模型 | 96 |
| `holtwinters` | ML | Holt-Winters 三次指数平滑 | 10 |
| `exponential_smoothing` | ML | 指数平滑 | 10 |
| `naive_forecaster` | ML | 朴素预测 | 10 |
| `stl_forecaster` | ML | STL 分解预测 | 10 |

#### 时序预测

```bash
curl -X POST http://localhost:8000/api/iotdb/ai/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "timeseries": "root.test1",
    "horizon": 5,
    "algorithm": "arima"
  }'
```

响应示例：

```json
{
  "success": true,
  "data": {
    "timestamps": [1708774810000, 1708774820000, ...],
    "values": [25.0, 25.5, ...],
    "algorithm": "arima",
    "metrics": {
      "mse": 0.25,
      "mae": 0.4
    }
  }
}
```

#### 异常检测

```bash
curl -X POST http://localhost:8000/api/iotdb/ai/anomalies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "timeseries": "root.test2",
    "threshold": 2.5
  }'
```

### 告警系统

#### 创建告警规则

```bash
curl -X POST http://localhost:8000/api/alerts/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "高温告警",
    "timeseries": "root.test1",
    "condition": "value > 30",
    "severity": "high",
    "channels": ["email", "webhook"]
  }'
```

#### 查询告警

```bash
curl -X GET "http://localhost:8000/api/alerts?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 数据集管理

#### 创建数据集

```bash
curl -X POST http://localhost:8000/api/datasets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "传感器数据集",
    "description": "测试数据集",
    "timeseries": "root.test1"
  }'
```

#### 获取数据集列表

```bash
curl -X GET "http://localhost:8000/api/datasets?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 用户管理

#### 注册新用户

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "User Name"
  }'
```

#### 用户登录

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### 获取当前用户信息

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 管理命令

### 数据库管理

```bash
# 备份数据库
./scripts/backup-db.sh

# 恢复数据库
./scripts/restore-db.sh

# 健康检查
./scripts/health-check.sh
```

### 用户管理

```bash
# 创建管理员用户
./scripts/user-management.sh create-admin

# 修改用户密码
./scripts/user-management.sh change-password

# 列出所有用户
./scripts/user-management.sh list-users
```

### 部署相关

```bash
# 生产环境部署
./scripts/deploy-production.sh

# 运行测试套件
./scripts/test-suite.sh

# AI 功能完整测试
./scripts/test-ai-complete.sh
```

---

## 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行测试并覆盖
npm run test:coverage
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行 E2E 测试
npm run test:e2e
```

### 项目结构

```
iotdb-enhanced/
├── backend/               # 后端服务
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── middleware/   # 中间件
│   │   ├── lib/         # 工具库
│   │   └── config/      # 配置文件
│   ├── prisma/          # 数据库模型
│   └── tests/           # 测试文件
│
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── app/        # 页面组件
│   │   ├── components/ # 可复用组件
│   │   ├── lib/       # 工具库
│   │   └── providers/ # 状态管理
│   └── tests/         # 测试文件
│
├── scripts/            # 管理脚本
├── docs/              # 项目文档
├── nginx/             # Nginx 配置
└── docker-compose.yml # Docker 编排
```

---

## 故障排查

### 常见问题

#### 服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep -E "(6667|10710|10810|8000|3000|5432|6379)"

# 检查日志
tail -f /tmp/backend.log
tail -f /tmp/frontend.log

# 重启服务
./stop.sh
./start.sh
```

#### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U iotdb_user -d iotdb_enhanced

# 检查环境变量
cat backend/.env | grep DATABASE_URL

# 重新创建数据库
docker-compose down -v
docker-compose up -d
```

#### IoTDB 连接失败

```bash
# 检查 IoTDB 状态
./status.sh

# 重启 IoTDB
cd /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
./sbin/stop-datanode.sh
./sbin/start-standalone.sh

# 测试连接
curl http://localhost:18080/rest/v1/version
```

#### AI 预测失败

```bash
# 检查 AI Node 状态
nc -zv localhost 10810

# 检查数据点数量（深度学习模型需要 >= 96 个点）
curl -X POST http://localhost:8000/api/iotdb/sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"sql": "SELECT count(*) FROM root.test1"}'

# 查看后端日志
pm2 logs iotdb-backend --err
```

### 日志位置

| 服务 | 日志位置 |
|------|---------|
| Backend | `~/.pm2/logs/iotdb-backend-*` |
| Frontend | `~/.pm2/logs/iotdb-frontend-*` |
| IoTDB | `/opt/iotdb-ainode/logs/` |
| Nginx | `/var/log/nginx/` |
| PostgreSQL | `/var/log/postgresql/` |

---

## 最佳实践

### 数据模型设计

1. **合理命名时间序列**
   ```
   root.设备组.设备.传感器
   root.production.line1.machine1.temperature
   ```

2. **选择合适的数据类型**
   - 数值数据: DOUBLE 或 FLOAT
   - 整数: INT32 或 INT64
   - 状态/布尔: BOOLEAN
   - 文本: TEXT

3. **选择合适的编码方式**
   - 浮点数: GORILLA（高压缩比）
   - 整数: RLE（游程编码）
   - 文本: DICTIONARY（字典编码）

### AI 算法选择

| 场景 | 推荐算法 | 原因 |
|------|---------|------|
| 短期预测 | arima | 快速、准确 |
| 长期依赖 | timer_xl | LSTM 擅长长期模式 |
| 复杂模式 | sundial | Transformer 擅长复杂模式 |
| 季节性数据 | holtwinters | 适合季节性 |
| 基准测试 | naive_forecaster | 简单基准 |

### 性能优化

1. **批量插入数据**
   ```javascript
   // 推荐批量插入
   const records = [];
   for (let i = 0; i < 1000; i++) {
     records.push({
       device: "root.sg1.device1",
       timestamp: Date.now() + i * 1000,
       measurements: ["sensor1"],
       values: [Math.random()]
     });
   }
   await insertBatch(records);
   ```

2. **使用连接池**
   - 配置合适的连接池大小
   - 复用数据库连接

3. **启用缓存**
   - 使用 Redis 缓存热点数据
   - 配置合理的缓存过期时间

### 安全建议

1. **定期更新密码**（每 3-6 个月）
2. **使用强密码策略**（至少 16 字符）
3. **启用 HTTPS**（生产环境必须）
4. **配置防火墙**（仅开放必要端口）
5. **定期备份数据**（每日自动备份）
6. **监控异常活动**（日志分析和告警）

---

## 相关文档

- [部署指南](DEPLOYMENT.md) - 生产环境部署
- [安全配置](SECURITY.md) - 安全加固指南
- [API 参考](API.md) - 完整 API 文档
- [文档规范](DOCUMENTATION_METADATA.md) - 文档编写规范

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-03
**下次审查**: 2026-06-03
