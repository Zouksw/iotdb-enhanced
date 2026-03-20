/**
 * IoTDB Enhanced - PM2 Ecosystem Configuration
 *
 * Description: Process management configuration for production deployment
 * Usage:
 *   - Start all: pm2 start ecosystem.config.cjs
 *   - Start specific: pm2 start ecosystem.config.cjs --only backend
 *   - Start in dev: pm2 start ecosystem.config.cjs --env development
 *   - Save: pm2 save
 *   - Startup: pm2 startup
 *
 * Configuration:
 *   - Set PROJECT_ROOT environment variable to override default path
 *   - Set PM2_USER environment variable to override default user (default: node)
 *
 * Author: IoTDB Enhanced Team
 * Version: 1.2.0
 */

const path = require('path');

// Get project root from environment or use current directory
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname);
// Get user from environment or default to 'node' (NOT root for security)
const PM2_USER = process.env.PM2_USER || 'node';

module.exports = {
  apps: [
    {
      name: 'iotdb-backend',
      script: './backend/dist/src/server.js',
      cwd: PROJECT_ROOT,
      instances: 1, // Use single instance (cluster mode has issues with CommonJS)
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8000,
      },
      // Logging
      error_file: path.join(PROJECT_ROOT, './logs/backend-error.log'),
      out_file: path.join(PROJECT_ROOT, './logs/backend-out.log'),
      log_file: path.join(PROJECT_ROOT, './logs/backend-combined.log'),
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Health check
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 1000,
      // Additional options
      pmx: true, // Enable PM2 monitoring
      automation: false, // Disable auto-deployment
      treekill: true, // Kill process tree
    },
    {
      name: 'iotdb-frontend',
      script: './frontend/node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: path.join(PROJECT_ROOT, 'frontend'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      // Logging
      error_file: path.join(PROJECT_ROOT, './logs/frontend-error.log'),
      out_file: path.join(PROJECT_ROOT, './logs/frontend-out.log'),
      log_file: path.join(PROJECT_ROOT, './logs/frontend-combined.log'),
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Health check
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 1000,
      // Additional options
      pmx: true,
      automation: false,
      treekill: true,
    },
  ],

  deploy: {
    production: {
      // SECURITY: Don't run as root user
      user: PM2_USER,
      host: process.env.DEPLOY_HOST || 'your-server.com',
      ref: 'origin/main',
      repo: process.env.GIT_REPO || 'git@github.com:your-org/iotdb-enhanced.git',
      path: PROJECT_ROOT,
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && cd backend && pnpm install && pnpm run build && cd ../frontend && pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
    staging: {
      user: PM2_USER,
      host: process.env.DEPLOY_STAGING_HOST || 'staging.your-server.com',
      ref: 'origin/develop',
      repo: process.env.GIT_REPO || 'git@github.com:your-org/iotdb-enhanced.git',
      path: PROJECT_ROOT,
      'post-deploy': 'pnpm install && cd backend && pnpm install && pnpm run build && cd ../frontend && pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env staging',
    },
  },

  // Additional PM2 modules
  modules: {
    // PM2 Plus monitoring (optional)
    // 'pm2-plus': {
    //   publicKey: 'YOUR_PUBLIC_KEY',
    //   secretKey: 'YOUR_SECRET_KEY',
    // },
  },
};
