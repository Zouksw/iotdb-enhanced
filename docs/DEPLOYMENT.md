---
title: "IoTDB Enhanced 部署指南"
en_title: "IoTDB Enhanced Deployment Guide"
version: "2.0.0"
last_updated: "2026-03-21"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "DevOps Engineer"
  - "System Administrator"
tags:
  - "deployment"
  - "systemd"
  - "production"
  - "monitoring"
target_audience: "运维工程师、系统管理员、DevOps 工程师"
related_docs:
  - "Systemd 服务配置": "docs/systemd-services.md"
  - "监控部署指南": "docs/monitoring-deployment-no-docker.md"
  - "使用指南": "docs/GUIDE.md"
  - "安全配置": "docs/SECURITY.md"
  - "API 参考": "docs/API.md"
changes:
  - version: "2.0.0"
    date: "2026-03-21"
    author: "IoTDB Enhanced Team"
    changes: "主要部署方式更新为 systemd，Docker 作为可选方案"
next_review: "2026-09-21"
approval:
  status: "approved"
  reviewed_by: "DevOps Engineer"
  approved_date: "2026-03-21"
---

# IoTDB Enhanced Platform - 部署指南

本文档提供了 IoTDB Enhanced 平台的完整部署指南，包括部署要求、systemd 快速部署（推荐）、手动部署、生产环境配置、服务管理、监控维护和故障排查。

---

## 目录

