---
title: "Systemd Services Configuration (No Docker)"
en_title: "Systemd 服务配置（无 Docker）"
version: "1.0.0"
last_updated: "2026-03-21"
status: "active"
maintainer: "IoTDB Enhanced Team"
tags:
  - "deployment"
  - "systemd"
  - "infrastructure"
target_audience: "DevOps Engineers, SRE"
related_docs:
  - "Monitoring Deployment": "docs/monitoring-deployment-no-docker.md"
  - "Deployment Guide": "docs/DEPLOYMENT.md"
---

# Systemd Services Configuration

This document provides systemd service configurations for running IoTDB Enhanced without Docker containers.

---

## Prerequisites

- Linux system with systemd
- PostgreSQL 15 installed
- Redis 7 installed
- Node.js 18+ installed
- PM2 installed globally

---

## Service Files

### 1. PostgreSQL Service

**File**: `/etc/systemd/system/iotdb-postgres.service`

```ini
[Unit]
Description=IoTDB Enhanced PostgreSQL Database
After=network.target
Wants=network-online.target

[Service]
Type=notify
User=postgres
Group=postgres
Environment=PGDATA=/var/lib/postgresql/data
EnvironmentFile=/etc/postgresql/postgresql.conf
ExecStart=/usr/lib/postgresql/15/bin/postgres -D /var/lib/postgresql/data
ExecReload=/bin/kill -HUP $MAINPID
KillMode=mixed
KillSignal=SIGINT
TimeoutSec=infinity
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2. Redis Service

**File**: `/etc/systemd/system/iotdb-redis.service`

```ini
[Unit]
Description=IoTDB Enhanced Redis Cache
After=network.target

[Service]
Type=notify
User=redis
Group=redis
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/bin/redis-cli shutdown
TimeoutStopSec=0
Restart=always
RestartSec=5s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable redis
sudo systemctl start redis
```

### 3. Backend Service (PM2)

**File**: `/etc/systemd/system/iotdb-backend.service`

```ini
[Unit]
Description=IoTDB Enhanced Backend API
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=forking
User=iotdb
WorkingDirectory=/root/iotdb-enhanced/backend
Environment="NODE_ENV=production"
Environment="PORT=8000"
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs --no-daemon
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
Restart=always
RestartSec=10s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable iotdb-backend
sudo systemctl start iotdb-backend
```

### 4. Frontend Service (PM2)

**File**: `/etc/systemd/system/iotdb-frontend.service`

```ini
[Unit]
Description=IoTDB Enhanced Frontend
After=network.target iotdb-backend.service
Wants=iotdb-backend.service

[Service]
Type=forking
User=iotdb
WorkingDirectory=/root/iotdb-enhanced/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs --no-daemon
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
Restart=always
RestartSec=10s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and start**:
```bash
sudo systemctl enable iotdb-frontend
sudo systemctl start iotdb-frontend
```

---

## Service Management

### Start All Services

```bash
#!/bin/bash
# start-all-services.sh

echo "Starting IoTDB Enhanced services..."

# Start in order
sudo systemctl start postgresql
sudo systemctl start redis
sleep 5

sudo systemctl start iotdb-backend
sleep 5

sudo systemctl start iotdb-frontend

echo "All services started!"
pm2 list
```

### Stop All Services

```bash
#!/bin/bash
# stop-all-services.sh

echo "Stopping IoTDB Enhanced services..."

# Stop in reverse order
sudo systemctl stop iotdb-frontend
sudo systemctl stop iotdb-backend
sudo systemctl stop redis
sudo systemctl stop postgresql

echo "All services stopped!"
```

### Check Service Status

```bash
#!/bin/bash
# check-services.sh

echo "IoTDB Enhanced - Service Status"
echo "=================================="

for service in postgresql redis iotdb-backend iotdb-frontend; do
  status=$(systemctl is-active $service)
  if [ "$status" = "active" ]; then
    echo "✓ $service: RUNNING"
  else
    echo "✗ $service: STOPPED"
  fi
done

echo ""
echo "PM2 Processes:"
pm2 list
```

---

## Log Management

### View Logs

```bash
# PostgreSQL
sudo journalctl -u postgres -f

# Redis
sudo journalctl -u redis -f

# Backend
sudo journalctl -u iotdb-backend -f

# Frontend
sudo journalctl -u iotdb-frontend -f
```

### Log Rotation

Configure logrotate for application logs:

**File**: `/etc/logrotate.d/iotdb-enhanced`

```
/root/iotdb-enhanced/backend/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  create 0640 iotdb iotdb
  sharedscripts
  postrotate
    pm2 reload ecosystem.config.cjs >/dev/null 2>&1 || true
  endscript
}

/root/iotdb-enhanced/frontend/.next/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
}
```

---

## Configuration Files

### Environment Variables

