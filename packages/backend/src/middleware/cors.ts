import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

// CORS configuration based on environment
const getCorsOrigins = () => {
  const origins = process.env.CORS_ORIGIN || "http://localhost:3000";
  
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
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining', 
      'X-RateLimit-Reset',
      'X-Request-ID',
      'X-API-Version'
    ],
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400'), // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  }))
  .derive(({ request, set }) => {
    const origin = request.headers.origin;
    const method = request.method;
    
    // CORS validation in progress
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      set.status = 204;
      set.headers = {
        ...set.headers,
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Role',
        'Access-Control-Max-Age': '86400'
      };
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
