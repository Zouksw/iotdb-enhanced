---
title: "Monitoring Deployment Guide (No Docker)"
en_title: "监控服务部署指南（无 Docker）"
version: "1.0.0"
last_updated: "2026-03-21"
status: "active"
maintainer: "IoTDB Enhanced Team"
tags:
  - "monitoring"
  - "deployment"
  - "infrastructure"
target_audience: "DevOps Engineers, SRE"
related_docs:
  - "Observability Design": "docs/observability-design.md"
  - "Deployment Guide": "docs/DEPLOYMENT.md"
changes:
  - version: "1.0.0"
    date: "2026-03-21"
    author: "IoTDB Enhanced Team"
    changes: "Initial deployment guide for environments without Docker"
next_review: "2026-04-21"
approval:
  status: "pending"
  reviewed_by: ""
  approved_date: ""
---

# Monitoring Deployment Guide (No Docker)

This guide explains how to deploy the monitoring stack (Prometheus, Grafana, AlertManager) without using Docker containers.

---

## Overview

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────┐
│                      IoTDB Enhanced Platform                      │
│                                                                       │
│  Backend (Node.js)                                                  │
│  ├── /metrics endpoint (Prometheus format)                         │
│  └── Exposes: HTTP, DB, Cache, IoTDB, AI, Alerts, Sessions        │
│                                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prometheus (System Install)                      │
│  ├── Scrapes /metrics every 30s                                  │
│  ├── Stores time-series data (15 days retention)                  │
│  ├── Evaluates alert rules                                       │
│  └── Forwards alerts to AlertManager                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AlertManager (System Install)                   │
│  ├── Receives alerts from Prometheus                             │
│  ├── Deduplicates and groups                                      │
│  └── Sends email notifications                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Grafana (System Install)                        │
│  ├── Queries Prometheus for metrics                              │
│  ├── Displays dashboards                                         │
│  └── Shows alert status                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **OS**: Linux (Ubuntu 20.04+ or similar)
- **Memory**: 4GB+ RAM minimum
- **Disk**: 50GB+ free space
- **Network**: Backend must be accessible from monitoring server
- **Permissions**: sudo or root access

---

## Installation

### 1. Prometheus

```bash
# Download Prometheus
cd /opt
sudo wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
sudo tar xvf prometheus-2.48.0.linux-amd64.tar.gz
sudo rm prometheus-2.48.0.linux-amd64.tar.gz

# Create user and directories
sudo useradd --no-create-home --shell /bin/false prometheus
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /etc/prometheus /var/lib/prometheus

# Copy configuration
sudo cp /root/prometheus/prometheus.yml /etc/prometheus/
sudo cp -r /root/prometheus/alerts /etc/prometheus/

# Set ownership
sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

# Create systemd service
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<EOF
[Unit]
Description=Prometheus Monitoring System
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=prometheus
Group=prometheus
ExecStart=/opt/prometheus-2.48.0.linux-amd64/prometheus \\
  --config.file=/etc/prometheus/prometheus.yml \\
  --storage.tsdb.path=/var/lib/prometheus \\
  --storage.tsdb.retention.time=15d \\
  --web.console.templates=/opt/prometheus-2.48.0.linux-amd64/consoles \\
  --web.console.libraries=/opt/prometheus-2.48.0.linux-amd64/console_libraries \\
  --web.enable-lifecycle
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start Prometheus
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Verify
sudo systemctl status prometheus
curl http://localhost:9090/-/healthy
```

### 2. AlertManager

```bash
# Download AlertManager
cd /opt
sudo wget https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz
sudo tar xvf alertmanager-0.26.0.linux-amd64.tar.gz
sudo rm alertmanager-0.26.0.linux-amd64.tar.gz

# Create user and directories
sudo useradd --no-create-home --shell /bin/false alertmanager
sudo mkdir -p /etc/alertmanager /var/lib/alertmanager
sudo chown alertmanager:alertmanager /etc/alertmanager /var/lib/alertmanager

# Copy configuration
sudo cp /root/prometheus/alertmanager.yml /etc/alertmanager/

# Set ownership
sudo chown -R alertmanager:alertmanager /etc/alertmanager /var/lib/alertmanager

# Create systemd service
sudo tee /etc/systemd/system/alertmanager.service > /dev/null <<EOF
[Unit]
Description=AlertManager
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=alertmanager
Group=alertmanager
ExecStart=/opt/alertmanager-0.26.0.linux-amd64/alertmanager \\
  --config.file=/etc/alertmanager/alertmanager.yml \\
  --storage.path=/var/lib/alertmanager \\
  --web.external-url=http://localhost:9093
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start AlertManager
sudo systemctl daemon-reload
sudo systemctl enable alertmanager
sudo systemctl start alertmanager

# Verify
sudo systemctl status alertmanager
curl http://localhost:9093/-/healthy
```

