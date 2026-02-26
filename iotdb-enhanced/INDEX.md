# IoTDB Enhanced - 资源索引

快速导航到所有项目资源。

---

## 🚀 快速开始

```bash
# 启动所有服务
./start-all.sh

# 查看状态
./quick-status.sh

# 健康检查
./scripts/health-check.sh
```

---

## 📁 目录结构

### 根目录文件
| 文件 | 说明 |
|------|------|
| [README.md](README.md) | 项目介绍和快速开始 |
| [MANIFEST.md](MANIFEST.md) | 部署清单 |
| [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) | 部署总结 |
| [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) | 上线检查清单 |
| [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) | 开发总结 |

### 启动脚本
| 脚本 | 功能 |
|------|------|
| [start-all.sh](start-all.sh) | 启动所有服务 |
| [stop-all.sh](stop-all.sh) | 停止所有服务 |
| [quick-status.sh](quick-status.sh) | 快速查看状态 |
| [status.sh](status.sh) | 详细状态查看 |

### 脚本目录 [scripts/](scripts/)
| 脚本 | 功能 |
|------|------|
| [health-check.sh](scripts/health-check.sh) | 🔍 系统健康检查 |
| [deploy-production.sh](scripts/deploy-production.sh) | 🚀 一键生产部署 |
| [setup-monitoring.sh](scripts/setup-monitoring.sh) | 📊 设置监控 |
| [install-services.sh](scripts/install-services.sh) | ⚙️ 安装系统服务 |
| [change-passwords.sh](scripts/change-passwords.sh) | 🔐 更改密码 |
| [backup-db.sh](scripts/backup-db.sh) | 💾 数据库备份 |
| [restore-db.sh](scripts/restore-db.sh) | ♻️ 数据库恢复 |
| [create-admin.sh](scripts/create-admin.sh) | 👤 创建管理员 |
| [test-ai-complete.sh](scripts/test-ai-complete.sh) | 🧪 AI功能测试 |
| [test-all-features.sh](scripts/test-all-features.sh) | 🧪 完整功能测试 |

### 文档目录 [docs/](docs/)
| 文档 | 说明 |
|------|------|
| [SECURITY_SETUP.md](docs/SECURITY_SETUP.md) | 🔐 安全配置指南 |
| [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) | 🚚 迁移指南 |
| [API.md](docs/API.md) | 📡 API文档 |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | ☁️ 云部署指南 |
| [GUIDE.md](docs/GUIDE.md) | 📖 使用指南 |

### 配置目录
| 路径 | 说明 |
|------|------|
| [backend/.env](backend/.env) | 后端环境变量 |
| [backend/.env.production.example](backend/.env.production.example) | 生产环境模板 |
| [nginx/iotdb-enhanced.conf](nginx/iotdb-enhanced.conf) | Nginx配置 |
| [monitoring/alerts.yml](monitoring/alerts.yml) | Prometheus告警 |
| [ecosystem.config.cjs](ecosystem.config.cjs) | PM2配置 |

---

## 🎯 按用途查找

### 我想...

**部署到生产环境**
1. 阅读 [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)
2. 运行 `./scripts/deploy-production.sh your-domain.com`

**配置安全**
1. 阅读 [SECURITY_SETUP.md](docs/SECURITY_SETUP.md)
2. 运行 `./scripts/change-passwords.sh`

**监控系统**
1. 运行 `./scripts/setup-monitoring.sh`
2. 访问 http://localhost:9090 (Prometheus)
3. 访问 http://localhost:3001 (Grafana)

**备份数据**
1. 手动: `./scripts/backup-db.sh`
2. 自动: 已配置每天凌晨2点执行

**查看日志**
1. PM2日志: `pm2 logs`
2. 系统日志: `sudo journalctl -u postgresql -f`

**检查健康**
1. 快速: `./quick-status.sh`
2. 完整: `./scripts/health-check.sh`

**开发调试**
1. 启动: `./start-all.sh`
2. 停止: `./stop-all.sh`
3. 重启: `pm2 restart all`

---

## 📊 服务端口

| 服务 | 端口 | 访问 |
|------|------|------|
| 前端 | 3000 | http://localhost:3000 |
| 后端API | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | 本地 |
| Redis | 6379 | 本地 |
| IoTDB DataNode | 6667 | 本地 |
| IoTDB ConfigNode | 10710 | 本地 |
| IoTDB REST | 18080 | 本地 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |

---

## 🔧 常用命令

```bash
# 服务管理
pm2 start|stop|restart|status|logs
pm2 save
pm2 startup

# 数据库
psql -h localhost -U iotdb_user -d iotdb_enhanced
redis-cli

# IoTDB CLI
/opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/sbin/cli-cli.sh -h localhost -p 6667 -u root -pw root

# 系统监控
pm2 monit
htop
df -h
free -h
```

---

## 📞 获取帮助

- **完整文档**: [docs/](docs/)
- **API文档**: [docs/API.md](docs/API.md)
- **部署问题**: [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)
- **安全问题**: [docs/SECURITY_SETUP.md](docs/SECURITY_SETUP.md)

---

**版本**: 0.1.0
**最后更新**: 2026-02-26
