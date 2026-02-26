import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from './routes/auth';
import { datasetsRouter } from './routes/datasets';
import { timeseriesRouter } from './routes/timeseries';
import { modelsRouter } from './routes/models';
import { anomaliesRouter } from './routes/anomalies';
import { iotdbRouter } from './routes/iotdb';
import apiKeysRouter from './routes/apiKeys';
import alertsRouter from './routes/alerts';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { securityHeaders } from './middleware/security';
import { config } from './lib';
import { prometheusMiddleware, metricsEndpoint, healthWithMetrics } from './middleware/prometheus';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/logging';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.server.corsOrigin,
    credentials: true,
  },
});

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = config.server.corsOrigin;

    // Check if origin is exactly in allowed list or starts with an allowed origin (for ports)
    if (allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.some(allowed => origin?.startsWith(allowed.replace(':3000', '').replace(':3001', '').replace(':3002', '')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security middleware
app.use(securityHeaders);

// Production monitoring middleware (only in production)
if (config.server.nodeEnv === 'production') {
  // Prometheus metrics middleware
  app.use(prometheusMiddleware);

  // Enhanced logging middleware
  app.use(...loggingMiddleware);
}

// Error logging middleware
app.use(errorLoggingMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Development request logging
if (config.server.nodeEnv !== 'production') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Health check routes
app.use('/health', healthRouter);

// Metrics endpoint (for Prometheus scraping)
if (config.server.nodeEnv === 'production') {
  app.get('/metrics', metricsEndpoint);
  // Enhanced health check with metrics
  app.get('/health/metrics', healthWithMetrics);
}

// API routes
app.use('/api/auth', authRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/timeseries', timeseriesRouter);
app.use('/api/models', modelsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/iotdb', iotdbRouter);
app.use('/api/api-keys', apiKeysRouter);
app.use('/api/alerts', alertsRouter);

// Error handling
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-timeseries', (timeseriesId: string) => {
    socket.join(`timeseries:${timeseriesId}`);
    logger.info(`Socket ${socket.id} joined timeseries:${timeseriesId}`);
  });

  socket.on('leave-timeseries', (timeseriesId: string) => {
    socket.leave(`timeseries:${timeseriesId}`);
    logger.info(`Socket ${socket.id} left timeseries:${timeseriesId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start server
httpServer.listen(config.server.port, () => {
  logger.info(`🚀 Server running on http://localhost:${config.server.port}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${config.server.nodeEnv}`);
});
