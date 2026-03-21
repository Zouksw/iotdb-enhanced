---
title: "Observability & Monitoring System Design"
en_title: "可观测性和监控系统设计"
version: "1.0.0"
last_updated: "2026-03-21"
status: "draft"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "Tech Lead"
  - "SRE Lead"
tags:
  - "observability"
  - "monitoring"
  - "design"
target_audience: "Developers, SRE, DevOps Engineers"
related_docs:
  - "Architecture": "docs/ARCHITECTURE.md"
  - "API Documentation": "docs/API.md"
  - "Deployment Guide": "docs/DEPLOYMENT.md"
changes:
  - version: "1.0.0"
    date: "2026-03-21"
    author: "IoTDB Enhanced Team"
    changes: "Initial design document"
next_review: "2026-04-21"
approval:
  status: "pending"
  reviewed_by: ""
  approved_date: ""
---

# Observability & Monitoring System Design

## Executive Summary

This document outlines the design for a comprehensive observability and monitoring system for IoTDB Enhanced Platform. The design follows the **Three Pillars of Observability**: Metrics, Logs, and Traces.

**Current State:**
- ✅ Prometheus metrics infrastructure exists but is unused
- ✅ Winston logging configured with file rotation
- ✅ Sentry installed but not configured
- ❌ No distributed tracing
- ❌ No centralized log aggregation
- ❌ No visualization dashboards

**Target State:**
- 🎯 All metrics actively recorded and exposed
- 🎯 Grafana dashboards for real-time monitoring
- 🎯 OpenTelemetry distributed tracing
- 🎯 Centralized log aggregation with Loki
- 🎯 Alert rules for proactive incident response

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IoTDB Enhanced Platform                               │
│                                                                             │
│  ┌──────────────┐         ┌──────────────────────────────────────┐         │
│  │   Frontend   │         │           Backend (Node.js)           │         │
│  │  (Next.js)   │◄────────┤         Express + TypeScript          │         │
│  │   Port 3000  │         │            Port 8000                  │         │
│  └──────────────┘         └──────────────────────────────────────┘         │
│         │                           │                                   │
│         │                           │                                   │
├─────────┼───────────────────────────┼───────────────────────────────────┤
│         │         Observability Layer (NEW)                            │
│         ▼                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    OpenTelemetry SDK                                 ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  ││
│  │  │   Tracing    │  │   Metrics    │  │        Logs              │  ││
│  │  │   (OTLP)     │  │  (Prometheus)│  │      (Winston → Loki)    │  ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  ││
│  └─────────┼──────────────────┼─────────────────────┼──────────────────┘│
│            │                  │                     │                    │
├────────────┼──────────────────┼─────────────────────┼────────────────────┤
│            │      Collection & Storage Layer                              │
│            ▼                  ▼                     ▼                    │
│  ┌──────────────┐   ┌──────────────┐     ┌──────────────┐               │
│  │   Jaeger     │   │  Prometheus   │     │    Loki      │               │
│  │   (Traces)   │   │  (Metrics)    │     │   (Logs)     │               │
│  │   Port 16686 │   │  Port 9090    │     │  Port 3100   │               │
│  └──────────────┘   └──────────────┘     └──────────────┘               │
│         │                  │                     │                       │
│         └──────────────────┼─────────────────────┘                       │
│                            ▼                                             │
│                  ┌──────────────┐                                        │
│                  │   Grafana    │                                        │
│                  │  Port 3001   │                                        │
│                  │  (Unified    │                                        │
│                  │   Dashboard) │                                        │
│                  └──────────────┘                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                              Data Sources                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │    IoTDB     │  │   AI Node    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Metrics (Prometheus)

#### 1.1 Current State
```typescript
// backend/src/middleware/prometheus.ts - ALREADY DEFINED
// Metrics available:
// - HTTP request duration, counter, errors
// - Database query duration, connections
// - Cache hit/miss rates
// - IoTDB connections, queries, data points
// - AI model predictions, duration, accuracy
// - Alerts triggered/resolved
// - Active user sessions
// - Forecast generation metrics
```

