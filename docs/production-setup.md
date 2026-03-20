# Production Setup Guide

## Prerequisites

1. Install and start Apache IoTDB 2.0.5+
2. Install PostgreSQL 15+
3. Install Redis 7+
4. Configure environment variables

## Step 1: Create Secure IoTDB User

### Option A: Using IoTDB CLI

```bash
# Start IoTDB server
cd /path/to/iotdb
sbin/start-standalone.sh

# Connect to IoTDB CLI
sbin/iotdb-cli.sh -h localhost -p 6667 -u root -p root

# Create secure user (replace with strong password)
CREATE USER iotdb_app WITH PASSWORD 'your_secure_password_here_!@#$%12345';

# Grant admin privileges
GRANT ADMIN ON root TO iotdb_app;

# Verify user
LIST USER

# Exit CLI
quit
```

### Option B: Using REST API

```bash
# Create user via API
curl -X POST http://localhost:18080/rest/v2/nonQuery \
  -H "Authorization: Basic $(echo -n 'root:root' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"sql": "CREATE USER iotdb_app WITH PASSWORD '\''your_secure_password_here_!@#$%12345'\''"}'

# Grant privileges
curl -X POST http://localhost:18080/rest/v2/nonQuery \
  -H "Authorization: Basic $(echo -n 'root:root' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"sql": "GRANT ADMIN ON root TO iotdb_app"}'
```

## Step 2: Update Backend Environment

Edit `/root/backend/.env`:

```bash
# Update IoTDB credentials
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=iotdb_app
IOTDB_PASSWORD=your_secure_password_here_!@#$%12345
IOTDB_REST_URL=http://localhost:18080

# Set production mode
NODE_ENV=production

# Update JWT secrets (generate new ones)
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
```

## Step 3: Generate Secure Secrets

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 64)
echo "SESSION_SECRET=$SESSION_SECRET"

# Add to /root/backend/.env
echo "JWT_SECRET=$JWT_SECRET" >> /root/backend/.env
echo "SESSION_SECRET=$SESSION_SECRET" >> /root/backend/.env
```

## Step 4: Update PM2 Configuration

Edit `/root/ecosystem.config.cjs`:

```javascript
// Backend app
{
  name: 'iotdb-backend',
  env: {
    NODE_ENV: 'production',  // Change back to production
    PORT: 8000,
  },
  // ... rest of config
},

// Frontend app
{
  name: 'iotdb-frontend',
  env: {
    NODE_ENV: 'production',  // Change back to production
    PORT: 3000,
  },
  // ... rest of config
},
```

## Step 5: Rebuild and Restart

```bash
# Rebuild backend
cd /root/backend
npm run build

# Rebuild frontend
cd /root/frontend
npm run build

# Restart PM2 with production config
cd /root
pm2 reload ecosystem.config.cjs --env production

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
```

## Step 6: Verify Production Deployment

```bash
# Check PM2 status
pm2 status

# Check backend health (should show production)
curl http://localhost:8000/health | jq .

# Check logs
pm2 logs iotdb-backend --lines 20
pm2 logs iotdb-frontend --lines 20
```

## Security Checklist

- [ ] Created unique IoTDB user with strong password
- [ ] Generated new JWT_SECRET (64+ characters)
- [ ] Generated new SESSION_SECRET (64+ characters)
- [ ] Set NODE_ENV=production in both .env and PM2 config
- [ ] Changed default admin passwords in PostgreSQL
- [ ] Configured Redis with password (redis.conf: requirepass)
- [ ] Enabled HTTPS/TLS for all services
- [ ] Configured firewall rules
- [ ] Set up database backups
- [ ] Configured monitoring and alerts

## Environment Variables Reference

### Required for Production

```bash
# Server
NODE_ENV=production
PORT=8000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/iotdb_enhanced"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=your_redis_password

# IoTDB
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=iotdb_app
IOTDB_PASSWORD=secure_password_here
IOTDB_REST_URL=http://localhost:18080

# Security
JWT_SECRET=64_character_random_string
SESSION_SECRET=64_character_random_string

# Email (optional, for alerts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=smtp_password
```

## Troubleshooting

### Backend fails to start with "SECURITY ALERT"

**Cause**: Using default IoTDB credentials in production mode

**Solution**: Create secure IoTDB user and update .env file

### JWT verification errors

**Cause**: JWT_SECRET changed, invalidating all existing tokens

**Solution**: Users will need to log in again. Consider clearing Redis cache:
```bash
redis-cli FLUSHDB
```

### PM2 shows "waiting..." status

**Cause**: Application crashed, check logs

**Solution**:
```bash
pm2 logs iotdb-backend --err
pm2 show iotdb-backend
```

## Additional Production Considerations

1. **Database Backups**: Set up automated PostgreSQL backups
2. **Monitoring**: Configure Prometheus + Grafana
3. **Log Rotation**: Configure Winston with daily rotate
4. **HTTPS**: Use Nginx reverse proxy with SSL certificates
5. **Rate Limiting**: Adjust based on traffic patterns
6. **Health Checks**: Configure external monitoring (e.g., UptimeRobot)
7. **Disaster Recovery**: Document restore procedures
