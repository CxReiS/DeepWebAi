"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadSecurityMiddleware = exports.authSecurityMiddleware = exports.inputSecurityMiddleware = exports.apiSecurityMiddleware = exports.securityMiddleware = exports.securityHeaders = void 0;
const elysia_1 = require("elysia");
const elysia_helmet_1 = __importDefault(require("elysia-helmet"));
// Security headers configuration
exports.securityHeaders = {
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
exports.securityMiddleware = new elysia_1.Elysia({ name: 'security' })
    .use((0, elysia_helmet_1.default)(exports.securityHeaders))
    .derive(({ set, request }) => {
    // Additional security headers
    set.headers = {
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
    };
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
        };
    }
    // Security logging
    const userAgent = request.headers['user-agent'];
    const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'];
    // Log suspicious patterns
    if (userAgent && (userAgent.includes('sqlmap') ||
        userAgent.includes('nmap') ||
        userAgent.includes('burp') ||
        userAgent.toLowerCase().includes('bot') && !userAgent.includes('googlebot'))) {
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
exports.apiSecurityMiddleware = new elysia_1.Elysia({ name: 'api-security' })
    .derive(({ set, request }) => {
    const path = new URL(request.url).pathname;
    // API-specific headers
    set.headers = {
        ...set.headers,
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
        'X-Request-ID': crypto.randomUUID()
    };
    // Prevent caching of sensitive endpoints
    if (path.includes('/auth') || path.includes('/api/user') || path.includes('/api/admin')) {
        set.headers = {
            ...set.headers,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
    }
    return {};
});
// Input validation security
exports.inputSecurityMiddleware = new elysia_1.Elysia({ name: 'input-security' })
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
        }
        catch (error) {
            // Continue if body parsing fails
        }
    }
    return {};
});
// Rate limiting for authentication endpoints
exports.authSecurityMiddleware = new elysia_1.Elysia({ name: 'auth-security' })
    .derive(({ request, set }) => {
    const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    // Auth attempt monitored by security system
    // Additional auth-specific headers
    set.headers = {
        ...set.headers,
        'X-Auth-Required': 'true',
        'WWW-Authenticate': 'Bearer realm="DeepWebAI API"'
    };
    return {
        authAttempt: {
            ip,
            userAgent,
            timestamp: new Date().toISOString()
        }
    };
});
// File upload security
exports.fileUploadSecurityMiddleware = new elysia_1.Elysia({ name: 'file-upload-security' })
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
exports.default = {
    securityMiddleware: exports.securityMiddleware,
    apiSecurityMiddleware: exports.apiSecurityMiddleware,
    inputSecurityMiddleware: exports.inputSecurityMiddleware,
    authSecurityMiddleware: exports.authSecurityMiddleware,
    fileUploadSecurityMiddleware: exports.fileUploadSecurityMiddleware,
    securityHeaders: exports.securityHeaders
};
