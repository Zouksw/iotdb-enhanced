# IoTDB Enhanced - Developer Guide

Welcome to the IoTDB Enhanced developer guide! This guide will help you understand the codebase, make changes, and contribute effectively.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)
- [Debugging](#debugging)
- [Testing](#testing)
- [Useful Scripts](#useful-scripts)
- [FAQ](#faq)

---

## Quick Start

### Prerequisites

Ensure you have installed:
- **Node.js** 18.x or later
- **PostgreSQL** 15.x
- **Redis** 7.x
- **Apache IoTDB** 2.0.5 (optional, for AI features)
- **pnpm** (recommended) or npm

### Initial Setup

```bash
# Clone repository
git clone https://github.com/YOUR-ORG/iotdb-enhanced.git
cd iotdb-enhanced

# Install dependencies
pnpm install

# Setup environment
cp /root/config/backend.env.example /root/backend/.env
cp /root/config/frontend.env.example /root/frontend/.env.local

# Edit environment files with your configuration
nano /root/backend/.env
nano /root/frontend/.env.local

# Start all services
./start.sh
```

### Verify Installation

```bash
# Check service status
./check.sh

# Backend health check
curl http://localhost:8000/health

# Frontend should be available at
# http://localhost:3000
```

---

## Architecture Overview

### System Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │──────│   Backend   │──────│   IoTDB     │
│  (Next.js)  │      │  (Express)  │      │  (Time-Series)│
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │                      │
      │                     ├──────────┬───────────┤
      │                     │          │           │
      │                ┌────▼────┐ ┌──▼─────┐ ┌──▼─────┐
      │                │PostgreSQL│ │ Redis  │ │ AI Node│
      │                │          │ │        │ │        │
      │                └─────────┘ └────────┘ └────────┘
      └──────────────────────────────────────────────────┘
```

### Backend Architecture (Node.js/Express)

```
backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── routes/                # API endpoints
│   │   ├── auth.ts            # Authentication
│   │   ├── datasets.ts        # Dataset CRUD
│   │   ├── timeseries.ts      # Time-series data
│   │   └── alerts.ts          # Alert management
│   ├── services/              # Business logic
│   │   ├── iotdb/             # IoTDB client
│   │   ├── cache.ts           # Redis caching
│   │   ├── alerts.ts          # Alert processing
│   │   └── authLockout.ts     # Account lockout
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # JWT verification
│   │   ├── csrf.ts            # CSRF protection
│   │   └── errorHandler.ts    # Error handling
│   └── lib/                   # Utilities
│       ├── logger.ts          # Winston logger
│       ├── redis.ts           # Redis client
│       └── jwt.ts             # JWT utilities
└── prisma/                    # Database ORM
    ├── schema.prisma          # Database schema
    └── migrations/            # Migration files
```

### Frontend Architecture (Next.js 14)

```
frontend/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Dashboard/home
│   │   ├── datasets/          # Dataset pages
│   │   ├── timeseries/        # Time-series pages
│   │   └── alerts/            # Alert pages
│   ├── components/            # React components
│   │   ├── datasets/          # Dataset components
│   │   ├── timeseries/        # Time-series components
│   │   └── ui/                # Shared UI components
│   ├── contexts/              # React Context
│   │   └── AuthContext.tsx    # Authentication state
│   └── lib/                   # Utilities
│       ├── api.ts             # API client
│       └── auth.ts            # Auth utilities
```

---

## Project Structure

### Directory Layout

```
iotdb-enhanced/
├── backend/                   # Backend API server
│   ├── src/                   # Source code
│   ├── prisma/                # Database schema
│   ├── dist/                  # Compiled output
│   └── package.json
├── frontend/                  # Frontend web app
│   ├── src/                   # Source code
│   ├── .next/                 # Next.js build output
│   └── package.json
├── config/                    # Configuration templates
│   ├── backend.env.example
│   └── frontend.env.example
├── scripts/                   # Utility scripts
│   ├── start.sh               # Start all services
│   ├── stop.sh                # Stop all services
│   └── check.sh               # Check status
├── docs/                      # Documentation
│   ├── API.md                 # API reference
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── DEVELOPER_GUIDE.md     # This file
├── ecosystem.config.cjs       # PM2 process config
├── docker-compose.yml         # Docker services
├── CLAUDE.md                  # Claude Code instructions
├── CONTRIBUTING.md            # Contribution guidelines
└── README.md                  # Project overview
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Backend entry point |
| `backend/prisma/schema.prisma` | Database schema |
| `frontend/src/app/page.tsx` | Frontend entry |
| `ecosystem.config.cjs` | PM2 process management |
| `.env.production.template` | Production environment template |

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route handler** in `backend/src/routes/`:

```typescript
// backend/src/routes/myfeature.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/myfeature
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await getMyFeatureData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

2. **Register route** in `backend/src/server.ts`:

```typescript
import myfeatureRoutes from './routes/myfeature.js';
app.use('/api/myfeature', myfeatureRoutes);
```

3. **Add business logic** in `backend/src/services/`:

```typescript
// backend/src/services/myfeature.ts
export async function getMyFeatureData() {
  // Implementation here
}
```

4. **Write tests** in `backend/src/__tests__/`:

```typescript
// backend/src/routes/__tests__/myfeature.test.ts
import request from 'supertest';
import app from '../../server.js';

describe('MyFeature API', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/myfeature')
      .expect(200);
    expect(response.body.success).toBe(true);
  });
});
```

5. **Update API documentation** in `docs/API.md`

### Adding a New Frontend Page

1. **Create page** in `frontend/src/app/`:

```typescript
// frontend/src/app/myfeature/page.tsx
import React from 'react';

export default function MyFeaturePage() {
  return (
    <div>
      <h1>My Feature</h1>
      {/* Page content */}
    </div>
  );
}
```

2. **Create components** in `frontend/src/components/`:

```typescript
// frontend/src/components/myfeature/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  data: any;
}

