# IoTDB Enhanced - Deployment Manifest

**Version**: 0.1.0
**Last Updated**: 2026-02-26
**Environment**: Development (ready for Production)

---

## System Components

### Application Layer
| Component | Version | Port | Process Manager |
|-----------|---------|------|-----------------|
| Backend API | Custom (Node.js 18) | 8000 | PM2 |
| Frontend | Next.js 14 | 3000 | PM2 |

### Data Layer
| Component | Version | Port | Status |
|-----------|---------|------|--------|
| PostgreSQL | 14+ | 5432 | ✅ Running |
| Redis | 7+ | 6379 | ✅ Running |
| IoTDB | 2.0.5 | 6667, 10710, 18080 | ✅ Running |

### AI/ML Layer
| Component | Models | Status |
|-----------|--------|--------|
| AI Node | 7 models (ARIMA, LSTM, Transformer, etc.) | ✅ Available |

---

## Deployment Files

### Configuration Files
```
/root/iotdb-enhanced/
├── ecosystem.config.cjs           # PM2 configuration
├── backend/.env                   # Backend environment (current)
├── backend/.env.production.example # Production template
├── frontend/.env.local            # Frontend environment
├── nginx/iotdb-enhanced.conf      # Nginx configuration
└── monitoring/alerts.yml          # Prometheus alerts
```

### Scripts (Executable)
```
scripts/
├── start-all.sh                   # Start all services
├── stop-all.sh                    # Stop all services
├── quick-status.sh                # Quick status check
├── health-check.sh                # Comprehensive health check
├── deploy-production.sh           # Production deployment
├── setup-monitoring.sh            # Setup monitoring stack
├── install-services.sh            # Install systemd services
├── change-passwords.sh            # Change passwords securely
├── backup-db.sh                   # Database backup
├── restore-db.sh                  # Database restore
├── create-admin.sh                # Create admin user
├── test-ai-complete.sh            # AI functionality test
└── test-all-features.sh           # Full feature test
```

### Documentation
```
docs/
├── SECURITY_SETUP.md              # Security configuration guide
├── MIGRATION_GUIDE.md             # Dev to Prod migration
├── API.md                         # API documentation
├── DEPLOYMENT.md                  # Cloud deployment guide
└── GUIDE.md                       # Quick start guide

root/
├── DEPLOYMENT_SUMMARY.md          # Deployment summary
├── PRE_DEPLOYMENT_CHECKLIST.md   # Pre-deployment checklist
├── DEVELOPMENT_SUMMARY.md         # Development summary
├── README.md                      # Project README
└── MANIFEST.md                    # This file
```

---

## Environment Variables

### Required Variables
```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=32+ characters
SESSION_SECRET=32+ characters
REDIS_URL=redis://...
IOTDB_HOST=...
IOTDB_PORT=6679
IOTDB_USERNAME=...
IOTDB_PASSWORD=...
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

### Optional Variables
```bash
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=email@domain.com
SMTP_PASS=password
SENTRY_DSN=https://...
LOG_LEVEL=info
```

---

## Security Status

### ✅ Completed
- [x] JWT_SECRET updated (32 characters)
- [x] SESSION_SECRET updated (32 characters)
- [x] CORS configured
- [x] Rate limiting enabled
- [x] Environment variables set

### ⚠️ Pending (Production)
- [ ] Change IoTDB default password (root/root)
- [ ] Change PostgreSQL default password (iotdb_user/iotdb_password)
- [ ] Configure SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Setup fail2ban for intrusion prevention

---

## Automation

### Scheduled Tasks (Cron)
```
0 2 * * * /root/iotdb-enhanced/scripts/backup-db.sh
```

### Log Rotation
```
/etc/logrotate.d/iotdb-enhanced
- PM2 logs: 14 days retention
- Application logs: 30 days retention
```

### Auto-Start
```
PM2: pm2 startup configured
IoTDB: Use ./scripts/install-services.sh for systemd
```

---

## Verification Commands

### Health Check
```bash
./scripts/health-check.sh
```

### Quick Status
```bash
./scripts/quick-status.sh
```

### Service Status
```bash
pm2 status
```

### Database Check
```bash
pg_isready -h localhost
redis-cli ping
```

---

## Deployment Checklist

### Pre-Deployment
- [x] Code built successfully
- [x] All tests passing
- [x] Documentation complete
- [x] Backup scripts ready
- [x] Monitoring configured

### Deployment
- [ ] Production environment configured
- [ ] Database migrated
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Services started

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Backup automation verified
- [ ] Documentation updated
- [ ] Team trained

---

## Support

**Documentation**: See [docs/](docs/) directory
**Issues**: GitHub Issues
**Emergency**: Check logs in `/root/.pm2/logs/`

---

**Generated**: 2026-02-26 23:14 UTC
