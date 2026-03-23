import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authRouter } from '@/routes/auth';
import { datasetsRouter } from '@/routes/datasets';
import { timeseriesRouter } from '@/routes/timeseries';
import { modelsRouter } from '@/routes/models';
import { anomaliesRouter } from '@/routes/anomalies';
import { iotdbRouter } from '@/routes/iotdb';
import apiKeysRouter from '@/routes/apiKeys';
import alertsRouter from '@/routes/alerts';
import healthRouter from '@/routes/health';
import securityRouter from '@/routes/security';
import { errorHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { securityHeaders } from '@/middleware/security';
import {
  authRateLimiter,
  apiRateLimiter,
  apiKeyCreationLimiter,
} from '@/middleware/rateLimiter';
import { optionalAuth } from '@/middleware/auth';
import { config } from './lib';

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

const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = config.server.corsOrigin;

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin?.startsWith(allowed.replace(':3000', '').replace(':3001', '').replace(':3002', '')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Swagger/OpenAPI Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoTDB Enhanced API',
      version: '1.0.0',
      description: 'AI-powered time series database platform with advanced forecasting and anomaly detection capabilities',
      contact: {
        name: 'IoTDB Enhanced Team',
        email: 'support@iotdb-enhanced.com',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.iotdb-enhanced.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details (for validation errors)',
            },
          },
        },
        Timeseries: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Timeseries ID',
            },
            name: {
              type: 'string',
              description: 'Timeseries name',
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement',
            },
            timezone: {
              type: 'string',
              description: 'Timezone',
            },
          },
        },
        PredictionRequest: {
          type: 'object',
          required: ['timeseries', 'horizon'],
          properties: {
            timeseries: {
              type: 'string',
              description: 'Timeseries path (e.g., root.sg1.temp)',
            },
            horizon: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              description: 'Number of time points to predict',
            },
            algorithm: {
              type: 'string',
              enum: ['arima', 'timer_xl', 'sundial', 'holtwinters', 'exponential_smoothing', 'naive_forecaster', 'stl_forecaster'],
              description: 'Prediction algorithm',
            },
            confidenceLevel: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence level for prediction intervals',
            },
          },
        },
        AlertRule: {
          type: 'object',
          required: ['timeseriesId', 'name', 'type', 'condition', 'severity'],
          properties: {
            timeseriesId: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['ANOMALY', 'FORECAST_READY', 'SYSTEM'],
            },
            condition: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['threshold', 'anomaly', 'pattern', 'forecast'],
                },
                operator: {
                  type: 'string',
                  enum: ['>', '<', '=', '!=', '>=', '<='],
                },
                value: {
                  type: 'number',
                },
              },
            },
            severity: {
              type: 'string',
              enum: ['INFO', 'WARNING', 'ERROR'],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Health check routes
app.use('/health', healthRouter);

// Security routes (with optional auth - logs can be submitted without auth)
app.use('/api/security', securityRouter);

// API Documentation - Only in non-production environments
if (config.server.swaggerEnabled) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use('/api-docs', ...([swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })] as any));

  // API JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('📖 API Documentation enabled at /api-docs');
} else {
  logger.info('📖 API Documentation disabled in production');
}

// Routes with security middleware
// Authentication routes with rate limiting
app.use('/api/auth', authRateLimiter, authRouter);

// API routes with rate limiting
app.use('/api/datasets', apiRateLimiter, datasetsRouter);
app.use('/api/timeseries', apiRateLimiter, timeseriesRouter);
app.use('/api/models', apiRateLimiter, modelsRouter);
app.use('/api/anomalies', apiRateLimiter, anomaliesRouter);
app.use('/api/iotdb', apiRateLimiter, iotdbRouter);
app.use('/api/api-keys', apiKeyCreationLimiter, apiKeysRouter);
app.use('/api/alerts', apiRateLimiter, alertsRouter);

// Error handling
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket: any) => {
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

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  if (config.server.swaggerEnabled) {
    logger.info(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  }
  logger.info(`📡 WebSocket server ready`);
});