**Problem:** These metrics are defined but never recorded!

#### 1.2 Implementation Plan

```
┌─────────────────────────────────────────────────────────────────┐
│                    Metrics Flow                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Application Layer                                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Services/Routes call metrics helpers                   │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │ metrics.recordDbQuery('select', 'datapoints',    │  │     │
│  │  │                     duration, success)            │  │     │
│  │  │ metrics.recordCacheHit('redis')                   │  │     │
│  │  │ metrics.recordPrediction('arima', 'forecast',    │  │     │
│  │  │                          duration, success)       │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                       │
│                            ▼                                       │
│  Middleware Layer                                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  prometheusMiddleware (already exists)                  │     │
│  │  - Records HTTP request metrics automatically           │     │
│  │  - Exposes /metrics endpoint for Prometheus scraping    │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                       │
│                            ▼                                       │
│  Collection Layer                                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Prometheus Server (NEW)                                │     │
│  │  - Scrapes /metrics every 15s                           │     │
│  │  - Stores time-series data                              │     │
│  │  - Evaluates alert rules                                │     │
│  └────────────────────────────────────────────────────────┘     │
│                            │                                       │
│                            ▼                                       │
│  Visualization Layer                                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Grafana (NEW)                                          │     │
│  │  - Real-time dashboards                                 │     │
│  │  - Alert visualization                                  │     │
│  │  - Ad-hoc queries                                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 Instrumentation Points

```typescript
// Database Queries
src/services/cache.ts
  → wrap Redis operations with metrics.recordCacheHit/Miss()
  → Track cache effectiveness by key pattern

src/routes/timeseries.ts, datasets.ts
  → Wrap Prisma queries with metrics.recordDbQuery()
  → Track slow queries (>100ms warning, >1s alert)

// IoTDB Operations
src/services/iotdb/client.ts
  → metrics.setIotdbConnections(active)
  → metrics.recordIotdbQuery('raw_query', duration)
  → metrics.recordDataPointIngested(device, measurement)

// AI Model Operations
src/routes/iotdb.ts (AI endpoints)
  → metrics.recordPrediction(model, type, duration, success)
  → metrics.setModelAccuracy(model, type, accuracy)
  → Track prediction errors by model type

// Alerts
src/services/alerts.ts
  → metrics.recordAlertTriggered(severity, type)
  → metrics.recordAlertResolved(severity, type)
  → Track alert firing frequency by type

// Sessions
src/middleware/auth.ts
  → metrics.setActiveUserSessions(count)
  → Track concurrent user load
