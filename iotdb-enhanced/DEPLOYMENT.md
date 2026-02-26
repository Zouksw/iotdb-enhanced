# IoTDB Enhanced - Production Deployment Guide

## Overview

This guide covers deploying IoTDB Enhanced to cloud platforms (AWS, GCP, Azure) without Docker.

## Pre-Deployment Checklist

- [ ] All Docker files removed
- [ ] Test files removed from backend
- [ ] Environment variables configured
- [ ] Cloud services provisioned (Database, Redis)
- [ ] Domain name configured (if using custom domain)

---

## Cloud Deployment Options

### Option 1: AWS Deployment

#### Required Services

| Service | Purpose | Example |
|---------|---------|---------|
| **AWS RDS PostgreSQL** | Database | `db.t3.micro` for testing, `db.t3.medium` for production |
| **AWS ElastiCache** | Redis Cache | `cache.t3.micro` for testing |
| **AWS EC2** | Backend/Frontend Hosting | `t3.medium` recommended |
| **AWS IoTDB** | Time Series Database | Deploy on EC2 or use AWS IoT Core |

#### Configuration Steps

1. **Provision RDS PostgreSQL**
   ```bash
   # Create PostgreSQL database
   # Note the connection endpoint for DATABASE_URL
   ```

2. **Provision ElastiCache Redis**
   ```bash
   # Create Redis cluster
   # Note the endpoint for REDIS_URL
   ```

3. **Deploy Backend to EC2**

   ```bash
   # SSH into EC2 instance
   ssh ec2-user@your-ec2-ip

   # Install Node.js (v18+)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clone repository
   git clone your-repo-url
   cd iotdb-enhanced/backend

   # Install dependencies
   npm install --production

   # Configure environment
   cp .env.production.example .env
   # Edit .env with your RDS and ElastiCache endpoints

   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy

   # Start with PM2 (recommended)
   npm install -g pm2
   pm2 start dist/server.js --name iotdb-backend
   pm2 save
   pm2 startup
   ```

4. **Deploy Frontend to EC2**

   ```bash
   cd /path/to/iotdb-enhanced/frontend

   # Install dependencies
   npm install --production

   # Configure environment
   cp .env.production .env.production.local
   # Edit with your backend API URL

   # Build for production
   npm run build

   # Start with PM2
   pm2 start npm --name iotdb-frontend -- start
   pm2 save
   ```

### Option 2: GCP Deployment

#### Required Services

| Service | Purpose | Example |
|---------|---------|---------|
| **Cloud SQL PostgreSQL** | Database | `db-f1-micro` for testing |
| **Memorystore** | Redis Cache | `Redis Capacity` Basic tier |
| **Cloud Run** | Backend Hosting | Auto-scaling containers |
| **Compute Engine** | Frontend Hosting | `e2-medium` instance |

#### Configuration Steps

1. **Provision Cloud SQL**
   ```bash
   gcloud sql instances create iotdb-db \
     --tier=db-f1-micro \
     --region=us-central1 \
     --database-version=POSTGRES_14
   ```

2. **Provision Memorystore**
   ```bash
   gcloud redis instances create iotdb-redis \
     --region=us-central1 \
     --tier=BASIC \
     --memory-size=1
   ```

3. **Deploy Backend to Cloud Run**
   ```bash
   cd backend
   gcloud run deploy iotdb-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Option 3: Azure Deployment

#### Required Services

| Service | Purpose | Example |
|---------|---------|---------|
| **Azure Database PostgreSQL** | Database | `B1ms` tier for testing |
| **Azure Cache for Redis** | Redis Cache | `Basic C0` tier |
| **Azure App Service** | Backend/Frontend Hosting | `B1` pricing tier |

---

## Environment Variables

### Backend Environment Variables

Create `.env.production` in the backend directory:

```env
# Database (Cloud RDS/Cloud SQL/Azure Database)
DATABASE_URL="postgresql://user:password@your-db-endpoint:5432/iotdb_enhanced?schema=public&ssl=true"

# Server
PORT=8000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# JWT (Generate new secrets!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Redis (ElastiCache/Memorystore/Azure Cache)
REDIS_URL=redis://your-redis-endpoint:6379

# Session (Generate new secret!)
SESSION_SECRET=$(openssl rand -base64 32)
SESSION_MAX_AGE=604800000

# IoTDB
IOTDB_HOST=your-iotdb-server.com
IOTDB_PORT=6679
IOTDB_REST_URL=https://your-iotdb-server.com:18080
```

### Frontend Environment Variables

Create `.env.production` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
NEXT_PUBLIC_WS_URL=wss://your-backend-api.com
NEXT_PUBLIC_THEME=system
NEXT_PUBLIC_DEBUG=false
```

---

## SSL/HTTPS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Cloud Load Balancer SSL

- **AWS**: Use AWS Certificate Manager (ACM) with ALB
- **GCP**: Use Google Managed Certificate with Load Balancer
- **Azure**: Use App Service Certificate

---

## Performance Optimization

### Backend

1. **Enable connection pooling**
2. **Configure Redis caching**
3. **Enable gzip compression**
4. **Set up CDN for static assets**

### Frontend

1. **Enable static optimization** (Next.js default)
2. **Use image optimization** (Next.js Image component)
3. **Enable caching headers**
4. **Bundle size optimization**

---

## Monitoring & Logging

### Built-in Metrics (Prometheus)

The application includes built-in Prometheus metrics available at `/metrics`:

- HTTP request rate, latency, errors
- Database query performance
- Cache hit/miss rates
- IoTDB connection status
- AI model performance
- Alert and forecast statistics

### Setting Up Monitoring

