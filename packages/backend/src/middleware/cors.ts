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

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

// CORS configuration based on environment
const getCorsOrigins = () => {
  // Production için IP adresi eklendi: 34.69.217.64
  // Not: CORS_ORIGIN env değişkeni tanımlıysa o değer kullanılır; değilse aşağıdaki varsayılan liste geçerlidir.
  const origins = process.env.CORS_ORIGIN || "http://localhost:3000,http://34.69.217.64:3000";
  
  if (origins === "*") {
    return true; // Allow all origins (development only)
  }
  
  // Split multiple origins by comma
  const originList = origins.split(',').map(origin => origin.trim());
  
  return originList.length === 1 ? originList[0] : originList;
};

// Enhanced CORS middleware
export const corsMiddleware = new Elysia({ name: 'cors' })
  .use(cors({
    origin: getCorsOrigins(),
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-User-ID',
      'X-User-Role',
      'X-API-Key',
      'X-Request-ID',
      'Cache-Control'
    ],
    exposeHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining', 
      'X-RateLimit-Reset',
      'X-Request-ID',
      'X-API-Version'
    ],
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400') // 24 hours
    // Türkçe Açıklama: @elysiajs/cors içinde Express'teki 'preflightContinue' ve 'optionsSuccessStatus' alanları yoktur.
  }))
  .derive(({ request, headers, set }) => {
    // Türkçe Açıklama: Fetch Headers objesinde 'origin' doğrudan property değildir, Elysia context'teki 'headers' map kullanılmalıdır.
    const origin = headers.origin || request.headers.get('origin') || '*';
    const method = request.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      set.status = 204;
      set.headers = {
        ...set.headers,
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Role',
        'access-control-max-age': '86400'
      } as any;
      return new Response(null, { status: 204 });
    }

    return {};
  });

// Development CORS (allows all origins)
export const devCorsMiddleware = new Elysia({ name: 'dev-cors' })
  .use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization', 
      'X-Requested-With',
      'X-User-ID',
      'X-User-Role',
      'X-API-Key'
    ]
  }));

// Production CORS (strict origins)
export const prodCorsMiddleware = new Elysia({ name: 'prod-cors' })
  .use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'https://deepweb.ai',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-User-ID'
    ]
  }));

export default {
  corsMiddleware,
  devCorsMiddleware,
  prodCorsMiddleware
};
