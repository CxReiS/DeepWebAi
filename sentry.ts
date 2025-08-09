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
