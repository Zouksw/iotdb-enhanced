# IoTDB Enhanced - 迁移指南

## 概述

本指南帮助您将 IoTDB Enhanced 从开发环境迁移到生产环境。

**最后更新**: 2026-02-26

---

## 一、迁移前准备

### 1.1 检查清单

- [ ] 开发环境功能测试完成
- [ ] 所有数据已备份
- [ ] 生产环境服务器已准备
- [ ] 域名 DNS 已配置
- [ ] SSL 证书已准备（或使用 Let's Encrypt）

### 1.2 数据备份

```bash
# 备份数据库
/root/iotdb-enhanced/scripts/backup-db.sh

# 备份配置文件
cp /root/iotdb-enhanced/backend/.env /root/backup/.env.backup
cp /root/iotdb-enhanced/frontend/.env.local /root/backup/frontend.env.backup

# 备份 PM2 配置
pm2 save
cp /root/.pm2/dump.pm2 /root/backup/pm2.dump.backup
```

---

## 二、生产环境部署

### 2.1 服务器要求

**最低配置**
- CPU: 2 cores
- 内存: 4GB
- 磁盘: 50GB SSD

**推荐配置**
- CPU: 4+ cores
- 内存: 8GB+
- 磁盘: 100GB+ SSD

**操作系统**
- Ubuntu 20.04+ / Debian 11+
- 或其他 Linux 发行版

### 2.2 依赖安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# 安装 Redis
sudo apt install -y redis-server

# 安装 PM2
npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 Java 17+ (IoTDB 需要)
sudo apt install -y openjdk-17-jdk
```

### 2.3 一键部署

使用部署脚本自动化完成部署：

```bash
cd /root/iotdb-enhanced
./scripts/deploy-production.sh your-domain.com admin@your-domain.com
```

脚本会自动：
1. 创建备份
2. 更新系统
3. 配置防火墙
4. 安装 SSL 证书
5. 配置 Nginx
6. 设置生产环境变量
7. 构建并重启服务
8. 运行健康检查

---

## 三、手动部署步骤

### 3.1 代码部署

```bash
# 克隆或复制代码
git clone <your-repo-url> /root/iotdb-enhanced
# 或 rsync from development server

# 安装依赖
cd /root/iotdb-enhanced/backend
npm install --production

cd /root/iotdb-enhanced/frontend
npm install --production

# 构建项目
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

### 3.2 数据库迁移

```bash
# PostgreSQL
cd /root/iotdb-enhanced/backend
npx prisma generate
npx prisma migrate deploy

# 恢复数据（如果有）
/root/iotdb-enhanced/scripts/restore-db.sh /path/to/backup.sql.gz
```

### 3.3 环境配置

```bash
# 复制并编辑生产环境变量
cd /root/iotdb-enhanced/backend
cp .env.production.example .env.production
nano .env.production  # 编辑配置

# 前端环境变量
cd /root/iotdb-enhanced/frontend
cp .env.production.example .env.production.local
nano .env.production.local
```

**必须更改的配置：**
- DATABASE_URL
- JWT_SECRET
- SESSION_SECRET
- REDIS_URL
- IOTDB_PASSWORD
- CORS_ORIGIN

### 3.4 启动服务

```bash
# 使用 PM2 启动
cd /root/iotdb-enhanced
pm2 start ecosystem.config.cjs --env production

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 3.5 Nginx 配置

```bash
# 复制 Nginx 配置
sudo cp /root/iotdb-enhanced/nginx/iotdb-enhanced.conf /etc/nginx/sites-available/

# 编辑域名
sudo sed -i 's/your-domain.com/actual-domain.com/g' /etc/nginx/sites-available/iotdb-enhanced.conf

# 启用站点
sudo ln -s /etc/nginx/sites-available/iotdb-enhanced.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 四、SSL/TLS 配置

### 4.1 Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 4.2 商业证书

```bash
# 将证书文件放到指定位置
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private-key.key /etc/ssl/private/

# 更新 Nginx 配置中的证书路径
sudo nano /etc/nginx/sites-available/iotdb-enhanced.conf

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 五、IoTDB 配置

### 5.1 安装 IoTDB

```bash
# 下载 IoTDB
wget https://downloads.apache.org/iotdb/2.0.5/apache-iotdb-2.0.5-all-bin.zip
unzip apache-iotdb-2.0.5-all-bin.zip -d /opt/iotdb