```

#### 1.4 Alert Rules (Prometheus)

```yaml
# prometheus/alerts/iotdb-enhanced.yml
groups:
  - name: api_performance
    rules:
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency > 1s"

  - name: database_health
    rules:
      - alert: DatabaseConnectionPoolExhausted
        expr: db_connections_active / db_connections_max > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"

      - alert: HighCacheMissRate
        expr: rate(cache_misses_total[5m]) / rate(cache_hits_total[5m]) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache miss rate > 50%"

  - name: iotdb_health
    rules:
      - alert: IoTDBConnectionLost
        expr: iotdb_connections_active == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "IoTDB connection lost"

      - alert: AIModelHighErrorRate
        expr: rate(ai_model_predictions_total{status="error"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI model error rate > 10%"
```

---

### 2. Distributed Tracing (OpenTelemetry)

#### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Distributed Tracing Flow                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Incoming Request                                                        │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  OpenTelemetry Middleware                        │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │  1. Extract trace context from headers (traceparent, etc.)  │ │    │
│  │  │  2. Create root span for HTTP request                       │ │    │
│  │  │  3. Propagate context to downstream calls                   │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Application Layer                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │    │
│  │  │ Auth Route   │→ │ Timeseries   │→ │ IoTDB Service          │ │    │
│  │  │              │  │ Route        │  │  ┌──────────────────┐  │ │    │
│  │  │ [span: auth] │  │ [span: list] │  │  │ IoTDB RPC Client │  │ │    │
│  │  └──────────────┘  └──────────────┘  │  │ [span: query]   │  │ │    │
│  │                                       │  └──────────────────┘  │ │    │
│  │                                       └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    External Dependencies                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │    │
│  │  │ PostgreSQL   │  │ Redis        │  │ IoTDB Server           │ │    │
│  │  │ [span: db]   │  │ [span: cache]│  │ [span: iotdb_rpc]      │ │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   OpenTelemetry Exporter                         │    │
│  │  - Batches spans                                                 │    │
│  │  - Sends to Jaeger via OTLP/gRPC                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Jaeger Collector                            │    │
│  │  - Receives spans                                                │    │
│  │  - Builds trace trees                                            │    │
│  │  - Stores in backend (Elasticsearch/Cassandra)                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Span Attributes Specification

```typescript
// Standard attributes per span
interface SpanAttributes {
  // General
  'service.name': string;           // 'iotdb-enhanced-backend'
  'service.version': string;        // from package.json
  'deployment.environment': string; // 'production' | 'staging' | 'development'

  // HTTP
  'http.method': string;
  'http.route': string;
  'http.status_code': number;
  'http.url': string;              // sanitized (no query params with secrets)
  'http.user_agent': string;
  'net.peer.ip': string;
  'net.peer.port': number;

  // Database
  'db.system': string;              // 'postgresql' | 'redis' | 'iotdb'
  'db.name': string;
  'db.operation': string;           // 'SELECT' | 'INSERT' | 'query_raw'
  'db.statement': string;           // sanitized (no values)
  'db.url': string;                 // sanitized (no password)

  // RPC (IoTDB)
  'rpc.system': string;             // 'iotdb'
  'rpc.service': string;            // 'IoTDBRPC'
  'rpc.method': string;             // 'executeQueryStatement'

  // AI Models
  'ai.model.name': string;          // 'arima' | 'timer_xl' | etc.
  'ai.model.type': string;          // 'prediction' | 'anomaly_detection'
  'ai.model.horizon': number;
  'ai.model.success': boolean;

  // Error
  'error.type': string;             // Error class name
  'error.message': string;          // Error message
  'error.stack_trace': string;      // Stack trace
}
```

#### 2.3 Implementation

```typescript
// backend/src/lib/telemetry.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-trace-jaeger';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@opentelemetry/instrumentation-prisma';

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'iotdb-enhanced-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  })
);

const provider = new NodeTracerProvider({ resource });

const exporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// Auto-instrumentation
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

export const tracer = trace.getTracer('iotdb-enhanced-backend');
```

---

### 3. Log Aggregation (Loki)

#### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Log Flow                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Application                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Winston Logger                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐ │    │
│  │  │  logger.info('User login', { userId, ip, userAgent })       │ │    │
│  │  │  logger.error('DB query failed', { error, query, duration }) │ │    │
│  │  │  logger.warn('High memory usage', { usage, threshold })      │ │    │
│  │  └────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  Winston → Loki Transport                        │    │
│  │  - Formats logs as JSON                                         │    │
│  │  - Adds trace ID (correlates with spans)                        │    │
│  │  - Sends to Loki via HTTP                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Loki                                     │    │
│  │  - Labels: service, environment, level, hostname                │    │
│  │  - Full-text search on log content                              │    │
│  │  - LogQL queries for filtering                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Grafana                                   │    │
│  │  - Unified dashboard: metrics + logs + traces                   │    │
│  │  - Click metric → see related logs → jump to trace              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Log Format Specification

```typescript
// Structured JSON logging format
interface LogEntry {
  // Standard fields
  timestamp: string;           // ISO 8601
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;

  // Service context
  service: string;             // 'iotdb-enhanced-backend'
  environment: string;         // 'production' | 'staging' | 'development'
  hostname: string;
  pid: number;

  // Request context (when applicable)
  trace_id?: string;           // OpenTelemetry trace ID
  span_id?: string;            // OpenTelemetry span ID
  user_id?: string;
  request_id?: string;
  method?: string;
  path?: string;
  status_code?: number;

  // Custom context
  [key: string]: any;
}
```

---

### 4. Grafana Dashboards

#### 4.1 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Grafana Dashboard Structure                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Overview Dashboard (All users)                                          │
│     - Service health (up/down)                                              │
│     - Request rate, error rate, latency                                     │
│     - Active users, session count                                          │
│     - System resources (CPU, memory)                                       │
│                                                                              │
│  2. API Performance Dashboard (Developers)                                  │
│     - P50, P95, P99 latency by endpoint                                    │
│     - Request rate by route                                                │
│     - Error breakdown by status code                                       │
│     - Slow query detection                                                 │
│                                                                              │
│  3. Database Health Dashboard (DBA/SRE)                                     │
│     - Connection pool usage                                                │
│     - Query performance (slow queries)                                      │
│     - Cache hit/miss rates                                                 │
│     - IoTDB connection status                                              │
│                                                                              │
│  4. AI Models Dashboard (Data Scientists)                                   │
│     - Prediction request rate                                              │
│     - Model accuracy over time                                             │
│     - Prediction duration by model                                         │
│     - Error rate by model type                                             │
│                                                                              │
│  5. Alerts Dashboard (SRE)                                                  │
│     - Active alerts                                                         │
│     - Alert history                                                         │
│     - Mean time to resolution (MTTR)                                       │
│     - Alert frequency by type                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2 Sample Panel Queries

```promql
// Request rate (5min average)
rate(http_requests_total[5m])

// Error rate
rate(http_errors_total[5m]) / rate(http_requests_total[5m])

// P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

// Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

// Active sessions
active_user_sessions

// IoTDB connection status
iotdb_connections_active

// AI model prediction duration (by model)
rate(ai_model_prediction_duration_seconds_sum[5m])
  / rate(ai_model_prediction_duration_seconds_count[5m])
```

---

## Implementation Phases

### Phase 3.1: Enable Existing Metrics (Week 1)

**Goal**: Make the existing Prometheus metrics infrastructure work.

**Tasks**:
1. Add metric recording calls to all services
2. Create Grafana dashboards
3. Set up Prometheus server (Docker)
4. Configure alert rules
5. Test metric collection

**Files to modify** (8 files):
- `src/services/cache.ts` - Add cache metrics
- `src/services/iotdb/client.ts` - Add IoTDB metrics
- `src/routes/iotdb.ts` - Add AI model metrics
- `src/services/alerts.ts` - Add alert metrics
- `src/middleware/auth.ts` - Add session metrics
- `src/routes/timeseries.ts`, `datasets.ts` - Add DB metrics
- `src/routes/health.ts` - Enhance health endpoint
- `docker-compose.yml` - Add Prometheus + Grafana

**New files** (4 files):
- `docker-compose.monitoring.yml` - Monitoring stack
- `grafana/dashboards/overview.json` - Overview dashboard
- `grafana/dashboards/api-performance.json` - API dashboard
- `grafana/dashboards/database-health.json` - DB dashboard
- `prometheus/alerts/iotdb-enhanced.yml` - Alert rules

**Deliverables**:
- ✅ Metrics actively recorded
- ✅ Grafana dashboards visible
- ✅ Prometheus scraping /metrics
- ✅ Alert rules configured

---

### Phase 3.2: Distributed Tracing (Week 2)

**Goal**: Add OpenTelemetry tracing for request flow visibility.

**Tasks**:
1. Install OpenTelemetry packages
2. Configure tracing middleware
3. Instrument key routes
4. Set up Jaeger (Docker)
5. Correlate traces with logs

**New packages**:
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node
npm install @opentelemetry/exporter-trace-jaeger
npm install @opentelemetry/instrumentation-http
npm install @opentelemetry/instrumentation-express
npm install @opentelemetry/instrumentation-prisma
npm install @opentelemetry/resource-detector-alibaba-cloud
```

**Files to create** (3 files):
- `src/lib/telemetry.ts` - Tracing setup
- `src/middleware/tracing.ts` - Express tracing middleware
- `src/utils/trace.ts` - Helper utilities

**Files to modify** (5 files):
- `src/server.ts` - Initialize tracing
- `src/services/iotdb/client.ts` - Add IoTDB spans
- `src/services/cache.ts` - Add Redis spans
- `src/lib/logger.ts` - Add trace ID to logs

**Deliverables**:
- ✅ Traces collected in Jaeger
- ✅ Trace IDs in log entries
- ✅ Distributed call graphs visible

---

### Phase 3.3: Log Aggregation (Week 3)

**Goal**: Centralize logs with Loki for unified querying.

**Tasks**:
1. Set up Loki (Docker)
2. Add Winston → Loki transport
3. Configure log retention
4. Create log queries in Grafana
5. Test log correlation

**New packages**:
```bash
npm install winston-loki
```

**Files to create** (2 files):
- `src/lib/logger/loki-transport.ts` - Loki transport
- `src/lib/logger/formatter.ts` - JSON formatter

**Files to modify** (2 files):
- `src/lib/logger.ts` - Add Loki transport
- `docker-compose.monitoring.yml` - Add Loki

**Deliverables**:
- ✅ Logs sent to Loki
- ✅ Queryable in Grafana
- ✅ Correlated with traces and metrics

---

### Phase 3.4: Production Hardening (Week 4)

**Goal**: Ensure observability is production-ready.

**Tasks**:
1. Configure retention policies
2. Set up alert notifications (Slack/Email)
3. Performance testing (overhead <5%)
4. Documentation runbooks
5. On-call procedures

**Files to create** (3 files):
- `docs/oncall/runbooks.md` - Incident runbooks
- `docs/oncall/alerting.md` - Alert procedures
- `scripts/monitoring/health-check.sh` - Health check script

**Files to modify** (2 files):
- `docker-compose.monitoring.yml` - Volume mounts for persistence
- `prometheus/prometheus.yml` - Retention config

**Deliverables**:
- ✅ Alert notifications configured
- ✅ Data retention policies set
- ✅ Runbooks documented
- ✅ On-call procedures defined

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/lib/telemetry.test.ts
describe('OpenTelemetry Tracing', () => {
  it('should create root span for HTTP requests', async () => {
    const response = await request(app).get('/api/timeseries');
    expect(response.headers['traceparent']).toBeDefined();
  });

  it('should propagate trace context to downstream calls', async () => {
    const mockTraceId = '12345678901234567890123456789012';
    const response = await request(app)
      .get('/api/timeseries')
      .set('traceparent', `00-${mockTraceId}-1234567890123456-01`);
    // Verify trace ID is preserved
  });
});

// __tests__/middleware/prometheus.test.ts
describe('Prometheus Metrics', () => {
  it('should record HTTP request metrics', async () => {
    await request(app).get('/api/timeseries');
    const metrics = await promClient.register.metrics();
    expect(metrics).toContain('http_requests_total');
  });

  it('should record database query metrics', async () => {
    const recordDbQuery = metrics.recordDbQuery;
    await recordDbQuery('select', 'datapoints', 50, true);
    const metric = await dbQueryCounter.get();
    expect(metric.values[0].value).toBe(1);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/observability.integration.test.ts
describe('Observability Integration', () => {
  it('should correlate metrics, logs, and traces', async () => {
    // 1. Make a request
    const response = await request(app)
      .post('/api/timeseries')
      .send({ timeseries: 'root.sg.device.temp' });

    // 2. Get trace ID from response
    const traceId = response.headers['x-trace-id'];

    // 3. Query Jaeger for trace
    const trace = await jaegerClient.getTrace(traceId);
    expect(trace.spans.length).toBeGreaterThan(0);

    // 4. Query Loki for logs with trace ID
    const logs = await lokiClient.query({ traceId });
    expect(logs.length).toBeGreaterThan(0);

    // 5. Query Prometheus for metrics
    const metrics = await prometheusClient.query(
      `http_requests_total{trace_id="${traceId}"}`
    );
    expect(metrics.length).toBeGreaterThan(0);
  });
});
```

### Performance Tests

```typescript
// __tests__/performance/telemetry-overhead.test.ts
describe('Telemetry Overhead', () => {
  it('should add less than 5% latency overhead', async () => {
    // Baseline (no telemetry)
    const baselineStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      await request(app).get('/api/timeseries');
    }
    const baselineDuration = Date.now() - baselineStart;

    // With telemetry
    const telemetryStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      await request(app).get('/api/timeseries');
    }
    const telemetryDuration = Date.now() - telemetryStart;

    const overhead = (telemetryDuration - baselineDuration) / baselineDuration;
    expect(overhead).toBeLessThan(0.05); // < 5%
  });
});
```

---

## Deployment Architecture

### Development

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts:/etc/prometheus/alerts

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Collector
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
```

### Production

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Production Deployment                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Kubernetes Cluster (or VMs)                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Monitoring Namespace                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │   │
│  │  │  Prometheus  │  │   Grafana    │  │        Loki            │ │   │
│  │  │  (Replicas:  │  │  (Replicas:  │  │     (Replicas: 1)      │ │   │
│  │  │     2)       │  │     2)       │  │                         │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │                    AlertManager                            │ │   │
│  │  │  - Receives alerts from Prometheus                         │ │   │
│  │  │  - Deduplicates, groups, routes                            │ │   │
│  │  │  - Sends to Slack, PagerDuty, Email                        │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Storage                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │  Prometheus  │  │     Loki     │  │         Jaeger                 │ │
│  │  TSDB (15d)  │  │  Logs (30d)  │  │   Elasticsearch (7d traces)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Retention Policies

| Component | Data Type | Retention | Reason |
|-----------|-----------|-----------|--------|
| Prometheus | Metrics | 15 days | 15d is sufficient for trend analysis; older data archived |
| Loki | Logs | 30 days | Compliance + incident investigation window |
| Jaeger | Traces | 7 days | High cardinality; expensive to store long-term |
| Grafana | Dashboards | Forever | Version controlled in git |

---

## Alert Notification Channels

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Alert Routing                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AlertManager                                                            │
│      │                                                                   │
│      ├─── Critical (5m) ──► PagerDuty ──► On-call engineer (SMS/Call)    │
│      │                                                                   │
│      ├─── Warning (15m) ──► Slack (#alerts) ──► Team channel            │
│      │                                                                   │
│      └─── Info (1h) ─────► Email ──► Digest email                       │
│                                                                          │
│  Severity Mapping:                                                       │
│  - Critical: Service down, data loss, security breach                    │
│  - Warning: High error rate, slow queries, high latency                 │
│  - Info: Trends, capacity planning, deprecations                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### Phase 3.1 (Metrics)
- ✅ All Prometheus metrics actively recorded
- ✅ Grafana dashboards show real-time data
- ✅ Alert rules fire correctly
- ✅ Dashboard load time < 2s

### Phase 3.2 (Tracing)
- ✅ 100% of requests have trace IDs
- ✅ Critical paths have spans (auth → database → response)
- ✅ Trace collection overhead < 5%
- ✅ Jaeger UI shows complete call graphs

### Phase 3.3 (Logs)
- ✅ All application logs sent to Loki
- ✅ Logs contain trace IDs for correlation
- ✅ LogQL queries return results < 1s
- ✅ No logs lost during high traffic

### Phase 3.4 (Production)
- ✅ Alerts notify within 30s of threshold breach
- ✅ MTTR (Mean Time To Resolution) < 15min
- ✅ Runbooks exist for top 10 alerts
- ✅ On-call rotation defined

---

## Security Considerations

### 1. Access Control
- Grafana: LDAP/SSO integration in production
- Prometheus: Network-restricted (internal only)
- Jaeger: VPN/internal network only
- Loki: Internal network only

### 2. Data Sanitization
```typescript
// Redact sensitive data from traces/logs
const SANITIZATION_RULES = [
  { pattern: /password="[^"]*"/g, replacement: 'password="[REDACTED]"' },
  { pattern: /token="[^"]*"/g, replacement: 'token="[REDACTED]"' },
  { pattern: /api_key="[^"]*"/g, replacement: 'api_key="[REDACTED]"' },
  { pattern: /bearer [A-Za-z0-9\._-]+/g, replacement: 'bearer [REDACTED]' },
];
```

### 3. Rate Limiting
- `/metrics` endpoint: Only scrape from Prometheus IPs
- Log ingestion: Max 10MB/sec per service

---

## Cost Estimation

### Infrastructure (Monthly)

| Service | CPU | RAM | Storage | Cost (approx) |
|---------|-----|-----|---------|---------------|
| Prometheus | 2 cores | 4GB | 50GB SSD | $20/month |
| Grafana | 1 core | 2GB | 10GB SSD | $10/month |
| Loki | 2 cores | 4GB | 100GB SSD | $25/month |
| Jaeger | 2 cores | 4GB | 50GB SSD | $20/month |
| **Total** | **7 cores** | **14GB** | **210GB** | **$75/month** |

### Development Time
- Phase 3.1: ~1 week (human) / ~30 min (CC)
- Phase 3.2: ~1 week (human) / ~1 hour (CC)
- Phase 3.3: ~1 week (human) / ~30 min (CC)
- Phase 3.4: ~1 week (human) / ~30 min (CC)

---

## Rollout Plan

### Week 1: Phase 3.1
- Day 1-2: Add metric recording calls
- Day 3: Create Grafana dashboards
- Day 4: Set up Prometheus, configure alerts
- Day 5: Test, document, handoff

### Week 2: Phase 3.2
- Day 1-2: Install OpenTelemetry, configure tracing
- Day 3: Instrument key routes
- Day 4: Set up Jaeger, test correlation
- Day 5: Performance testing, optimization

### Week 3: Phase 3.3
- Day 1-2: Set up Loki, add Winston transport
- Day 3: Configure log retention
- Day 4: Create log queries, test correlation
- Day 5: End-to-end testing

### Week 4: Phase 3.4
- Day 1-2: Configure alert notifications
- Day 3: Write runbooks
- Day 4: Load testing, capacity planning
- Day 5: Production deployment

---

## Open Questions

1. **Jaeger Backend**: Should we use Elasticsearch or Cassandra for trace storage?
   - Recommendation: Elasticsearch (easier ops, better for log correlation)

2. **Log Retention**: Is 30 days sufficient for compliance?
   - Depends on regulatory requirements (may need 90+ days)

3. **Trace Sampling**: Should we sample traces in high traffic?
   - Recommendation: Sample 10% of traces in production when QPS > 1000

4. **Multi-Region**: Do we need regional observability stacks?
   - Deferred to Phase 4 (Scalability)

---

## References

- [OpenTelemetry Specification](https://opentelemetry.io/docs/reference/specification/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)

---

**Document Status**: 🟢 Draft for Review
**Next Review**: 2026-04-21
**Approval**: Pending Tech Lead and SRE Lead approval

---

*Last Updated: 2026-03-21*
