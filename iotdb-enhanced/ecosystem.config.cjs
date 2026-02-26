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
 * Author: IoTDB Enhanced Team
 * Version: 1.0.0
 */

module.exports = {
  apps: [
    {
      name: 'iotdb-backend',
      script: './backend/dist/src/server.js',
      cwd: '/root/iotdb-enhanced',
      instances: 1, // Use 'max' for cluster mode with CPU cores
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8002,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8002,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8002,
      },
      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health check
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Additional options
      pmx: true, // Enable PM2 monitoring
      automation: false, // Disable auto-deployment
      treekill: true, // Kill process tree
    },
    {
      name: 'iotdb-frontend',
      script: './frontend/node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/iotdb-enhanced/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
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
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health check
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Additional options
      pmx: true,
      automation: false,
      treekill: true,
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/iotdb-enhanced.git',
      path: '/root/iotdb-enhanced',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && cd backend && npm install && npm run build && cd ../frontend && pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'root',
      host: 'staging.your-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/iotdb-enhanced.git',
      path: '/root/iotdb-enhanced',
      'post-deploy': 'npm install && cd backend && npm install && npm run build && cd ../frontend && pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env staging',
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