# 设置权限
sudo chown -R $USER:$USER /opt/iotdb
```

### 5.2 使用 Systemd 管理

```bash
# 安装服务
./scripts/install-services.sh

# 启动服务
sudo systemctl start iotdb-confignode
sudo systemctl start iotdb-datanode
sudo systemctl start iotdb-ainode

# 检查状态
sudo systemctl status iotdb-confignode
sudo systemctl status iotdb-datanode
sudo systemctl status iotdb-ainode
```

---

## 六、监控设置

### 6.1 安装监控

```bash
./scripts/setup-monitoring.sh
```

### 6.2 访问监控

- **Prometheus**: http://your-server:9090
- **Grafana**: http://your-server:3001 (默认 admin/admin)

---

## 七、健康检查

### 7.1 运行健康检查

```bash
./scripts/health-check.sh
```

### 7.2 手动检查

```bash
# 检查服务状态
pm2 status

# 检查后端健康
curl http://localhost:8000/health

# 检查前端
curl http://localhost:3000/

# 检查数据库
sudo -u postgres psql -c "SELECT version();"
redis-cli ping
```

---

## 八、故障排查

### 8.1 常见问题

**问题 1: 服务无法启动**
```bash
# 检查日志
pm2 logs
sudo journalctl -u postgresql -f
sudo journalctl -u redis -f
```

**问题 2: 数据库连接失败**
```bash
# 检查连接
pg_isready -h localhost
sudo -u postgres psql
```

**问题 3: 前端 404 错误**
```bash
# 重新构建前端
cd frontend && npm run build
pm2 restart iotdb-frontend
```

**问题 4: IoTDB 连接失败**
```bash
# 检查 IoTDB 服务
sudo systemctl status iotdb-datanode
sudo systemctl status iotdb-confignode
```

### 8.2 回滚步骤

```bash
# 停止服务
pm2 stop all

# 恢复数据库
/root/iotdb-enhanced/scripts/restore-db.sh /path/to/backup.sql.gz

# 恢复配置
cp /root/backup/.env.backup /root/iotdb-enhanced/backend/.env
cp /root/backup/frontend.env.backup /root/iotdb-enhanced/frontend/.env.local

# 恢复代码（如需要）
git checkout <previous-commit-tag>

# 重新构建
cd backend && npm run build
cd ../frontend && npm run build

# 重启服务
pm2 restart all
```

---

## 九、性能优化

### 9.1 数据库优化

```sql
-- PostgreSQL 配置优化
-- 编辑 /etc/postgresql/14/main/postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 9.2 Redis 优化

```bash
# 编辑 /etc/redis/redis.conf

maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 重启 Redis
sudo systemctl restart redis
```

### 9.3 Nginx 优化

```nginx
# 已包含在 nginx/iotdb-enhanced.conf 中

# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript 
           application/x-javascript application/xml+rss 
           application/json application/javascript;

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;
```

---

## 十、安全加固

### 10.1 防火墙

```bash
# 配置 UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### 10.2 更改默认密码

```bash
# 更改密码
./scripts/change-passwords.sh

# 或手动更改
# 参考 docs/SECURITY_SETUP.md
```

### 10.3 禁用 root 登录

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 设置
PermitRootLogin no
PasswordAuthentication no

# 重启 SSH
sudo systemctl restart sshd
```

---

## 十一、维护计划

### 11.1 日常维护

```bash
# 每日备份检查
ls -lh /var/backups/iotdb-enhanced/

# 日志检查
pm2 logs --lines 100
sudo tail -f /var/log/nginx/iotdb-enhanced-error.log

# 健康检查
./scripts/health-check.sh
```

### 11.2 每周维护

```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 清理日志
sudo journalctl --vacuum-time=7d

# 数据库维护
sudo -u postgres psql -c "VACUUM ANALYZE;"
```

### 11.3 每月维护

```bash
# 安全更新
sudo unattended-upgrade

# 备份验证
./scripts/backup-db.sh --dry-run

# 性能检查
pm2 monit
```

---

**完成迁移后，请运行 `./scripts/health-check.sh` 验证所有服务正常运行。**
