# IoTDB Enhanced

Enterprise time-series data analytics platform with AI-powered forecasting and anomaly detection.

**Version**: 1.3.0 | **Status**: Production Ready | **Tests**: 1369 passing (70.22% coverage)

---

## Overview

IoTDB Enhanced extends Apache IoTDB 2.0.5 with AI capabilities, providing a complete solution for time-series data management, prediction, and anomaly detection.

**Core Features**:
- Time-series data storage and querying (IoTDB integration)
- AI-powered forecasting (ARIMA, LSTM, Transformer, Holt-Winters)
- Anomaly detection with configurable algorithms
- RESTful API with Next.js 14 frontend
- Enterprise security (JWT, CSRF protection, rate limiting)
- Comprehensive monitoring (Prometheus, Grafana, Sentry)

**Tech Stack**: Node.js 18, Express, TypeScript 5, PostgreSQL 15, Redis 7, IoTDB 2.0.5, AI Node 2.0.5

---

## Quick Start

### Production Deployment (Systemd)

```bash
# Clone repository
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

# Install dependencies
sudo apt install -y postgresql redis-server nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit environment files with your configuration

# Install systemd services
sudo cp config/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

# Start all services
./scripts/systemd/start-all-services.sh

# Check status
./scripts/systemd/check-services.sh
```

### Development Environment (PM2)

```bash
git clone https://github.com/Zouksw/iotdb-enhanced.git
cd iotdb-enhanced

./start.sh    # Start all services
./check.sh    # Verify status
./stop.sh     # Stop services
```

---

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web management interface |
| Backend API | http://localhost:8000 | RESTful API |
| API Docs | http://localhost:8000/api-docs | Swagger documentation |
| IoTDB REST | http://localhost:18080 | Native IoTDB API |
| Prometheus | http://localhost:9090 | Metrics monitoring |
| Grafana | http://localhost:3001 | Monitoring dashboards |
| AlertManager | http://localhost:9093 | Alert management |

---

## AI Capabilities

**Security**: AI functions use process isolation (prlimit + su ai-executor), admin-only access, audit logging.

**Prediction Models**:
- ARIMA - AutoRegressive Integrated Moving Average
- Timer_XL - LSTM Long Short-Term Memory
- Sundial - Transformer model
- Holt-Winters - Triple exponential smoothing
- Exponential Smoothing
- Naive Forecaster
- STL Forecaster - Seasonal-Trend decomposition

**API Endpoints**:
```bash
# List available models
GET /api/iotdb/ai/models

# Time series prediction
POST /api/iotdb/ai/predict
{
  "timeseries": "root.sg.device1.temperature",
  "horizon": 10,
  "algorithm": "arima"
}

# Anomaly detection
POST /api/iotdb/ai/anomalies
{
  "timeseries": "root.sg.device1.temperature",
  "method": "statistical"
}

# Train custom model
POST /api/iotdb/ai/models/train
```

---

## Project Structure

```
iotdb-enhanced/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, cache, security
│   │   └── lib/          # Utilities (Sentry, Redis, JWT)
│   ├── prisma/           # Database schema
│   └── jest.config.cjs   # Test configuration
├── frontend/             # Next.js web application
│   └── src/
│       ├── app/          # Pages
│       └── components/   # React components
├── scripts/              # Operations scripts
│   ├── systemd/         # Service management
│   ├── auto-backup.sh
│   ├── health-check.sh
│   └── user-management.sh
├── config/               # Configuration files
│   ├── systemd/         # Service units
│   ├── logrotate/       # Log rotation
│   └── cron/            # Scheduled tasks
├── prometheus/           # Monitoring configuration
├── grafana/              # Dashboard configurations
├── docs/                 # Documentation
└── nginx/                # Reverse proxy config
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/INDEX.md](docs/INDEX.md) | Documentation index |
| [docs/API.md](docs/API.md) | Complete API reference |
| [docs/SECURITY.md](docs/SECURITY.md) | Security configuration |
| [docs/DESIGN.md](docs/DESIGN.md) | System architecture |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development roadmap |

---

## Management Commands

### Service Management

```bash
# Systemd (production)
./scripts/systemd/start-all-services.sh  # Start all
./scripts/systemd/stop-all-services.sh   # Stop all
./scripts/systemd/check-services.sh      # Check status

# PM2 (development)
./start.sh    # Start all
./stop.sh     # Stop all
./check.sh    # Check status
```

### Database Operations

```bash
./scripts/auto-backup.sh       # Automated backup
./scripts/health-check.sh      # Health verification
```

### User Management

```bash
./scripts/user-management.sh create-admin     # Create admin user
./scripts/user-management.sh change-password  # Reset password
```

---

## Testing

```bash
cd backend

npm test              # Run all tests
npm run test:coverage # Generate coverage report
npm run test:watch    # Watch mode
```

**Current Status**: 1369 tests passing, 70.22% coverage

---

## Development

```bash
# Backend development
cd backend
npm install
npm run dev    # Start with tsx watch

# Frontend development
cd frontend
npm install
npm run dev    # Start Next.js dev server
```

---

## Environment Variables

**Backend** (`backend/.env`):
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iotdb_enhanced
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# IoTDB
IOTDB_HOST=localhost
IOTDB_PORT=6667
IOTDB_USERNAME=root
IOTDB_PASSWORD=your-iotdb-password

# AI Features (disabled by default)
AI_FEATURES_DISABLED=true

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Security Features

- **Authentication**: JWT with HttpOnly cookies
- **CSRF Protection**: Double-submit cookie pattern
- **SQL Injection Prevention**: Input validation and escaping
- **Rate Limiting**: Redis-backed (100 req/15min per IP)
- **Security Headers**: Helmet.js configuration
- **AI Isolation**: Process isolation with resource limits

---

## License

Apache License 2.0

---

## Links

- **GitHub**: https://github.com/Zouksw/iotdb-enhanced
- **Apache IoTDB**: https://iotdb.apache.org/
- **Documentation**: [docs/](docs/)
