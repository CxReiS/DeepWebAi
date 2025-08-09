# DeepWebAI API - Authentication

This document describes the authentication system for the DeepWebAI API.

## Overview

DeepWebAI uses a secure authentication system powered by OAuth2 (Auth.js / NextAuth) with support for:
- Username/password authentication
- Multi-factor authentication (MFA)
- OAuth providers (GitHub, Discord, Google)
- JWT tokens for API access
- Session management

## Base URL

```
Production: https://api.deepwebai.com
Development: http://localhost:8000
```

## Authentication Flow

### 1. User Registration

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "isVerified": false,
    "role": "user"
  }
}
```

**Error Responses:**
```json
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "An account with this email already exists"
}
```

### 2. Email Verification

Verify email address using the token sent via email.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 3. User Login

Authenticate with email/username and password.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "identifier": "user@example.com",  // email or username
  "password": "securePassword123",
  "mfaCode": "123456"  // required if MFA is enabled
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "role": "user",
    "mfaEnabled": true
  },
  "sessionId": "session_123"
}
```

**MFA Required Response:**
```json
{
  "success": false,
  "error": "MFA_REQUIRED",
  "message": "Multi-factor authentication code required",
  "challengeId": "challenge_123"
}
```

### 4. Multi-Factor Authentication

#### Setup TOTP MFA

**Endpoint:** `POST /api/auth/mfa/setup-totp`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": [
    "backup-code-1",
    "backup-code-2",
    // ... 8 more codes
  ]
}
```

#### Verify TOTP Setup

**Endpoint:** `POST /api/auth/mfa/verify-totp`

**Request Body:**
```json
{
  "code": "123456"
}
```

#### Setup SMS MFA

**Endpoint:** `POST /api/auth/mfa/setup-sms`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS verification code sent"
}
```

#### Verify SMS Setup

**Endpoint:** `POST /api/auth/mfa/verify-sms`

**Request Body:**
```json
{
  "code": "123456"
}
```

### 5. Password Reset

#### Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

### 6. OAuth Authentication

#### Initiate OAuth Flow

**GitHub:** `GET /api/auth/github`
**Discord:** `GET /api/auth/discord`  
**Google:** `GET /api/auth/google`

**Response:** Redirects to OAuth provider

#### OAuth Callback

**GitHub:** `GET /api/auth/github/callback?code=...`
**Discord:** `GET /api/auth/discord/callback?code=...`
**Google:** `GET /api/auth/google/callback?code=...`

**Response:** Redirects to frontend with session or error

### 7. Session Management

#### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "role": "user",
    "mfaEnabled": true,
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  }
}
```

#### Update Profile

**Endpoint:** `PUT /api/auth/profile`

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "bio": "AI enthusiast",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "light",
    "language": "en"
  }
}
```

#### Change Password

**Endpoint:** `PUT /api/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

#### Logout

**Endpoint:** `POST /api/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Logout All Sessions

**Endpoint:** `POST /api/auth/logout-all`

**Response:**
```json
{
  "success": true,
  "message": "Logged out from all sessions"
}
```

## JWT Token Authentication

For API access, you can use JWT tokens instead of session cookies.

### Get JWT Token

**Endpoint:** `POST /api/auth/token`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Refresh JWT Token

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using JWT Tokens

Include the JWT token in the Authorization header:

```http
GET /api/files
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "INVALID_INPUT",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid credentials"
}
```

#### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

#### 429 Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Request validation failed |
| `EMAIL_ALREADY_EXISTS` | Email is already registered |
| `USERNAME_TAKEN` | Username is already taken |
| `INVALID_CREDENTIALS` | Wrong email/password |
| `EMAIL_NOT_VERIFIED` | Email verification required |
| `MFA_REQUIRED` | MFA code required |
| `INVALID_MFA_CODE` | Wrong MFA code |
| `ACCOUNT_LOCKED` | Account temporarily locked |
| `SESSION_EXPIRED` | Session has expired |
| `TOKEN_EXPIRED` | JWT token has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |

## Rate Limiting

Authentication endpoints are rate limited to prevent abuse:

- **Login attempts:** 5 per minute per IP
- **Registration:** 3 per hour per IP
- **Password reset:** 3 per hour per email
- **MFA attempts:** 10 per minute per user

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

## Security Headers

All authentication responses include security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Best Practices

### For Developers

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Implement proper error handling** for all auth states
4. **Handle rate limiting** gracefully with exponential backoff
5. **Validate tokens** on both client and server side
6. **Implement logout** functionality properly
7. **Use refresh tokens** for long-lived applications

### For Users

1. **Enable MFA** for enhanced security
2. **Use strong passwords** (min 8 chars, mixed case, numbers, symbols)
3. **Keep backup codes** safe and accessible
4. **Log out** when done, especially on shared devices
5. **Monitor account activity** regularly

## SDK Examples

### JavaScript/TypeScript

```typescript
import { DeepWebAIAuth } from '@deepwebai/sdk';

const auth = new DeepWebAIAuth({
  baseUrl: 'https://api.deepwebai.com',
  apiKey: 'your-api-key'
});

// Login
const user = await auth.login({
  identifier: 'user@example.com',
  password: 'password123'
});

// Get current user
const currentUser = await auth.getCurrentUser();

// Logout
await auth.logout();
```

### Python

```python
from deepwebai import DeepWebAIAuth

auth = DeepWebAIAuth(
    base_url='https://api.deepwebai.com',
    api_key='your-api-key'
)

# Login
user = auth.login(
    identifier='user@example.com',
    password='password123'
)

# Get current user
current_user = auth.get_current_user()

# Logout
auth.logout()
```

## Testing

Use these test credentials in development:

```json
{
  "email": "test@deepwebai.com",
  "password": "test123456",
  "mfaSecret": "JBSWY3DPEHPK3PXP"
}
```

**Note:** Test credentials only work in development environment.