```bash
# 1. Install Prometheus
sudo apt install prometheus

# 2. Configure Prometheus (edit /etc/prometheus/prometheus.yml)
scrape_configs:
  - job_name: 'iotdb-enhanced'
    static_configs:
      - targets: ['localhost:8000']

# 3. Install Grafana for dashboards
sudo apt install grafana

# 4. Import dashboards from scripts/grafana/dashboards/
```

### Enhanced Logging

Production includes structured logging with:
- Request/response logging with correlation IDs
- Slow query detection (threshold: 1000ms)
- Security event logging
- Audit trail for critical operations
- Daily log rotation

Logs are stored in:
- `logs/backend-error.log`
- `logs/backend-out.log`
- `logs/frontend-error.log`
- `logs/frontend-out.log`

### Recommended External Tools

- **Sentry**: Error tracking
- **Datadog/New Relic**: Application monitoring
- **CloudWatch/Cloud Logging**: Log aggregation
- **Grafana**: Metrics visualization

---

## Security Checklist

- [ ] Generate strong JWT_SECRET and SESSION_SECRET
- [ ] Enable SSL/TLS for all connections
- [ ] Configure CORS properly
- [ ] Enable rate limiting (built-in)
- [ ] Set up firewall rules
- [ ] Use strong passwords for admin accounts
- [ ] Regular security updates
- [ ] Backup strategy configured
- [ ] Security scanning enabled (GitHub Actions)
- [ ] Nginx security headers configured
- [ ] Database encryption enabled

## CI/CD Pipeline

The project includes GitHub Actions workflows:

### Workflows Available

1. **Test Workflow** ([`.github/workflows/test.yml`](.github/workflows/test.yml))
   - Runs on every push and PR
   - Linting, type checking, unit tests, integration tests, E2E tests

2. **Security Workflow** ([`.github/workflows/security.yml`](.github/workflows/security.yml))
   - Runs daily and on PRs
   - npm audit, Snyk scan, CodeQL, dependency review

3. **Deploy Workflow** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
   - Triggers on push to main
   - Manual deployment workflow available
   - Docker image building and pushing

### Setting Up Deployment

1. Add repository secrets:
   ```
   DEPLOY_HOST          - Production server address
   DEPLOY_USER          - SSH username
   DEPLOY_SSH_KEY       - Private SSH key
   DEPLOY_PATH          - Path on server
   SLACK_WEBHOOK_URL    - For notifications (optional)
   SNYK_TOKEN           - For security scanning (optional)
   ```

2. Push to main branch to trigger deployment, or:
   ```bash
   # Manual deployment via GitHub UI
   # Go to Actions -> Deploy to Production -> Run workflow
   ```

---

## Scaling Considerations

### Horizontal Scaling

- Use a load balancer for multiple backend instances
- Configure sticky sessions for Socket.IO
- Use managed Redis for session sharing

### Vertical Scaling

- Increase database instance size
- Add Redis cluster for more cache
- Increase server CPU/memory

---

## Backup & Recovery

### Automated Backup Script

The project includes automated backup scripts:

```bash
# Make scripts executable
chmod +x scripts/backup-db.sh scripts/restore-db.sh

# Manual backup
./scripts/backup-db.sh

# Dry run (test without backing up)
./scripts/backup-db.sh --dry-run

# Restore from backup
./scripts/restore-db.sh /var/backups/iotdb_enhanced_YYYYMMDD_HHMMSS.sql.gz

# Restore from S3
./scripts/restore-db.sh s3://bucket/path/backup.sql.gz

# Force restore (skip confirmation)
./scripts/restore-db.sh backup.sql.gz --force
```

### Schedule Automated Backups

```bash
# Add to cron for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/iotdb-enhanced/scripts/backup-db.sh

# Or copy to cron.daily
sudo cp scripts/backup-db.sh /etc/cron.daily/iotdb-backup
```

### Cloud Storage Backup

Configure S3/Cloud Storage for backup uploads:

```bash
# Add to .env.production
S3_BUCKET=your-backup-bucket
S3_PREFIX=iotdb-enhanced/backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Manual Database Backup

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250126.sql
```

### Cloud Provider Automated Backups

- **AWS RDS**: Enable automated backups (retention 7-35 days)
- **GCP Cloud SQL**: Enable automated backups
- **Azure Database**: Configure backup retention

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check security group/firewall rules
   - Verify SSL configuration
   - Test connectivity: `nc -zv db-host 5432`

2. **Redis Connection Failed**
   - Check ElastiCache/Memorystore security groups
   - Verify Redis URL format

3. **Frontend Cannot Reach Backend**
   - Check CORS configuration
   - Verify API_URL is correct
   - Check load balancer configuration

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Issue Tracker**: GitHub Issues
- **Community**: Discord/Slack channel

---

## Quick Start Commands

### Using PM2 (Recommended)

```bash
# Backend
cd backend
pnpm install
pnpm run build

# Frontend
cd frontend
pnpm install
pnpm run build

# Start both with PM2
cd /root/iotdb-enhanced
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Follow command output
```

### Manual Start

```bash
# Backend
cd backend
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm run build
pm2 start dist/server.js --name iotdb-backend

# Frontend
cd frontend
pnpm install
pnpm run build
pm2 start npm --name iotdb-frontend -- start
```

### Nginx Reverse Proxy

```bash
# Copy Nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/iotdb-enhanced

# Update domain name
sudo nano /etc/nginx/sites-available/iotdb-enhanced

# Enable site
sudo ln -s /etc/nginx/sites-available/iotdb-enhanced /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo nginx -s reload
```

### Useful PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart specific service
pm2 restart iotdb-backend

# Restart all
pm2 restart all

# Monitor
pm2 monit
```
