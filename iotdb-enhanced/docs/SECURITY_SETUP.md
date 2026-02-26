# IoTDB Enhanced - 安全配置指南

## 概述

本文档提供了生产环境安全配置的完整指南，包括密码更改、SSL/TLS 配置和防火墙设置。

**最后更新**: 2026-02-26
**状态**: 开发环境配置，生产环境部署前需要执行以下步骤

---

## 一、密码安全

### 1.1 当前默认密码（⚠️ 开发环境仅限）

| 服务 | 用户 | 密码 | 说明 |
|------|------|------|------|
| IoTDB | root | root | ⚠️ 默认密码，必须更改 |
| PostgreSQL | iotdb_user | iotdb_password | ⚠️ 默认密码，必须更改 |

### 1.2 生成强密码

```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 16 | tr -d '/+='

# 方法 2: 使用 /dev/urandom
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1

# 方法 3: 使用 pwgen
pwgen -s 32 1
```

### 1.3 更改 PostgreSQL 密码

```bash
# 1. 连接到 PostgreSQL
sudo -u postgres psql

# 2. 更改密码
ALTER USER iotdb_user WITH PASSWORD 'your_new_secure_password';

# 3. 退出
\q

# 4. 更新 .env 文件
cd /root/iotdb-enhanced/backend
nano .env

# 更新 DATABASE_URL 行:
# DATABASE_URL="postgresql://iotdb_user:NEW_PASSWORD@localhost:5432/iotdb_enhanced?schema=public"

# 5. 重启后端
pm2 restart iotdb-backend
```

### 1.4 更改 IoTDB 密码

```bash
# 方法 1: 使用 CLI (推荐)
cd /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
./sbin/cli-cli.sh -h localhost -p 6667 -u root -pw root

# 在 CLI 中执行:
SET PASSWORD TO new_password

# 方法 2: 通过 SQL 接口
./sbin/start-cli.sh -h localhost -p 6667 -u root -pw root
# 然后执行: ALTER USER root SET PASSWORD 'new_password'

# 更新 .env 文件
cd /root/iotdb-enhanced/backend
nano .env

# 更新 IOTDB_PASSWORD 行:
# IOTDB_PASSWORD=new_password

# 重启后端
pm2 restart iotdb-backend
```

---

## 二、SSL/TLS 配置

### 2.1 使用 Let's Encrypt (推荐)

```bash
# 1. 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 2. 获取证书 (替换 your-domain.com)
sudo certbot --nginx -d your-domain.com

# 3. 验证自动续期
sudo certbot renew --dry-run

# 4. 证书位置
# 证书: /etc/letsencrypt/live/your-domain.com/fullchain.pem
# 私钥: /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 2.2 Nginx SSL 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2.3 自签名证书 (开发/测试)

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/iotdb-selfsigned.key \
  -out /etc/ssl/certs/iotdb-selfsigned.crt
```

---

## 三、防火墙配置

### 3.1 使用 UFW (推荐)

```bash
# 1. 安装 UFW
sudo apt update
sudo apt install ufw

# 2. 设置默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. 允许 SSH (重要!)
sudo ufw allow 22/tcp

# 4. 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 5. 启用防火墙
sudo ufw enable

# 6. 查看状态
sudo ufw status verbose
```

### 3.2 生产环境端口规则

```bash
# 开放的端口 (外部访问)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 内部端口 (仅本地访问)
# 以下端口应通过 iptables 或服务配置限制为本地访问
sudo ufw deny 6667/tcp   # IoTDB DataNode (仅本地)
sudo ufw deny 6678/tcp   # IoTDB Sync (仅本地)
sudo ufw deny 10710/tcp  # IoTDB ConfigNode (仅本地)
sudo ufw deny 10810/tcp  # AI Node (仅本地)
sudo ufw deny 5432/tcp   # PostgreSQL (仅本地)
sudo ufw deny 6379/tcp   # Redis (仅本地)
sudo ufw deny 8000/tcp   # Backend API (通过 Nginx 代理)
sudo ufw deny 3000/tcp   # Frontend (通过 Nginx 代理)
```

### 3.3 使用 iptables 限制本地端口

```bash
# 限制 IoTDB 端口仅本地访问
sudo iptables -A INPUT -p tcp --dport 6667 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6667 -j DROP

sudo iptables -A INPUT -p tcp --dport 10710 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 10710 -j DROP

# 限制 PostgreSQL 仅本地访问
sudo iptables -A INPUT -p tcp --dport 5432 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -j DROP

# 限制 Redis 仅本地访问
sudo iptables -A INPUT -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -j DROP

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

---

## 四、JWT 和会话密钥

### 4.1 当前密钥状态

```bash
# backend/.env
JWT_SECRET=1Df1XIs7XJMUmDS4R+zLKESAIi5xvF1fG4lVavTiEDg=  ✅ 已更新
SESSION_SECRET=rPrA3ornUeJM3qKElrOwSJwIEfzw+KpDjW/z4QOPJiY=  ✅ 已更新
```

### 4.2 生成新的安全密钥

```bash
# 生成新的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 生成新的 SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 或使用 OpenSSL
openssl rand -base64 32
```

---

## 五、安全检查清单

### 上线前必做 🔴

- [ ] 更改 IoTDB 默认密码 (root/root)
- [ ] 更改 PostgreSQL 默认密码 (iotdb_user/iotdb_password)
- [ ] 配置 SSL/TLS 证书
- [ ] 配置防火墙规则
- [ ] 确保所有内部端口不对外暴露
- [ ] 验证 JWT_SECRET 和 SESSION_SECRET 已更新

### 建议完成 🟡

- [ ] 设置自动备份
- [ ] 配置监控告警
- [ ] 启用日志审计
- [ ] 配置速率限制
- [ ] 设置入侵检测
- [ ] 定期安全更新

---

## 六、常用命令

### 密码管理
```bash
# 更改 PostgreSQL 密码
sudo -u postgres psql -c "ALTER USER iotdb_user WITH PASSWORD 'new_password';"

# 更改 IoTDB 密码
/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/cli-cli.sh -h localhost -p 6667 -u root -pw root
# 在 CLI 中: SET PASSWORD TO new_password
```

### 证书管理
```bash
# 获取 Let's Encrypt 证书
sudo certbot --nginx -d your-domain.com

# 续期证书
sudo certbot renew

# 查看证书信息
sudo certbot certificates
```

### 防火墙管理
```bash
# 查看 UFW 状态
sudo ufw status

# 允许端口
sudo ufw allow PORT/tcp

# 删除规则
sudo ufw delete allow PORT/tcp

# 查看 iptables 规则
sudo iptables -L -n -v
```

---

## 七、应急处理

### 密码泄露处理

```bash
# 1. 立即更改所有密码
# 2. 检查审计日志
sudo tail -f /var/log/postgresql/postgresql-14-main.log
sudo tail -f /root/.pm2/logs/backend-error.log

# 3. 检查异常登录
sudo lastb
sudo who

# 4. 重新生成 JWT 密钥
# 5. 重启所有服务
pm2 restart all
```

### 服务异常处理

```bash
# 查看服务状态
pm2 status
systemctl status postgresql
systemctl status redis

# 查看日志
pm2 logs
sudo journalctl -u postgresql -f
```

---

**免责声明**: 本文档提供了安全配置指南，但生产环境安全部署应根据具体环境和需求进行调整。建议在部署前咨询安全专家。