### 3. Grafana

```bash
# Add Grafana repository
sudo wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana

# Create provisioning directories
sudo mkdir -p /etc/grafana/provisioning/datasources
sudo mkdir -p /etc/grafana/provisioning/dashboards
sudo mkdir -p /var/lib/grafana/dashboards

# Copy provisioning configurations
sudo cp /root/grafana/provisioning/datasources/prometheus.yml /etc/grafana/provisioning/datasources/
sudo cp /root/grafana/provisioning/dashboards/dashboards.yml /etc/grafana/provisioning/dashboards/

# Copy dashboard
sudo cp /root/grafana/dashboards/overview.json /var/lib/grafana/dashboards/

# Set ownership
sudo chown -R grafana:grafana /etc/grafana /var/lib/grafana

# Update Grafana configuration
sudo tee -a /etc/grafana/grafana.ini > /dev/null <<EOF

[server]
http_port = 3001

[security]
admin_user = admin
admin_password = $(openssl rand -base64 12)

[users]
allow_sign_up = false

[auth.anonymous]
enabled = false

[provisioning]
enabled = true
EOF

# Enable and start Grafana
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Verify
sudo systemctl status grafana-server
curl http://localhost:3001/api/health
```

---

## Configuration Updates

### Update Prometheus to Scrape Backend

Edit `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - '/etc/prometheus/alerts/*.yml'

scrape_configs:
  # IoTDB Enhanced Backend
  - job_name: 'iotdb-enhanced-backend'
    static_configs:
      - targets: ['localhost:8000']  # Update with actual backend IP
        labels:
          service: 'iotdb-enhanced-backend'
          app: 'iotdb-enhanced'
    scrape_interval: 30s
    metrics_path: '/metrics'

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # AlertManager
  - job_name: 'alertmanager'
    static_configs:
      - targets: ['localhost:9093']
```

**Restart Prometheus**:
```bash
sudo systemctl restart prometheus
```

---

## Firewall Configuration

```bash
# Allow Prometheus
sudo ufw allow 9090/tcp comment 'Prometheus'

# Allow Grafana
sudo ufw allow 3001/tcp comment 'Grafana'

# Allow AlertManager
sudo ufw allow 9093/tcp comment 'AlertManager'

# Check status
sudo ufw status numbered
```

**For remote access**, update firewall to allow specific IPs:

```bash
# Allow specific IP to Grafana
sudo ufw allow from 192.168.1.100 to any port 3001 proto tcp
```

---

## Verification

### 1. Check Prometheus Targets

```bash
curl http://localhost:9090/api/v1/targets
```

Expected output should show `iotdb-enhanced-backend` as "UP".

### 2. Check AlertManager

```bash
curl http://localhost:9093/api/v1/status
```

### 3. Check Grafana

```bash
# Get default admin password
sudo grep admin_password /etc/grafana/grafana.ini

# Login and check datasources
curl -u admin:PASSWORD http://localhost:3001/api/datasources
```

### 4. Trigger Test Alerts

```bash
# Access backend to generate metrics
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/csrf-token

# Check Prometheus for new data
curl -s http://localhost:9090/api/v1/query?query=http_requests_total
```

---

## Service Management

### Start/Stop Services

```bash
# Prometheus
sudo systemctl start prometheus
sudo systemctl stop prometheus
sudo systemctl restart prometheus

# AlertManager
sudo systemctl start alertmanager
sudo systemctl stop alertmanager
sudo systemctl restart alertmanager

# Grafana
sudo systemctl start grafana-server
sudo systemctl stop grafana-server
sudo systemctl restart grafana-server
```

### Check Logs

```bash
# Prometheus
sudo journalctl -u prometheus -f

# AlertManager
sudo journalctl -u alertmanager -f

# Grafana
sudo journalctl -u grafana-server -f
```

### Enable/Disable on Boot

```bash
# Enable
sudo systemctl enable prometheus
sudo systemctl enable alertmanager
sudo systemctl enable grafana-server

# Disable
sudo systemctl disable prometheus
sudo systemctl disable alertmanager
sudo systemctl disable grafana-server
```