1. [部署要求](#部署要求)
2. [快速部署 (Systemd - 推荐)](#快速部署-systemd---推荐)
3. [手动部署](#手动部署)
4. [可选：Docker 部署](#可选docker-部署)
5. [生产环境配置](#生产环境配置)
6. [服务管理](#服务管理)
7. [监控与维护](#监控与维护)
8. [版本迁移](#版本迁移)
9. [故障排查](#故障排查)
10. [部署检查清单](#部署检查清单)

---

## 部署要求

### 系统要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| 操作系统 | Linux (Ubuntu 20.04+) | Ubuntu 22.04 LTS |
| 内存 | 4GB | 8GB+ |
| 磁盘空间 | 20GB | 50GB+ (SSD) |
| CPU | 2 核 | 4 核+ |

### 软件要求

**Systemd 部署（推荐）**:
- **systemd**: 245+
- **Node.js**: 18+
- **PM2**: 5.0+ (全局安装)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Apache IoTDB**: 2.0.5+

**Docker 部署（可选）**:
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

---

## 快速部署 (Systemd - 推荐)

> **为什么选择 Systemd？**
> - 更低的资源占用（无 Docker 开销 ~100-200MB）
> - 更快的启动时间
> - 更简单的日志管理（journald）
> - 更好的系统集成（开机自启、自动重启）

### 1. 克隆项目

```bash
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced
```

### 2. 安装系统依赖

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 安装 Redis
sudo apt install -y redis-server

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 生成安全密钥
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 更新 backend/.env
cat >> backend/.env << EOF
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
EOF
```

### 4. 安装 Apache IoTDB + AI Node

```bash
# 下载 IoTDB 2.0.5 with AI Node
wget https://downloads.apache.org/iotdb/2.0.5/apache-iotdb-2.0.5-all-bin.zip
unzip apache-iotdb-2.0.5-all-bin.zip
sudo mv apache-iotdb-2.0.5-all-bin /opt/iotdb-ainode

# 设置权限
sudo chown -R $USER:$USER /opt/iotdb-ainode

# 启动 IoTDB
cd /opt/iotdb-ainode
./sbin/start-standalone.sh

# 验证安装
curl http://localhost:18080/rest/v1/version
```

### 5. 配置数据库

```bash
# 创建数据库
sudo -u postgres psql
CREATE DATABASE iotdb_enhanced;
CREATE USER iotdb_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE iotdb_enhanced TO iotdb_user;
\q
```

### 6. 部署应用

```bash
# 后端部署
cd backend
npm install
npx prisma migrate deploy
npm run build

# 前端部署
cd ../frontend
npm install
npm run build

# 返回项目根目录
cd ..
```

### 7. 配置 Systemd 服务

```bash
# 复制 systemd 服务文件
sudo cp config/systemd/*.service /etc/systemd/system/

# 配置 logrotate
sudo cp config/logrotate/iotdb-enhanced /etc/logrotate.d/

# 配置备份 cron
sudo cp config/cron/iotdb-backup /etc/cron.d/

# 重新加载 systemd
sudo systemctl daemon-reload

# 启动所有服务
./scripts/systemd/start-all-services.sh

# 设置开机自启
sudo systemctl enable postgresql redis iotdb-backend iotdb-frontend
```

### 8. 配置 Nginx

```bash
sudo cp nginx/iotdb-enhanced.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/iotdb-enhanced.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. 验证部署

```bash
# 检查服务状态
./scripts/systemd/check-services.sh

# 运行健康检查
./scripts/health-check.sh

# 测试 API
curl http://localhost:8000/health
```

---

## 手动部署

如果不使用 systemd 服务文件，可以手动使用 PM2 管理服务。

### 1. 安装 Apache IoTDB + AI Node

同上述步骤 4。

### 2. 安装 PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库
sudo -u postgres psql
CREATE DATABASE iotdb_enhanced;
CREATE USER iotdb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE iotdb_enhanced TO iotdb_user;
\q
```

### 3. 安装 Redis

```bash
sudo apt install redis-server

# 配置 Redis（设置密码）
sudo nano /etc/redis/redis.conf
# 添加: requirepass your_redis_password

sudo systemctl restart redis
```

### 4. 部署后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置数据库连接等

# 运行迁移
npx prisma migrate deploy

# 构建
npm run build

# 使用 PM2 启动
pm2 start ecosystem.config.cjs --env production

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 5. 部署前端

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置 API 地址等

# 构建
npm run build

# 使用 PM2 启动
pm2 start ecosystem.config.cjs --env production
```

### 6. 使用启动脚本

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh

# 查看服务状态
./check.sh
```

---

## 可选：Docker 部署

> **注意**: Docker 部署仅用于开发和测试环境。生产环境推荐使用 systemd 部署。

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 生成安全密钥
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 更新 backend/.env
cat >> backend/.env << EOF
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
EOF
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查状态
docker-compose ps
```

### 3. 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# (可选) 创建初始管理员用户
docker-compose exec backend ./scripts/create-admin.sh
```

### Docker vs Systemd 对比

| 特性 | Docker | Systemd |
|------|--------|---------|
| 资源占用 | ~100-200MB 开销 | 最小 |
| 启动时间 | 较慢 | 快 |
| 隔离性 | 完全隔离 | 进程级隔离 |
| 端口性 | 高（跨平台） | 中等（Linux） |
| 日志管理 | docker logs | journald |
| 推荐环境 | 开发/测试 | 生产 |

---

## 生产环境配置

### 安全配置

详细安全配置请参考 [安全配置指南](docs/SECURITY.md)

关键安全项：
- ✅ 更新所有默认密码
- ✅ 配置 HTTPS (SSL/TLS)
- ✅ 启用防火墙
- ✅ 限制数据库访问
- ✅ 配置 CORS 白名单

### 环境变量清单

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/iotdb_enhanced
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=your_jwt_secret_32_chars_min
SESSION_SECRET=your_session_secret_32_chars_min
IOTDB_REST_URL=http://localhost:18080
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

### 防火墙配置

```bash
# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

## 服务管理

### Systemd 服务管理（推荐）

```bash
# 启动所有服务
./scripts/systemd/start-all-services.sh

# 停止所有服务
./scripts/systemd/stop-all-services.sh

# 检查服务状态
./scripts/systemd/check-services.sh

# 查看服务日志
sudo journalctl -u iotdb-backend -f
sudo journalctl -u iotdb-frontend -f
sudo journalctl -u postgresql -f
sudo journalctl -u redis -f

# 重启单个服务
sudo systemctl restart iotdb-backend
sudo systemctl restart iotdb-frontend
```

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 设置开机自启
pm2 startup
pm2 save
```

### 数据库管理

```bash
# 备份数据库
./scripts/backup-db.sh

# 恢复数据库
./scripts/restore-db.sh

# 健康检查
./scripts/health-check.sh
```

---

## 监控与维护

### 日志位置

| 服务 | 日志位置 |
|------|---------|
| Backend (systemd) | `sudo journalctl -u iotdb-backend` |
| Frontend (systemd) | `sudo journalctl -u iotdb-frontend` |
| Backend (PM2) | `~/.pm2/logs/` |
| Frontend (PM2) | `~/.pm2/logs/` |
| IoTDB | `/opt/iotdb-ainode/logs/` |
| Nginx | `/var/log/nginx/` |
| PostgreSQL | `/var/log/postgresql/` |
| Redis | `sudo journalctl -u redis` |

### 性能监控

推荐使用 Prometheus + Grafana：

```bash
# 部署监控栈（无 Docker）
# 详见 docs/monitoring-deployment-no-docker.md

# 快速安装
cd /opt
sudo wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
sudo tar xvf prometheus-2.48.0.linux-amd64.tar.gz
```

详细配置请参考：
- [监控部署指南](docs/monitoring-deployment-no-docker.md)
- [Systemd 服务配置](docs/systemd-services.md)
- [可观测性设计](docs/observability-design.md)

### 定期维护

- **每日**: 检查服务状态 (`./scripts/systemd/check-services.sh`)
- **每周**: 检查日志和磁盘空间
- **每月**: 更新系统依赖，审查安全日志

### 自动化备份

备份任务已配置在 `/etc/cron.d/iotdb-backup`：

```bash
# 查看备份配置
cat /etc/cron.d/iotdb-backup

# 手动触发备份
sudo -u postgres pg_dump iotdb_enhanced > /backups/postgres/manual_$(date +%Y%m%d).sql
```

---

## 版本迁移

### 迁移前准备

#### 检查清单

- [ ] 开发环境功能测试完成
- [ ] 所有数据已备份
- [ ] 生产环境服务器已准备
- [ ] 域名 DNS 已配置
- [ ] SSL 证书已准备（或使用 Let's Encrypt）

#### 数据备份

```bash
# 备份数据库
./scripts/backup-db.sh

# 备份配置文件
mkdir -p /root/backup
cp backend/.env /root/backup/.env.backup
cp frontend/.env.local /root/backup/frontend.env.backup

# 备份 PM2 配置
pm2 save
cp ~/.pm2/dump.pm2 /root/backup/pm2.dump.backup
```

### 生产环境部署

#### 服务器要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 2 cores | 4+ cores |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 50GB SSD | 100GB+ SSD |
| 操作系统 | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

#### 一键部署（Systemd）

```bash
cd /root/iotdb-enhanced

# 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# 编辑环境变量...

# 安装 systemd 服务
sudo cp config/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

# 启动服务
./scripts/systemd/start-all-services.sh
```

#### 手动部署步骤

1. **代码部署**:
```bash
# 安装依赖
cd backend
npm install --production

cd ../frontend
npm install --production

# 构建项目
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

2. **数据库迁移**:
```bash
cd backend
npx prisma generate
npx prisma migrate deploy

# 恢复数据（如果有）
./scripts/restore-db.sh /path/to/backup.sql.gz
```

3. **环境配置**:
```bash
# 复制并编辑生产环境变量
cd backend
cp .env.example .env
nano .env

# 前端环境变量
cd ../frontend
cp .env.example .env.local
nano .env.local
```

**必须更改的配置：**
- DATABASE_URL
- JWT_SECRET
- SESSION_SECRET
- REDIS_URL
- IOTDB_PASSWORD
- CORS_ORIGIN

4. **启动服务**:
```bash
# Systemd 服务
sudo systemctl start postgresql redis iotdb-backend iotdb-frontend

# 或使用 PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### SSL/TLS 配置

#### Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

#### 商业证书

```bash
# 将证书文件放到指定位置
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private-key.key /etc/ssl/private/

# 更新 Nginx 配置中的证书路径
sudo nano /etc/nginx/sites-available/iotdb-enhanced.conf

# 重载 Nginx
sudo systemctl reload nginx
```

### IoTDB 配置

#### 使用 Systemd 管理 IoTDB

```bash
# IoTDB 已通过 scripts/start-ainode.sh 管理
# 查看状态
./scripts/health-check.sh

# 重启 AI Node
./scripts/stop-ainode.sh
./scripts/start-ainode.sh
```

### 回滚步骤

```bash
# Systemd 服务回滚
sudo systemctl stop iotdb-backend iotdb-frontend postgresql redis

# 恢复数据库
./scripts/restore-db.sh /path/to/backup.sql.gz

# 恢复配置
cp /root/backup/.env.backup backend/.env
cp /root/backup/frontend.env.backup frontend/.env.local

# 恢复代码（如需要）
git checkout <previous-commit-tag>

# 重新构建
cd backend && npm run build
cd ../frontend && npm run build

# 重启服务
sudo systemctl start postgresql redis iotdb-backend iotdb-frontend
```

---

## 故障排查

### 常见问题

#### 1. IoTDB 无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 6667

# 检查日志
tail -f /opt/iotdb-ainode/logs/iotdb.log

# 重启 IoTDB
./scripts/stop-ainode.sh
./scripts/start-ainode.sh
```

#### 2. 后端 API 无响应

```bash
# Systemd 服务
sudo systemctl status iotdb-backend
sudo journalctl -u iotdb-backend -n 50

# PM2
pm2 status
pm2 logs iotdb-backend --err

# 重启后端
sudo systemctl restart iotdb-backend
# 或
pm2 restart iotdb-backend
```

#### 3. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -U iotdb_user -d iotdb_enhanced

# 检查环境变量
cat backend/.env | grep DATABASE_URL
```

#### 4. 前端页面无法访问

```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

#### 5. Systemd 服务启动失败

```bash
# 检查服务状态
sudo systemctl status <service-name>

# 查看详细日志
sudo journalctl -u <service-name> -n 100

# 验证配置
sudo systemd-analyze verify /etc/systemd/system/<service-name>.service
```

### 获取帮助

- GitHub Issues: https://github.com/Zouksw/iotdb-enhanced/issues
- IoTDB 文档: https://iotdb.apache.org/docs/UserGuide/latest/
- Systemd 文档: https://www.freedesktop.org/software/systemd/man/

---

## 部署检查清单

部署前请确保：

- [ ] 已更新所有默认密码
- [ ] 已配置 JWT_SECRET 和 SESSION_SECRET
- [ ] 已设置防火墙规则
- [ ] 已配置 HTTPS (生产环境)
- [ ] 已配置数据库备份
- [ ] 已测试所有服务启动
- [ ] 已验证 AI 功能可用
- [ ] 已配置日志轮转
- [ ] 已设置监控告警（Prometheus + Grafana）
- [ ] 已配置 systemd 自动启动
- [ ] 已验证服务依赖关系

---

## 附录

### 端口清单

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | Next.js 开发服务器 |
| Backend | 8000 | Express API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| IoTDB DataNode | 6667 | RPC 服务 |
| IoTDB ConfigNode | 10710 | 配置服务 |
| IoTDB REST | 18080 | REST API |
| IoTDB AI Node | 10810 | AI 服务 |
| Prometheus | 9090 | 监控指标 |
| Grafana | 3001 | 监控面板 |
| AlertManager | 9093 | 告警服务 |
| Nginx | 80/443 | 反向代理 |

### 目录结构

```
iotdb-enhanced/
├── backend/              # 后端服务
├── frontend/             # 前端应用
├── scripts/              # 管理脚本
│   └── systemd/         # Systemd 管理脚本
├── config/               # 配置文件
│   ├── systemd/         # Systemd 服务单元
│   ├── logrotate/       # 日志轮转配置
│   └── cron/            # Cron 任务
├── docs/                 # 文档
├── nginx/                # Nginx 配置
├── prometheus/           # Prometheus 配置
├── grafana/              # Grafana 配置
├── ecosystem.config.cjs  # PM2 配置
└── docker-compose.yml    # Docker 编排（可选）
```

### 相关文档

- [Systemd 服务配置](docs/systemd-services.md) - 完整的 systemd 服务配置指南
- [监控部署指南](docs/monitoring-deployment-no-docker.md) - Prometheus + Grafana 部署
- [可观测性设计](docs/observability-design.md) - 监控系统架构设计
- [安全配置](docs/SECURITY.md) - 生产环境安全指南
- [使用指南](docs/GUIDE.md) - 用户使用手册
- [API 参考](docs/API.md) - API 接口文档

---

*Last Updated: 2026-03-21*
