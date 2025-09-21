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
import { helmet } from "elysia-helmet";
import crypto from "node:crypto";

// Security headers configuration
export const securityHeaders = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for some frameworks
        "'unsafe-eval'", // Be careful with this in production
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.anthropic.com",
        "https://api.deepseek.com",
        "https://generativelanguage.googleapis.com",
        "wss://realtime.ably.io",
        "https://rest.ably.io"
      ],
      mediaSrc: ["'self'", "blob:", "data:"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined
    }
  },

  // HTTP Strict Transport Security
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin' as const
  },

  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    accelerometer: [],
    gyroscope: []
  }
};

// Enhanced security middleware
export const securityMiddleware = new Elysia({ name: 'security' })
  // Türkçe Açıklama: elysia-helmet tipleriyle uyuşmayan alanlar sorun çıkardığı için varsayılan helmet() kullanıyoruz.
  .use(helmet())
  .derive(({ set, headers }) => {
    // Additional security headers
    set.headers = {
      ...set.headers,

      // Hide server information
      'server': 'DeepWebAI',

      // Prevent MIME type sniffing
      'x-content-type-options': 'nosniff',

      // Prevent clickjacking
      'x-frame-options': 'DENY',

      // XSS Protection
      'x-xss-protection': '1; mode=block',

      // Referrer Policy
      'referrer-policy': 'strict-origin-when-cross-origin',

      // Feature Policy / Permissions Policy
      'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',

      // Cache control for API responses
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'pragma': 'no-cache',
      'expires': '0',
      'surrogate-control': 'no-store'
    } as any;

    // Add CORS headers if enabled
    if (process.env.CORS_ENABLED === 'true') {
      const origin = process.env.CORS_ORIGIN || '*';
      set.headers = {
        ...set.headers,
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Role',
        'access-control-allow-credentials': 'true',
        'access-control-max-age': '86400' // 24 hours
      } as any;
    }

    // Security logging
    const userAgent = headers['user-agent'];
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];

    // Log suspicious patterns
    if (userAgent && (
      userAgent.includes('sqlmap') ||
      userAgent.includes('nmap') ||
      userAgent.includes('burp') ||
      (userAgent.toLowerCase().includes('bot') && !userAgent.includes('googlebot'))
    )) {
      console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${ip}`);
    }

    return {
      security: {
        ip,
        userAgent,
        timestamp: new Date().toISOString()
      }
    };
  });

// API-specific security middleware
export const apiSecurityMiddleware = new Elysia({ name: 'api-security' })
  .derive(({ set, request }) => {
    const path = new URL(request.url).pathname;

    // API-specific headers
    set.headers = {
      ...set.headers,
      'content-type': 'application/json',
      'x-api-version': '1.0.0',
      'x-request-id': crypto.randomUUID()
    } as any;

    // Prevent caching of sensitive endpoints
    if (path.includes('/auth') || path.includes('/api/user') || path.includes('/api/admin')) {
      set.headers = {
        ...set.headers,
        'cache-control': 'no-store, no-cache, must-revalidate, private',
        'pragma': 'no-cache',
        'expires': '0'
      } as any;
    }

    return {};
  });

// Input validation security
export const inputSecurityMiddleware = new Elysia({ name: 'input-security' })
  .derive(async ({ request, headers, set }) => {
    const contentType = headers['content-type'] || request.headers.get('content-type') || '';

    // Check for malicious content types
    const blockedTypes = [
      'application/x-www-form-urlencoded', // Prevent form data attacks
      'multipart/form-data' // Handle file uploads separately
    ];

    // Size limits
    const maxBodySize = parseInt(process.env.MAX_BODY_SIZE || '10485760'); // 10MB

    const contentLengthHeader = headers['content-length'] || request.headers.get('content-length');
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader);
      if (contentLength > maxBodySize) {
        set.status = 413;
        return {
          error: 'Payload Too Large',
          message: `Request body size ${contentLength} exceeds limit of ${maxBodySize} bytes`
        };
      }
    }

    // Basic SQL injection detection
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      try {
        const body = await request.text();
        const sqlPatterns = [
          /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/gi,
          /(--|\#|\/\*|\*\/)/gi,
          /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/gi
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(body)) {
            console.warn(`Potential SQL injection attempt detected: ${headers['x-forwarded-for']}`);
            set.status = 400;
            return {
              error: 'Invalid Input',
              message: 'Request contains potentially malicious content'
            };
          }
        }
      } catch (error) {
        // Continue if body parsing fails
      }
    }

    return {};
  });

// Rate limiting for authentication endpoints
export const authSecurityMiddleware = new Elysia({ name: 'auth-security' })
  .derive(({ headers, set }) => {
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    const userAgent = headers['user-agent'] || 'unknown';

    // Additional auth-specific headers
    set.headers = {
      ...set.headers,
      'x-auth-required': 'true',
      'www-authenticate': 'Bearer realm="DeepWebAI API"'
    } as any;

    return {
      authAttempt: {
        ip,
        userAgent,
        timestamp: new Date().toISOString()
      }
    };
  });

// File upload security
export const fileUploadSecurityMiddleware = new Elysia({ name: 'file-upload-security' })
  .derive(({ headers, set }) => {
    const contentType = headers['content-type'];

    if (contentType?.includes('multipart/form-data')) {
      // File upload specific security
      // Additional headers for file uploads
      set.headers = {
        ...set.headers,
        'x-file-upload': 'true',
        'x-max-file-size': process.env.MAX_FILE_SIZE || '10485760'
      } as any;
    }

    return {};
  });

export default {
  securityMiddleware,
  apiSecurityMiddleware,
  inputSecurityMiddleware,
  authSecurityMiddleware,
  fileUploadSecurityMiddleware,
  securityHeaders
};