---

## Configuration Updates

### Update Prometheus Configuration

```bash
# Edit configuration
sudo nano /etc/prometheus/prometheus.yml

# Validate syntax
/opt/prometheus-2.48.0.linux-amd64/promtool check config /etc/prometheus/prometheus.yml

# Reload Prometheus (no downtime)
sudo killall -HUP prometheus
# Or restart
sudo systemctl restart prometheus
```

### Update Alert Rules

```bash
# Copy new rules
sudo cp /root/prometheus/alerts/*.yml /etc/prometheus/alerts/

# Reload Prometheus
sudo systemctl restart prometheus

# Verify rules loaded
curl http://localhost:9090/api/v1/rules
```

### Update Grafana Dashboards

```bash
# Copy new dashboard
sudo cp /root/grafana/dashboards/*.json /var/lib/grafana/dashboards/

# Restart Grafana
sudo systemctl restart grafana-server

# Dashboards will be automatically provisioned
```

---

## Email Notifications

AlertManager is configured to send emails via localhost:587. To enable:

### Option 1: Local SMTP Server

```bash
# Install Postfix
sudo apt-get install -y postfix

# Configure
sudo dpkg-reconfigure postfix
```

### Option 2: External SMTP

Edit `/etc/alertmanager/alertmanager.yml`:

```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alertmanager@yourdomain.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'

receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'alerts@yourdomain.com'
        from: 'alertmanager@yourdomain.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'your-email@gmail.com'
        auth_password: 'your-app-password'
```

**Restart AlertManager**:
```bash
sudo systemctl restart alertmanager
```

---

## Monitoring the Monitoring Stack

### Systemd Services Status

```bash
# Check all services
sudo systemctl status prometheus alertmanager grafana-server

# Check if enabled
sudo systemctl is-enabled prometheus
sudo systemctl is-enabled alertmanager
sudo systemctl is-enabled grafana-server
```

### Disk Space

```bash
# Check Prometheus data size
du -sh /var/lib/prometheus

# Check Grafana data size
du -sh /var/lib/grafana

# Check AlertManager data size
du -sh /var/lib/alertmanager
```

### Resource Usage

```bash
# CPU and memory
ps aux | grep -E "prometheus|grafana|alertmanager"

# More detailed with top or htop
htop
```

---

## Backup and Restore

### Backup Configuration

```bash
#!/bin/bash
# backup-monitoring-config.sh

BACKUP_DIR="/root/backups/monitoring/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup configurations
cp -r /etc/prometheus "$BACKUP_DIR/"
cp -r /etc/alertmanager "$BACKUP_DIR/"
cp -r /etc/grafana "$BACKUP_DIR/"

# Backup dashboards
cp -r /var/lib/grafana/dashboards "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR"
```

### Restore Configuration

```bash
#!/bin/bash
# restore-monitoring-config.sh

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: $0 <backup_directory>"
  exit 1
fi

# Stop services
sudo systemctl stop prometheus alertmanager grafana-server

# Restore configurations
sudo cp -r "$BACKUP_DIR/prometheus/*" /etc/prometheus/
sudo cp -r "$BACKUP_DIR/alertmanager/*" /etc/alertmanager/
sudo cp -r "$BACKUP_DIR/grafana/*" /etc/grafana/

# Restore dashboards
sudo cp -r "$BACKUP_DIR/dashboards/*" /var/lib/grafana/dashboards/

# Start services
sudo systemctl start prometheus alertmanager grafana-server

echo "Restore completed"
```

---

## Troubleshooting

### Prometheus Not Scraping Backend

**Check**:
1. Backend `/metrics` endpoint accessible: `curl http://backend-ip:8000/metrics`
2. Prometheus targets: `curl http://localhost:9090/api/v1/targets`
3. Firewall: `sudo ufw status`

**Fix**:
```bash
# Update Prometheus target IP
sudo nano /etc/prometheus/prometheus.yml
# Change localhost:8000 to actual backend IP

sudo systemctl restart prometheus
```

### Grafana Cannot Connect to Prometheus

**Check**:
1. Prometheus running: `curl http://localhost:9090/-/healthy`
2. Grafana datasource: `curl -u admin:pass http://localhost:3001/api/datasources`

