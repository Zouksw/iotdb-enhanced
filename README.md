---
title: "IoTDB Enhanced Platform"
en_title: "IoTDB Enhanced Platform"
version: "1.3.0"
last_updated: "2026-03-21"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "Project Maintainer"
tags:
  - "overview"
  - "getting-started"
target_audience: "所有用户、开发者、运维工程师"
related_docs:
  - "Systemd 服务配置": "docs/systemd-services.md"
  - "监控部署指南": "docs/monitoring-deployment-no-docker.md"
  - "使用指南": "docs/GUIDE.md"
  - "部署指南": "docs/DEPLOYMENT.md"
  - "安全配置": "docs/SECURITY.md"
  - "API 参考": "docs/API.md"
  - "部署后配置": "docs/POST-DEPLOYMENT.md"
changes:
  - version: "1.3.0"
    date: "2026-03-21"
    author: "IoTDB Enhanced Team"
    changes: "Phase 3.1 - 监控与可观测性、Systemd 部署、Docker 替换"
  - version: "1.2.0"
    date: "2026-03-04"
    author: "IoTDB Enhanced Team"
    changes: "Phase 3 - AI 功能启用、安全隔离、脚本优化"
  - version: "1.1.0"
    date: "2026-03-04"
    author: "IoTDB Enhanced Team"
    changes: "Phase 1 & 2 改进完成 - 测试框架、监控、CI/CD、零停机部署"
  - version: "1.0.0"
    date: "2026-03-03"
    author: "IoTDB Enhanced Team"
    changes: "初始版本 - 文档整合与规范化"
next_review: "2026-09-21"
approval:
  status: "approved"
  reviewed_by: "Project Maintainer"
  approved_date: "2026-03-21"
---

# IoTDB Enhanced Platform

> 基于 Apache IoTDB 2.0.5 + AI Node 的增强型时序数据库平台

提供完整的时序数据存储、查询和 AI 预测分析功能。