export const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

3. **Add to navigation** in appropriate layout file

4. **Add API client** in `frontend/src/lib/api.ts`:

```typescript
export async function fetchMyFeatureData() {
  const response = await fetch('/api/myfeature');
  return response.json();
}
```

### Adding Database Migration

1. **Modify schema** in `backend/prisma/schema.prisma`:

```prisma
model MyModel {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. **Generate migration**:

```bash
cd backend
npx prisma migrate dev --name add_my_model
```

3. **Generate Prisma client**:

```bash
npx prisma generate
```

4. **Use in code**:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const data = await prisma.myModel.findMany();
```

---

## Debugging

### Backend Debugging

**Run with Node inspector:**

```bash
cd backend
node --inspect dist/src/server.js
# Then connect Chrome DevTools to localhost:9229
```

**Debug with VS Code:**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/dist/src/server.js",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "sourceMaps": true
    }
  ]
}
```

**View logs:**

```bash
# PM2 logs
pm2 logs iotdb-backend

# Direct logs
tail -f backend/logs/app.log
```

### Frontend Debugging

**Use browser DevTools:**
- Chrome/Edge: F12 or Cmd+Option+I (Mac)
- Firefox: F12 or Cmd+Option+K (Mac)

**React DevTools:**
- Install React DevTools extension
- Inspect component hierarchy and props

**Debug with VS Code:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

### Common Issues

**Issue: Port already in use**
```bash
# Find process using port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check connection
psql -U iotdb_user -d iotdb_enhanced

# Check credentials in .env
```

**Issue: Tests failing**
```bash
# Clear Jest cache
cd backend
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose
```

---

## Testing

### Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run specific file
npm test -- path/to/test.test.ts

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm test -- path/to/integration.test.ts

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
cd frontend

# Run Playwright tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### Test Coverage

View coverage report:

```bash
cd backend
npm run test:coverage
open coverage/lcov-report/index.html
```

Target coverage:
- **Backend**: >80%
- **Frontend**: >70%

---

## Useful Scripts

### Service Management

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh

# Check service status
./check.sh

# Restart services
pm2 restart all

# View logs
pm2 logs
```

### Database Operations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Build & Deploy

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Start production
NODE_ENV=production npm start
```

---

## FAQ

### Q: How do I add a new environment variable?

**A:** Add to `backend/.env` or `frontend/.env.local`, then reference in code:

```typescript
// Backend
const value = process.env.MY_VARIABLE;

// Frontend (must start with NEXT_PUBLIC_)
const value = process.env.NEXT_PUBLIC_MY_VARIABLE;
```

### Q: How do I debug IoTDB connection issues?

**A:**
```bash
# Check IoTDB is running
nc -z localhost 6667 && echo "OK" || echo "NOT OK"

# Check AI Node
nc -z localhost 10810 && echo "OK" || echo "NOT OK"

# View logs
tail -50 /opt/iotdb/logs/log_info.log
```

### Q: How do I reset my development database?

**A:**
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Q: Where are the logs stored?

**A:**
- Backend: `backend/logs/app.log`
- PM2: `~/.pm2/logs/`
- IoTDB: `/opt/iotdb/logs/`
- AI Node: `/opt/iotdb-ainode/logs/`

### Q: How do I update dependencies?

**A:**
```bash
# Check for updates
pnpm outdated

# Update all
pnpm update

# Update specific package
pnpm update package-name
```

### Q: How do I run in production mode?

**A:**
```bash
# Set environment
export NODE_ENV=production

# Start with PM2
pm2 start ecosystem.config.cjs --env production

# Or use production script
./scripts/start-with-secrets.sh
```

---

## Additional Resources

- **API Documentation**: [`docs/API.md`](/docs/API.md)
- **Deployment Guide**: [`docs/DEPLOYMENT.md`](/docs/DEPLOYMENT.md)
- **Contributing**: [`CONTRIBUTING.md`](/CONTRIBUTING.md)
- **Architecture**: [`README.md`](/README.md#architecture)

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check [`docs/`](/docs/) folder

Happy coding! 🚀
