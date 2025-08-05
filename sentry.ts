import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { config } from "../elysia.config";

export function initializeSentry() {
  if (!config.sentryDsn || config.env !== 'production') {
    console.log("Sentry is disabled (DSN not found or not in production).");
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.env,
    release: process.env.npm_package_version || '1.0.0',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performans İzleme