**Fix**:
```bash
# Update datasource configuration
sudo nano /etc/grafana/provisioning/datasources/prometheus.yml
# Ensure URL is correct: http://localhost:9090

sudo systemctl restart grafana-server
```

### AlertManager Not Sending Emails

**Check**:
1. AlertManager logs: `sudo journalctl -u alertmanager -n 50`
2. Email configuration: `sudo cat /etc/alertmanager/alertmanager.yml`

**Fix**:
```bash
# Test SMTP manually
echo "Test email" | mail -s "Test" your-email@example.com

# Update AlertManager config with correct SMTP settings
sudo nano /etc/alertmanager/alertmanager.yml
sudo systemctl restart alertmanager
```

### High Memory Usage

**Check**:
```bash
# Prometheus memory
ps aux | grep prometheus
du -sh /var/lib/prometheus
```

**Fix**: Reduce retention time in `/etc/prometheus/prometheus.yml`:
```yaml
command:
  - '--storage.tsdb.retention.time=7d'  # Reduce from 15d
```

---

## Security Hardening

### 1. Firewall Rules

```bash
# Only allow specific IPs to Grafana
sudo ufw allow from 10.0.0.0/8 to any port 3001 proto tcp
sudo ufw allow from 172.16.0.0/12 to any port 3001 proto tcp
```

### 2. Authentication

**Grafana**:
- Default: `admin / admin` (change immediately!)
- Update via UI or `/etc/grafana/grafana.ini`

**Prometheus**:
- Not exposed publicly (localhost only)
- Use nginx reverse proxy for external access

### 3. HTTPS with nginx

```nginx
server {
    listen 443 ssl;
    server_name monitoring.yourdomain.com;

    ssl_certificate /etc/ssl/certs/monitoring.crt;
    ssl_certificate_key /etc/ssl/private/monitoring.key;

    # Grafana
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    # Prometheus (with auth)
    location /prometheus/ {
        auth_basic "Prometheus";
        auth_basic_user_file /etc/nginx/.htpasswd;
        proxy_pass http://localhost:9090;
    }
}
```

---

## Performance Tuning

### Prometheus Optimization

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 30s        # Default, can increase to 60s
  evaluation_interval: 30s     # Default, can increase to 60s
```

### Storage Retention

```bash
# Edit retention in /etc/prometheus/prometheus.yml
command:
  - '--storage.tsdb.retention.time=7d'    # Keep 7 days instead of 15
```

### Grafana Caching

```ini
# /etc/grafana/grafana.ini
[caching]
enabled = true
```

---

## Monitoring Stack Updates

### Update Prometheus

```bash
cd /opt
sudo wget https://github.com/prometheus/prometheus/releases/download/vX.Y.Z/prometheus-X.Y.Z.linux-amd64.tar.gz
sudo tar xvf prometheus-X.Y.Z.linux-amd64.tar.gz

sudo systemctl stop prometheus
sudo mv /opt/prometheus-X.Y.Z.linux-amd64 /opt/prometheus-new
sudo mv /opt/prometheus /opt/prometheus-old
sudo mv /opt/prometheus-new /opt/prometheus

sudo systemctl start prometheus
```

### Update Grafana

```bash
sudo apt-get update
sudo apt-get install --only-upgrade grafana
sudo systemctl restart grafana-server
```

---

## Cloud Alternatives

If self-hosting is not feasible, consider cloud options:

### Managed Prometheus

- **AWS**: Amazon Managed Service for Prometheus (AMP)
- **GCP**: Cloud Managed Service for Prometheus
- **Azure**: Azure Monitor Workspace

### Managed Grafana

- **Grafana Cloud**: https://grafana.com/products/cloud/
- **AWS**: Amazon Managed Grafana
- **GCP**: Cloud Monitoring Dashboards

### Hybrid Approach

- Run Prometheus locally (lightweight)
- Use cloud-hosted Grafana (better performance)
- Use S3 for long-term metric storage

---

## Conclusion

This guide provides a complete Docker-free deployment for the monitoring stack. All components run as systemd services and can be managed with standard Linux tools.

**Next Steps**:
1. Follow installation steps for each component
2. Verify services are running
3. Configure firewall rules
4. Set up email notifications
5. Test alerting pipeline

**For issues or questions**, refer to:
- Prometheus docs: https://prometheus.io/docs/
- Grafana docs: https://grafana.com/docs/
- AlertManager docs: https://prometheus.io/docs/alerting/latest/

---

*Last Updated: 2026-03-21*
