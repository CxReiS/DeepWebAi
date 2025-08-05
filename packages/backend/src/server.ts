// Remove unused import
import { createServer } from "http";
import dotenv from "dotenv";
import {
  createBaseApp,
  addSecurityMiddleware,
  addDevelopmentMiddleware,
  addProductionMiddleware,
  // addHealthCheck, // Using monitoring healthCheck instead
  addSwaggerDocs,
  validateConfig,
  config
} from "./elysia.config.js";
import { authRouter } from "../modules/auth/auth.router.js";
import { ablyAuthRouter } from "../modules/auth/ably-auth.js";
import { featureFlagsRouter } from "../modules/feature-flags/feature-flags.router.js";
import { featureFlagService } from "../modules/feature-flags/feature-flags.service.js";
import { analyticsRouter } from "./modules/analytics/analytics.router.js";
import { analyticsMiddleware } from "./middleware/analytics.middleware.js";
import websocketPlugin from "../realtime/websocket-server.js";
import { 
  logger, 
  analytics, 
  initSentry, 
  monitoringMiddleware, 
  healthCheck, 
  metricsEndpoint 
} from "./monitoring.js";

// Load environment variables
dotenv.config();

// Initialize monitoring systems
logger.info('Initializing monitoring systems...');

// Initialize feature flags (async)
featureFlagService.initialize()
  .then(() => logger.info('Feature flags initialized'))
  .catch((error) => logger.error('Failed to initialize feature flags:', error as Error));

// Initialize Sentry for error tracking
initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: config.env,
  release: process.env.npm_package_version || '1.0.0',
  sampleRate: config.env === 'production' ? 0.1 : 1.0,
  tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
  beforeSend: (event) => {
    // Filter out health check and other noise
    if (event.request?.url?.includes('/health')) return null;
    if (event.request?.url?.includes('/metrics')) return null;
    return event;
  }
});

logger.info('Sentry initialized for error tracking');

// Set up graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  try {
    await analytics.shutdown();
    await logger.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error as Error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  try {
    await analytics.shutdown();
    await logger.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error as Error);
    process.exit(1);
  }
});

// Validate configuration on startup
validateConfig();

// Create base app
const app = createBaseApp();

// Add monitoring middleware first
app.use(monitoringMiddleware);

// Add analytics middleware
app.use(analyticsMiddleware);

// Add middleware based on environment
addSecurityMiddleware(app);

if (config.env === 'development') {
  addDevelopmentMiddleware(app);
} else if (config.env === 'production') {
  addProductionMiddleware(app);
}

// Add monitoring endpoints
app.use(healthCheck);
app.use(metricsEndpoint);

// Add core features
addSwaggerDocs(app);

// Add route modules
app.use(authRouter);
app.use(ablyAuthRouter);
app.use(featureFlagsRouter);
app.use(analyticsRouter);
app.use(websocketPlugin);

// Root endpoint
app.get("/", () => ({
  message: "DeepWebAI API v1.0.0",
  status: "online",
  environment: config.env,
  timestamp: new Date().toISOString(),
  endpoints: {
    health: "/health",
    auth: "/api/auth",
    docs: config.enableSwagger ? "/docs" : undefined
  }
}));

// API info endpoint
app.get("/api", () => ({
  name: "DeepWebAI API",
  version: "1.0.0",
  description: "AI-powered conversation and content generation API",
  environment: config.env,
  features: {
    authentication: "Lucia Auth with JWT",
    database: "Neon PostgreSQL",
    realtime: "Ably WebSocket",
    websockets: "/ws/chat, /ws/ai-status",
    ai_providers: ["OpenAI", "Anthropic", "DeepSeek", "Google"],
    feature_flags: "Database/GrowthBook integration",
    rate_limiting: true,
    security: "OWASP compliant"
  },
  endpoints: {
    auth: "/api/auth",
    user: "/api/user", 
    chat: "/api/chat",
    models: "/api/models",
    files: "/api/files",
    feature_flags: "/api/feature-flags"
  }
}));

// 404 handler
app.all("*", ({ set }) => {
  set.status = 404;
  return {
    error: "Not Found",
    message: "The requested endpoint does not exist",
    timestamp: new Date().toISOString()
  };
});

// Start server using Node.js HTTP server
const port = config.port;
const host = config.host;

createServer(app.fetch as any).listen(port, () => {
  console.log(`🚀 DeepWebAI API is running at http://${host}:${port}`);
  console.log(`📊 Environment: ${config.env}`);
  console.log(`🔗 Health check: http://${host}:${port}/health`);
  
  if (config.enableSwagger) {
    console.log(`📖 API docs: http://${host}:${port}/docs`);
  }
  
  console.log(`🔐 Auth endpoints: http://${host}:${port}/api/auth`);
  console.log(`✅ Backend başlatıldı (Neon + Lucia Auth + CORS + Security)`);
});
