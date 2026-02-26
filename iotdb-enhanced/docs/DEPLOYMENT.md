# IoTDB Enhanced Platform - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Manual Deployment](#manual-deployment)
4. [Production Configuration](#production-configuration)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended) or macOS
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 20GB minimum
- **CPU**: 2 cores minimum, 4 cores recommended

### Software Requirements

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (for manual deployment)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Apache IoTDB**: 2.0.5+

---

## Quick Start (Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/iotdb-enhanced.git
cd iotdb-enhanced
```

### 2. Configure Environment Variables

```bash
# Copy environment example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"

# Update backend/.env with the generated secrets
# Update database credentials, Redis password, etc.
```

### 3. Start All Services

```bash
# Start PostgreSQL, Redis, IoTDB, Backend, and Frontend
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Initialize Database

```bash
# Run database migrations
cd backend
docker-compose exec backend npx prisma migrate deploy

# (Optional) Seed with sample data
docker-compose exec backend npx prisma db seed
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api-docs
- **IoTDB REST**: http://localhost:18080

### 6. Stop Services

```bash
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Manual Deployment

### Backend Setup

#### 1. Install Dependencies

```bash
cd backend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 3. Setup Database

```bash
# Install Prisma CLI globally
npm install -g prisma

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

#### 4. Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm start

# With PM2 (recommended for production)
pm2 start dist/server.js --name iotdb-backend
```

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

#### 3. Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm start

# With PM2
pm2 start npm --name iotdb-frontend -- start
```

### IoTDB with AI Node Setup

#### 1. Download and Extract IoTDB

```bash
wget https://downloads.apache.org/iotdb/2.0.5/apache-iotdb-2.0.5-all-bin.zip
unzip apache-iotdb-2.0.5-all-bin.zip
cd apache-iotdb-2.0.5-all-bin
```

#### 2. Start IoTDB

```bash
# Start Config Node
./bin/config-node-start.sh

# Start Data Node
./bin/data-node-start.sh

# Start AI Node (if available)
./bin/ainode-start.sh
```

---

## Production Configuration

### Security Best Practices

#### 1. Generate Secure Secrets

```bash
# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Generate Session Secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
```

#### 2. Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

#### 3. Set Up SSL/TLS

**Using Let's Encrypt with Certbot:**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### 4. Update Nginx Configuration

Edit `nginx/nginx.conf` and uncomment the HTTPS server block:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

### Database Configuration

#### PostgreSQL Tuning

Edit `/etc/postgresql/15/main/postgresql.conf`:

```ini
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100

# Query tuning
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Performance Optimization

#### 1. Enable Redis Caching

Ensure `CACHE_ENABLED=true` in backend `.env`.

#### 2. Configure Connection Pooling

```env
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
IOTDB_MAX_CONNECTIONS=50
```

#### 3. Enable Rate Limiting

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_API=100
RATE_LIMIT_AI=20
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Liveness check
curl http://localhost:8000/health/live

# Readiness check
curl http://localhost:8000/health/ready
```

### Logs Management

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check IoTDB logs
tail -f /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/logs/iotdb.log
```

### Database Backups

```bash
# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/iotdb"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
docker-compose exec -T postgres pg_dump -U iotdb iotdb_enhanced > $BACKUP_DIR/postgres_$DATE.sql

# IoTDB data backup
tar -czf $BACKUP_DIR/iotdb_$DATE.tar.gz /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin/data

# Keep last 7 days
find $BACKUP_DIR -name "postgres_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "iotdb_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# 0 2 * * * /path/to/backup.sh
```

### System Monitoring

Use Prometheus + Grafana for monitoring:

```yaml
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  networks:
    - iotdb-network

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  networks:
    - iotdb-network
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 2. AI Node Not Responding

```bash
# Check AI Node process
ps aux | grep ainode

# Restart AI Node
cd /opt/iotdb-ainode/apache-iotdb-2.0.5-all-bin
./bin/ainode-start.sh

# Check port 10810
netstat -tulpn | grep 10810
```

#### 3. High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart backend frontend
```

#### 4. CORS Errors

Update `CORS_ORIGIN` in backend `.env`:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Getting Help

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/iotdb-enhanced/issues)
- **Community**: [Discord Server](https://discord.gg/iotdb-enhanced)

---

## Scaling Considerations

### Horizontal Scaling

For multiple backend instances:

1. Use a load balancer (Nginx, HAProxy)
2. Configure Redis for session sharing
3. Use external PostgreSQL (RDS, Cloud SQL)
4. Implement distributed tracing

### IoTDB Clustering

See [IoTDB Cluster Configuration](https://iotdb.apache.org/UserGuide/Master/Cluster/Cluster-Config.html) for setting up a distributed IoTDB deployment.

---

## Production Checklist

Before going to production:

- [ ] Change default JWT_SECRET and SESSION_SECRET
- [ ] Set strong database passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Enable monitoring and alerting
- [ ] Review security headers
- [ ] Set up error tracking (Sentry)
- [ ] Configure log aggregation (ELK)
- [ ] Load test the system
- [ ] Document disaster recovery procedures
- [ ] Set up CI/CD pipeline
- [ ] Review audit logging

---

## Support

For production support and enterprise features, contact us at:
- **Email**: support@iotdb-enhanced.com
- **Website**: https://iotdb-enhanced.com
