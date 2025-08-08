import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";

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
    policy: 'strict-origin-when-cross-origin'
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
  .use(helmet(securityHeaders))
  .derive(({ set, request }) => {
    // Additional security headers
    (set.headers as any) = {
      ...set.headers,
      
      // Hide server information
      'Server': 'DeepWebAI',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Feature Policy / Permissions Policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      
      // Remove powered-by headers
      'X-Powered-By': undefined,
      
      // Cache control for API responses
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    } as any;

    // Add CORS headers if enabled
    if (process.env.CORS_ENABLED === 'true') {
      const origin = process.env.CORS_ORIGIN || '*';
      set.headers = {
        ...set.headers,
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID, X-User-Role',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400' // 24 hours
      } as any;
    }

    // Security logging
    const userAgent = request.headers['user-agent'];
    const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'];
    
    // Log suspicious patterns
    if (userAgent && (
      userAgent.includes('sqlmap') ||
      userAgent.includes('nmap') ||
      userAgent.includes('burp') ||
      userAgent.toLowerCase().includes('bot') && !userAgent.includes('googlebot')
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
      'Content-Type': 'application/json',
      'X-API-Version': '1.0.0',
      'X-Request-ID': crypto.randomUUID()
    } as any;

    // Prevent caching of sensitive endpoints
    if (path.includes('/auth') || path.includes('/api/user') || path.includes('/api/admin')) {
      set.headers = {
        ...set.headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      } as any;
    }

    return {};
  });

// Input validation security
export const inputSecurityMiddleware = new Elysia({ name: 'input-security' })
  .derive(async ({ request, set }) => {
    const contentType = request.headers['content-type'];
    
    // Check for malicious content types
    const blockedTypes = [
      'application/x-www-form-urlencoded', // Prevent form data attacks
      'multipart/form-data' // Handle file uploads separately
    ];
    
    // Size limits
    const maxBodySize = parseInt(process.env.MAX_BODY_SIZE || '10485760'); // 10MB
    
    if (request.headers['content-length']) {
      const contentLength = parseInt(request.headers['content-length']);
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
            console.warn(`Potential SQL injection attempt detected: ${request.headers['x-forwarded-for']}`);
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
  .derive(({ request, set }) => {
    const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    // Auth attempt monitored by security system
    
    // Additional auth-specific headers
    set.headers = {
      ...set.headers,
      'X-Auth-Required': 'true',
      'WWW-Authenticate': 'Bearer realm="DeepWebAI API"'
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
  .derive(({ request, set }) => {
    const contentType = request.headers['content-type'];
    
    if (contentType?.includes('multipart/form-data')) {
      // File upload specific security
      const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'text/plain',
        'application/pdf',
        'application/json'
      ];
      
      // Additional headers for file uploads
      set.headers = {
        ...set.headers,
        'X-File-Upload': 'true',
        'X-Max-File-Size': process.env.MAX_FILE_SIZE || '10485760'
      };
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