[![Tests](https://img.shields.io/badge/tests-1369%20passed-success)](backend/src/__tests__)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## 🎉 最新更新 (v1.3.0)

### Phase 3.1 - 监控与可观测性 (已完成 ✅)
- **Prometheus 指标** - 完整的监控指标系统（HTTP、DB、缓存、IoTDB、AI、告警、会话）
- **Grafana 仪表板** - 自动配置的可视化监控面板
- **AlertManager** - 邮件告警通知系统
- **Systemd 服务** - Docker 部署替换为 systemd（更低资源占用）
- **Prisma 中间件** - 自动数据库查询监控
- **采样策略** - 10% 采样优化性能

### Phase 3 - AI 功能启用与安全隔离 (已完成 ✅)
- **AI 功能启用** - 预测分析、异常检测、模型管理
- **进程隔离执行** - prlimit + su ai-executor 安全隔离（无需 Docker）
- **多层安全防护** - 特性开关、角色权限、IP 白名单、审计日志
- **脚本优化整理** - 从 14 个精简到 11 个核心脚本
- **运行模式文档** - 开发/生产/预发布模式完整指南

### Phase 2 - 性能和自动化 (已完成 ✅)
- **数据库优化** - 自动 VACUUM、索引优化、性能分析
- **Redis 连接池** - 连接复用、自动重连、健康检查
- **API 缓存** - Redis 响应缓存，可配置 TTL
- **CI/CD 管道** - GitHub Actions 自动测试、安全扫描、部署
- **零停机部署** - 蓝绿部署、自动回滚
- **性能监控** - CPU、内存、磁盘、响应时间监控

### Phase 1 - 基础设施 (已完成 ✅)
- **测试框架** - 169 个测试，9 个测试套件全部通过
- **Sentry 集成** - 错误追踪和性能监控
- **自动备份** - PostgreSQL、配置文件、S3 上传
- **日志轮转** - 自动日志清理和压缩

**详情**: [docs/POST-DEPLOYMENT.md](docs/POST-DEPLOYMENT.md) | [docs/RUNNING_MODES.md](docs/RUNNING_MODES.md)

---

## 快速开始

### 生产部署（Systemd - 推荐）

```bash
# 克隆项目
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

# 安装依赖
sudo apt install -y postgresql redis-server nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# 编辑环境变量...

# 安装 systemd 服务
sudo cp config/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

# 启动所有服务
./scripts/systemd/start-all-services.sh

# 查看状态
./scripts/systemd/check-services.sh
```

**详细部署指南**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | [docs/systemd-services.md](docs/systemd-services.md)

### 开发/快速启动（PM2 脚本）

```bash
# 克隆项目
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

# 启动所有服务
./start.sh

# 查看状态
./check.sh

# 停止服务
./stop.sh
```

---

## 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端应用 | http://localhost:3000 | Web 管理界面 |
| 后端 API | http://localhost:8000 | RESTful API |
| API 文档 | http://localhost:8000/api-docs | Swagger 文档 |
| IoTDB REST | http://localhost:18080 | IoTDB 原生 API |
| **Prometheus** | http://localhost:9090 | 监控指标 |
| **Grafana** | http://localhost:3001 | 监控面板 |
| **AlertManager** | http://localhost:9093 | 告警管理 |

---

## 核心功能

### AI 分析能力

> **安全隔离**: AI 功能使用进程隔离执行（prlimit + su ai-executor），仅管理员可访问，所有操作记录审计日志。

- **AI 预测** - 时序数据预测分析（ARIMA、LSTM、Holt-Winters 等）
- **异常检测** - 智能异常识别（支持多种检测算法）
- **模型管理** - AI 模型训练与管理
- **资源限制** - 内存 512M、CPU 时间 60s、自动超时保护

### 安全特性

- **HttpOnly Cookie** - Token 仅存储在 HttpOnly Cookie 中
- **CSRF 保护** - 双提交 Cookie 模式
- **SQL 注入防护** - 输入验证和危险模式检测
- **Rate Limiting** - Redis 支持的速率限制
- **Helmet.js** - 安全头配置

### 数据管理

- 时序数据管理（IoTDB 集成）
- 数据集管理
- 告警系统（多通道通知）
- API 密钥管理
- 用户认证与授权（JWT）

---

## 支持的 AI 算法

| 算法 | 说明 |
|------|------|
| `arima` | ARIMA 自回归移动平均 |
| `timer_xl` | LSTM 长短期记忆网络 |
| `sundial` | Transformer 模型 |
| `holtwinters` | Holt-Winters 三次指数平滑 |
| `exponential_smoothing` | 指数平滑 |
| `naive_forecaster` | 朴素预测 |
| `stl_forecaster` | STL 分解预测 |

---

## 项目结构

```
iotdb-enhanced/
├── backend/           # Node.js 后端服务
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   ├── services/  # 业务逻辑
│   │   ├── middleware/# 中间件（认证、缓存、监控等）
│   │   └── lib/       # 工具库（Sentry、Redis、性能监控等）
│   ├── prisma/        # 数据库模型
│   └── jest.config.cjs# 测试配置
├── frontend/          # Next.js 前端应用
│   └── src/
│       ├── app/       # 页面组件
│       └── components/ # 可复用组件
├── scripts/           # 运维脚本
│   ├── systemd/      # Systemd 服务管理脚本
│   ├── auto-backup.sh           # 自动备份
│   ├── optimize-database.sh     # 数据库优化
│   ├── deploy-zero-downtime.sh  # 零停机部署
│   ├── rollback.sh              # 部署回滚
│   ├── health-check.sh          # 健康检查
│   ├── monitoring.sh            # 性能监控
│   └── user-management.sh       # 用户管理
├── config/            # 配置文件
│   ├── systemd/      # Systemd 服务单元文件
│   ├── logrotate/    # 日志轮转配置
│   └── cron/         # Cron 任务配置
├── prometheus/        # Prometheus 配置
├── grafana/           # Grafana 配置和仪表板
├── docs/              # 项目文档
└── nginx/             # Nginx 配置
```

---

## 文档导航

| 文档 | 说明 | 链接 |
|------|------|------|
| **部署指南** | Systemd 生产部署、Docker 可选、监控维护 | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **Systemd 服务** | 完整的 systemd 服务配置和管理 | [docs/systemd-services.md](docs/systemd-services.md) |
| **监控部署** | Prometheus + Grafana + AlertManager 部署 | [docs/monitoring-deployment-no-docker.md](docs/monitoring-deployment-no-docker.md) |
| **可观测性设计** | 监控系统架构和实现规划 | [docs/observability-design.md](docs/observability-design.md) |
| **使用指南** | 完整的功能使用说明、服务管理、故障排查 | [docs/GUIDE.md](docs/GUIDE.md) |
| **部署后配置** | 部署后配置步骤、监控设置、运维脚本 | [docs/POST-DEPLOYMENT.md](docs/POST-DEPLOYMENT.md) |
| **安全配置** | 密钥管理、安全加固、应急响应 | [docs/SECURITY.md](docs/SECURITY.md) |
| **API 参考** | 完整的 RESTful API 接口文档 | [docs/API.md](docs/API.md) |
| **开发者指南** | 开发环境设置、代码规范、贡献指南 | [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) |
| **运行模式** | 开发/生产/预发布模式详解与切换 | [docs/RUNNING_MODES.md](docs/RUNNING_MODES.md) |

---

## API 示例

```bash
# 查询时序数据
curl http://localhost:8000/api/timeseries?timeseries=root.test1

# 异常检测
curl -X POST http://localhost:8000/api/iotdb/ai/anomalies \
  -H "Content-Type: application/json" \
  -d '{"timeseries": "root.test2", "threshold": 2.5}'

# 模型列表（需要启用 AI 功能）
curl http://localhost:8000/api/iotdb/ai/models
```

---

## 技术栈

### 后端
- **运行时**: Node.js 18.x + Express 4.x + TypeScript 5.x
- **数据库**: PostgreSQL 15.x + Redis 7.x
- **时序库**: Apache IoTDB 2.0.5
- **认证**: JWT (HttpOnly Cookie)
- **进程管理**: PM2
- **测试**: Jest + Supertest
- **监控**: Sentry + 自定义性能监控

### 前端
- **框架**: Next.js 14 + React 19
- **UI 组件**: Ant Design
- **状态管理**: React Context + Hooks
- **样式**: CSS-in-JS
- **认证**: HttpOnly Cookie + CSRF Token

### 基础设施
- **进程管理**: Systemd（生产）/ PM2（开发）
- **容器**: Docker + Docker Compose（可选）
- **反向代理**: Nginx
- **CI/CD**: GitHub Actions
- **日志**: Winston + Daily Rotate File + journald
- **监控**: Prometheus + Grafana + AlertManager + Sentry

---

## 管理命令

### Systemd 服务管理（生产环境推荐）
```bash
./scripts/systemd/start-all-services.sh  # 启动所有服务
./scripts/systemd/stop-all-services.sh   # 停止所有服务
./scripts/systemd/check-services.sh      # 查看服务状态

sudo systemctl status iotdb-backend      # 查看后端服务
sudo journalctl -u iotdb-backend -f      # 查看后端日志
sudo systemctl restart iotdb-backend     # 重启后端服务
```

### PM2 服务管理（开发环境）
```bash
./start.sh    # 启动所有服务
./stop.sh     # 停止所有服务
./check.sh    # 查看服务状态
```

### 数据库管理
```bash
./scripts/auto-backup.sh          # 自动备份
./scripts/optimize-database.sh    # 数据库优化
./scripts/health-check.sh         # 健康检查
```

### 部署管理
```bash
./scripts/deploy-zero-downtime.sh # 零停机部署
./scripts/rollback.sh             # 部署回滚
```

### 监控管理
```bash
./scripts/monitoring.sh --daemon  # 启动监控守护进程
./scripts/monitoring.sh --once    # 运行一次性检查
```

### 用户管理
```bash
./scripts/user-management.sh create-admin    # 创建管理员
./scripts/user-management.sh change-password # 修改密码
```

---

## 测试

```bash
cd backend

# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

**当前状态**: 1369 个测试全部通过 ✅ (70.22% 覆盖率)

---

## 开发

```bash
# 后端开发
cd backend
npm install
npm run dev

# 前端开发
cd frontend
npm install
npm run dev
```

---

## 环境变量

主要环境变量 (见 `.env.production.template`):

```bash
# 数据库
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iotdb_enhanced
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# IoTDB
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=root
IOTDB_PASSWORD=your-iotdb-password

# AI 功能（默认禁用）
AI_FEATURES_DISABLED=true

# Sentry（可选）
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

---

## 许可证

Apache License 2.0

---

## 链接

- **GitHub**: https://github.com/Zouksw/iotdb-enhanced
- **Apache IoTDB**: https://iotdb.apache.org/
- **文档**: [docs/](docs/)
