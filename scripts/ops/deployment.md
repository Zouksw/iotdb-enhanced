# 部署指南

**最后更新**: 2026-03-27

## 快速开始

1. 克隆项目
2. 安装依赖: `npm install`
3. 配置环境: 复制 `.env.example` 到 `.env`
4. 启动服务: `./start.sh`

## 生产部署

详细部署步骤请参考 [deployment-checklist.md](deployment/DEPLOYMENT-CHECKLIST.md)

## 监控

- 健康检查: `./check.sh`
- 监控脚本: `scripts/monitor-services.sh`
- 日志查看: `pm2 logs`

## 备份

- 自动备份: `scripts/auto-backup.sh`
- 手动备份: `scripts/ops/backup-database.sh`