**Backend**: `/root/iotdb-enhanced/backend/.env`
```bash
# Database
DATABASE_URL="postgresql://iotdb_user:PASSWORD@localhost:5432/iotdb_enhanced?schema=public"

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=8000
NODE_ENV=production

# JWT
JWT_SECRET="your-secret-here"
SESSION_SECRET="your-session-secret-here"

# IoTDB
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=iotdb_app
IOTDB_PASSWORD=your-password
IOTDB_REST_URL=http://localhost:18080

# Monitoring
METRICS_ENABLED=true
```

**Frontend**: `/root/iotdb-enhanced/frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_IOTDB_REST_URL=http://localhost:18080
```

### PM2 Ecosystem

**Backend**: `/root/iotdb-enhanced/backend/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'iotdb-backend',
    script: './dist/src/server-with-docs.js',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000,
    },
  }],
};
```

**Frontend**: `/root/iotdb-enhanced/frontend/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'iotdb-frontend',
    script: './node_modules/next/dist/bin/node',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                       Service Dependencies                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend (port 3000)                                                    │
│      │                                                                  │
│      └── depends on ─────────────────────────────┐                │
│                                                  │                │
│  Backend (port 8000)                        │                │
│      │                                         │                │
│      ├── depends on ──────────────────┐    │                │
│      │                                  │    │                │
│      │        PostgreSQL (port 5432)   │    │                │
│      │        Redis (port 6379)          │    │                │
│      └───────────────────────────────────┴────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Auto-Start on Boot

All services are enabled with `systemctl enable`, so they will start automatically on system boot.

**Startup order** (handled by systemd):
1. PostgreSQL
2. Redis
3. Backend (after postgres + redis are ready)
4. Frontend (after backend is ready)

---

## Backup Integration

### Database Backup

**Cron job**: `/etc/cron.d/iotdb-backup`

```bash
# Daily PostgreSQL backup at 2 AM
0 2 * * * postgres pg_dump iotdb_enhanced > /backups/postgres/iotdb_$(date +\%Y\%m\%d).sql

# Weekly full backup
0 3 * * 0 tar -czf /backups/postgres/full_$(date +\%Y\%m\%d).tar.gz /var/lib/postgresql/data
```

### Redis Backup

**Cron job**: `/etc/cron.d/iotdb-backup`

```bash
# Hourly Redis save
0 * * * * redis-cli BGSAVE

# Daily Redis backup
0 4 * * * cp /var/lib/redis/dump.rdb /backups/redis/dump_$(date +\%Y\%m\%d).rdb
```

---

## Monitoring Integration

### System Metrics

The monitoring stack (Prometheus + Grafana + AlertManager) is configured to monitor these services.

**Node Exporter** (for system metrics):

```bash
# Install Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvf node_exporter-1.7.0.linux-amd64.tar.gz

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=prometheus
ExecStart=/opt/node_exporter/node_exporter --web.listen-address=:9100
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

Add to Prometheus targets in `/etc/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status <service>

# Check logs
sudo journalctl -u <service> -n 50

# Check configuration
sudo systemd-analyze verify <service>
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R iotdb:iotdb /root/iotdb-enhanced
sudo chmod -R 755 /root/iotdb-enhanced
```

### Port Conflicts

```bash
# Check what's using a port
sudo lsof -i :8000
sudo lsof -i :3000
sudo lsof -i :5432
sudo lsof -i :6379

# Kill the process
sudo kill -9 <PID>
```

---

## Migration from Docker

If migrating from Docker to systemd:

1. **Export data from containers**:
   ```bash
   # PostgreSQL
   docker exec iotdb-postgres pg_dump iotdb_enhanced > backup.sql

   # Redis
   docker cp iotdb-redis:/data/dump.rdb ./dump.rdb
   ```

2. **Import to system services**:
   ```bash
   # PostgreSQL
   psql -U postgres < backup.sql

   # Redis
   cp ./dump.rdb /var/lib/redis/dump.rdb
   chown redis:redis /var/lib/redis/dump.rdb
   ```

3. **Update environment variables**:
   - Change `host.docker.internal` to `localhost`
   - Update connection strings

4. **Stop Docker containers**:
   ```bash
   docker-compose down
   ```

---

## Comparison: Docker vs Systemd

| Aspect | Docker | Systemd |
|--------|--------|---------|
| **Startup** | `docker-compose up` | `systemctl start` |
| **Logs** | `docker-compose logs` | `journalctl -u` |
| **Updates** | Rebuild containers | Restart service |
| **Isolation** | Full process isolation | Shared userspace |
| **Complexity** | Higher (Docker layers) | Lower (direct services) |
| **Portability** | High (same everywhere) | Medium (OS-specific) |
| **Resource Usage** | Overhead (~100-200MB) | Minimal |

---

## Conclusion

This configuration provides a production-ready alternative to Docker for running IoTDB Enhanced services. All services are managed by systemd, providing:

- Automatic startup on boot
- Automatic restart on failure
- Centralized logging via journald
- Standard service management

**Next Steps**:
1. Install PostgreSQL 15 and Redis 7
2. Create service files
3. Configure environment variables
4. Start services in order
5. Verify with `./check.sh`

---

*Last Updated: 2026-03-21*
