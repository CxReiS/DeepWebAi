/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// PM2 Ecosystem Configuration for DeepWebAI
module.exports = {
  apps: [
    {
      name: 'deepwebai-backend',
      script: './packages/backend/dist/server.js',
      cwd: './packages/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8000,
        HOST: 'localhost'
      },
      // Logging
      log_file: './logs/deepwebai-backend.log',
      error_file: './logs/deepwebai-backend-error.log',
      out_file: './logs/deepwebai-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '512M',
      
      // Monitoring
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Health check
      health_check_grace_period: 3000,
      
      // Environment variables
      env_file: '.env'
    },
    {
      name: 'deepwebai-frontend',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000',
      cwd: './packages/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        HOST: 'localhost'
      },
      
      // Logging
      log_file: './logs/deepwebai-frontend.log',
      error_file: './logs/deepwebai-frontend-error.log',
      out_file: './logs/deepwebai-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 2000,
      
      // Memory management
      max_memory_restart: '256M',
      
      // Monitoring
      autorestart: true,
      watch: false
    },
    {
      name: 'deepwebai-file-processor',
      script: './packages/file-processing/dist/worker.js',
      cwd: './packages/file-processing',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'file-processor'
      },
      
      // Logging
      log_file: './logs/deepwebai-file-processor.log',
      error_file: './logs/deepwebai-file-processor-error.log',
      out_file: './logs/deepwebai-file-processor-out.log',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 5000,
      
      // Memory management
      max_memory_restart: '1G',
      
      autorestart: true,
      watch: false
    },
    {
      name: 'deepwebai-ai-gateway',
      script: './packages/ai-gateway/dist/gateway.js',
      cwd: './packages/ai-gateway',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        SERVICE_NAME: 'ai-gateway'
      },
      
      // Logging
      log_file: './logs/deepwebai-ai-gateway.log',
      error_file: './logs/deepwebai-ai-gateway-error.log',
      out_file: './logs/deepwebai-ai-gateway-out.log',
      
      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 3000,
      
      // Memory management
      max_memory_restart: '512M',
      
      autorestart: true,
      watch: false
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/CxReiS/DeepWebAi.git',
      path: '/var/www/deepwebai',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/CxReiS/DeepWebAi.git',
      path: '/var/www/deepwebai-staging',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env development',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
};
