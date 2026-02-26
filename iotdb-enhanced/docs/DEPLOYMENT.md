# IoTDB Enhanced Platform - 部署指南

## 目录

1. [部署要求](#部署要求)
2. [快速部署 (Docker)](#快速部署-docker)
3. [手动部署](#手动部署)
4. [生产环境配置](#生产环境配置)
5. [服务管理](#服务管理)
6. [监控与维护](#监控与维护)
7. [故障排查](#故障排查)

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

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (手动部署)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Apache IoTDB**: 2.0.5+

---

## 快速部署 (Docker)

### 1. 克隆项目

```bash
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced
```

### 2. 配置环境变量

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

### 3. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查状态
docker-compose ps
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
cd backend
npx prisma migrate deploy

# (可选) 创建初始管理员用户
./scripts/create-admin.sh
```

---

## 手动部署

### 1. 安装 Apache IoTDB + AI Node

```bash
# 下载 IoTDB 2.0.5 with AI Node
wget https://downloads.apache.org/iotdb/2.0.5/apache-iotdb-2.0.5-all-bin.zip
unzip apache-iotdb-2.0.5-all-bin.zip
sudo mv apache-iotdb-2.0.5-all-bin /opt/iotdb-ainode

# 启动 IoTDB
cd /opt/iotdb-ainode
./sbin/start-standalone.sh

# 验证安装
curl http://localhost:18080/rest/v1/version
```

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
pm2 start dist/server.js --name iotdb-backend
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
pm2 start npm --name iotdb-frontend -- start
```

### 6. 配置 Nginx

```bash
sudo cp nginx/iotdb-enhanced.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/iotdb-enhanced.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 生产环境配置

### 安全配置

详细安全配置请参考 [安全配置指南](SECURITY_SETUP.md)

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
```

---

## 服务管理

### 启动脚本

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh

# 查看服务状态
./status.sh
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
| Backend | `~/.pm2/logs/` |
| Frontend | `~/.pm2/logs/` |
| IoTDB | `/opt/iotdb-ainode/logs/` |
| Nginx | `/var/log/nginx/` |
| PostgreSQL | `/var/log/postgresql/` |

### 性能监控

推荐使用 Prometheus + Grafana：

```bash
./scripts/setup-monitoring.sh
```

### 定期维护

- **每日**: 检查服务状态 (`./status.sh`)
- **每周**: 备份数据库 (`./scripts/backup-db.sh`)
- **每月**: 清理日志文件，检查磁盘空间

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
cd /opt/iotdb-ainode
./sbin/stop-standalone.sh
./sbin/start-standalone.sh
```

#### 2. 后端 API 无响应

```bash
# 检查 PM2 状态
pm2 status

# 查看错误日志
pm2 logs iotdb-backend --err

# 重启后端
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

### 获取帮助

- GitHub Issues: https://github.com/Zouksw/iotdb-enhanced/issues
- IoTDB 文档: https://iotdb.apache.org/docs/UserGuide/latest/

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
- [ ] 已设置监控告警

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
| Nginx | 80/443 | 反向代理 |

### 目录结构

```
iotdb-enhanced/
├── backend/              # 后端服务
├── frontend/             # 前端应用
├── scripts/              # 管理脚本
├── docs/                 # 文档
├── nginx/                # Nginx 配置
└── docker-compose.yml    # Docker 编排
```
