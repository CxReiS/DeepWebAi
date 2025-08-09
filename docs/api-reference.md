# DeepWebAI API Reference

## Overview

The DeepWebAI API provides comprehensive endpoints for AI-powered conversation, file processing, caching, authentication, and analytics. This reference documents all available endpoints with OpenAPI 3.0 specifications.

**Base URL**: `https://api.deepwebai.com`  
**API Version**: 1.0.0  
**Authentication**: Bearer token, OAuth 2.0, Session-based

---

## Authentication & Authorization

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2025-01-06T00:00:00Z"
    },
    "session": {
      "token": "jwt_token_here",
      "expiresAt": "2025-01-07T00:00:00Z"
    }
  }
}
```

#### POST `/api/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "session": {
      "token": "jwt_token_here",
      "expiresAt": "2025-01-07T00:00:00Z"
    },
    "requiresMfa": false
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "mfaEnabled": true,
    "oauthAccounts": ["github", "discord"],
    "createdAt": "2025-01-06T00:00:00Z",
    "lastLoginAt": "2025-01-06T12:00:00Z"
  }
}
```

### OAuth Endpoints

#### GET `/api/oauth/{provider}`
Initiate OAuth authentication flow.

**Parameters:**
- `provider`: `github` | `discord` | `google` | `twitter`

**Response (302):**
Redirects to OAuth provider authorization URL.

#### GET `/api/oauth/{provider}/callback`
Handle OAuth callback and create session.

**Query Parameters:**
- `code`: Authorization code from provider
- `state`: CSRF protection state

### Multi-Factor Authentication

#### POST `/api/auth/mfa/totp/setup`
Setup TOTP (Time-based One-Time Password) for MFA.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "backupCodes": ["abc123", "def456", "ghi789"]
  }
}
```

#### POST `/api/auth/mfa/verify`
Verify MFA token during authentication.

**Request Body:**
```json
{
  "token": "123456",
  "type": "totp"
}
```

---

## AI Gateway API

### Chat Endpoints

#### POST `/api/ai/chat`
Send a chat message to AI providers with automatic failover.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "model": "gpt-4",
  "provider": "openai",
  "stream": false,
  "maxTokens": 1000,
  "temperature": 0.7
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": {
      "content": "Quantum computing is a revolutionary technology...",
      "usage": {
        "promptTokens": 15,
        "completionTokens": 150,
        "totalTokens": 165
      },
      "provider": "openai",
      "model": "gpt-4",
      "finishReason": "stop"
    },
    "metadata": {
      "requestId": "req_123",
      "processingTime": 2.5,
      "cached": false
    }
  }
}
```

#### POST `/api/ai/chat/stream`
Stream chat responses in real-time.

**Request Body:** Same as `/api/ai/chat` with `"stream": true`

**Response (200 - Server-Sent Events):**
```
data: {"type": "start", "requestId": "req_123"}

data: {"type": "content", "delta": "Quantum"}

data: {"type": "content", "delta": " computing"}

data: {"type": "done", "usage": {"totalTokens": 165}}
```

### Provider Management

#### GET `/api/ai/providers`
Get available AI providers and their status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "openai",
        "status": "healthy",
        "models": ["gpt-4", "gpt-3.5-turbo"],
        "capabilities": ["chat", "stream"],
        "rateLimit": {
          "requests": 3500,
          "remaining": 3450,
          "resetTime": "2025-01-06T01:00:00Z"
        }
      },
      {
        "name": "anthropic",
        "status": "healthy",
        "models": ["claude-3-opus", "claude-3-sonnet"],
        "capabilities": ["chat", "stream"],
        "rateLimit": {
          "requests": 1000,
          "remaining": 995,
          "resetTime": "2025-01-06T01:00:00Z"
        }
      }
    ]
  }
}
```

---

## File Processing API

### File Upload & Processing

#### POST `/api/files/upload`
Upload a file for processing.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File to upload (PDF, DOCX, TXT, images)
- `options`: Processing options (JSON string)

**Example Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer jwt_token_here" \
  -F "file=@document.pdf" \
  -F 'options={"extractImages": true, "ocrLanguage": "eng"}' \
  https://api.deepwebai.com/api/files/upload
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "name": "document.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "status": "uploaded",
      "uploadedAt": "2025-01-06T12:00:00Z"
    },
    "urls": {
      "download": "/api/files/file_123/download",
      "process": "/api/files/file_123/process",
      "status": "/api/files/file_123/status"
    }
  }
}
```

#### POST `/api/files/{fileId}/process`
Start processing an uploaded file.

**Path Parameters:**
- `fileId`: Unique file identifier

**Request Body:**
```json
{
  "type": "text_extraction",
  "options": {
    "extractImages": true,
    "ocrLanguage": "eng",
    "preserveFormatting": true
  }
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_456",
    "status": "processing",
    "estimatedTime": 30,
    "startedAt": "2025-01-06T12:05:00Z"
  }
}
```

---

## Caching API

### Cache Management

#### GET `/api/cache/stats`
Get cache performance statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "memory": {
      "hitRate": 0.85,
      "missRate": 0.15,
      "keys": 1250,
      "memoryUsage": "45MB"
    },
    "redis": {
      "hitRate": 0.92,
      "missRate": 0.08,
      "keys": 15000,
      "memoryUsage": "128MB"
    }
  }
}
```

#### POST `/api/cache/invalidate`
Invalidate cache entries by pattern or tags.

**Request Body:**
```json
{
  "pattern": "user:*",
  "tags": ["auth", "profile"]
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "requestId": "req_123",
    "timestamp": "2025-01-06T12:00:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `AI_PROVIDER_ERROR` | 502 | AI service unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

### Rate Limits by Endpoint

| Endpoint Pattern | Limit | Window |
|------------------|--------|---------|
| `/api/auth/*` | 100 req/hour | Per IP |
| `/api/ai/chat` | 1000 req/hour | Per user |
| `/api/files/upload` | 50 req/hour | Per user |
| `/api/cache/*` | 10000 req/hour | Per user |

---

This API reference covers all major endpoints. For implementation details, see the [Developer Guide](developer_guide/README.md).
