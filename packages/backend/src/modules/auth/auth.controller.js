"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const elysia_1 = require("elysia");
const index_js_1 = require("../../src/auth/index.js");
const rate_limiter_js_1 = require("../../middleware/rate-limiter.js");
const helmet_js_1 = require("../../middleware/helmet.js");
// Auth controller with Elysia
exports.authController = new elysia_1.Elysia({ prefix: '/auth', name: 'auth-controller' })
    .use(rate_limiter_js_1.authRateLimit)
    .use(helmet_js_1.authSecurityMiddleware)
    // Register endpoint
    .post('/register', async ({ body, set, headers }) => {
    try {
        const result = await index_js_1.AuthService.register(body);
        // Set session cookie
        if (result.session) {
            set.headers = {
                ...set.headers,
                'Set-Cookie': `deepweb_session=${result.session.id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
            };
        }
        set.status = 201;
        return {
            success: true,
            message: "Account created successfully",
            data: {
                user: result.user,
                token: result.token,
                sessionId: result.session.id
            }
        };
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('already exists')) {
            set.status = 409;
            return {
                success: false,
                error: "Conflict",
                message: error.message
            };
        }
        if (error.message.includes('validation') || error.message.includes('Invalid')) {
            set.status = 400;
            return {
                success: false,
                error: "Validation Error",
                message: error.message
            };
        }
        set.status = 500;
        return {
            success: false,
            error: "Registration Failed",
            message: "An error occurred during registration"
        };
    }
}, {
    body: elysia_1.t.Object({
        email: elysia_1.t.String({ format: 'email' }),
        username: elysia_1.t.String({ minLength: 3, maxLength: 50 }),
        password: elysia_1.t.String({ minLength: 8 }),
        displayName: elysia_1.t.Optional(elysia_1.t.String()),
        preferences: elysia_1.t.Optional(elysia_1.t.Record(elysia_1.t.String(), elysia_1.t.Any()))
    }),
    response: {
        201: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            message: elysia_1.t.String(),
            data: elysia_1.t.Object({
                user: elysia_1.t.Object({
                    id: elysia_1.t.String(),
                    email: elysia_1.t.String(),
                    username: elysia_1.t.String(),
                    displayName: elysia_1.t.String(),
                    role: elysia_1.t.String(),
                    isVerified: elysia_1.t.Boolean()
                }),
                token: elysia_1.t.String(),
                sessionId: elysia_1.t.String()
            })
        }),
        400: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        }),
        409: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        })
    }
})
    // Login endpoint
    .post('/login', async ({ body, set }) => {
    try {
        const result = await index_js_1.AuthService.login(body);
        // Set session cookie
        if (result.session) {
            set.headers = {
                ...set.headers,
                'Set-Cookie': `deepweb_session=${result.session.id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
            };
        }
        return {
            success: true,
            message: "Login successful",
            data: {
                user: result.user,
                token: result.token,
                sessionId: result.session.id
            }
        };
    }
    catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid email or password')) {
            set.status = 401;
            return {
                success: false,
                error: "Authentication Failed",
                message: "Invalid email or password"
            };
        }
        set.status = 500;
        return {
            success: false,
            error: "Login Failed",
            message: "An error occurred during login"
        };
    }
}, {
    body: elysia_1.t.Object({
        email: elysia_1.t.String({ format: 'email' }),
        password: elysia_1.t.String({ minLength: 1 })
    }),
    response: {
        200: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            message: elysia_1.t.String(),
            data: elysia_1.t.Object({
                user: elysia_1.t.Object({
                    id: elysia_1.t.String(),
                    email: elysia_1.t.String(),
                    username: elysia_1.t.String(),
                    displayName: elysia_1.t.String(),
                    role: elysia_1.t.String(),
                    isVerified: elysia_1.t.Boolean()
                }),
                token: elysia_1.t.String(),
                sessionId: elysia_1.t.String()
            })
        }),
        401: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        })
    }
})
    // Logout endpoint
    .post('/logout', async ({ headers, set }) => {
    try {
        // Extract session from Authorization header or cookie
        const authHeader = headers.authorization;
        const sessionCookie = headers.cookie?.split(';')
            .find(c => c.trim().startsWith('deepweb_session='))
            ?.split('=')[1];
        let sessionId = null;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtPayload = index_js_1.AuthService.verifyJWT(token);
            sessionId = jwtPayload?.sessionId || null;
        }
        else if (sessionCookie) {
            sessionId = sessionCookie;
        }
        if (sessionId) {
            await index_js_1.AuthService.logout(sessionId);
        }
        // Clear session cookie
        set.headers = {
            ...set.headers,
            'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        };
        return {
            success: true,
            message: "Logout successful"
        };
    }
    catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear the cookie
        set.headers = {
            ...set.headers,
            'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        };
        return {
            success: true,
            message: "Logout completed"
        };
    }
}, {
    response: {
        200: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            message: elysia_1.t.String()
        })
    }
})
    // Get current user
    .get('/me', async ({ headers, set }) => {
    try {
        // Extract session
        const authHeader = headers.authorization;
        const sessionCookie = headers.cookie?.split(';')
            .find(c => c.trim().startsWith('deepweb_session='))
            ?.split('=')[1];
        let sessionId = null;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtPayload = index_js_1.AuthService.verifyJWT(token);
            sessionId = jwtPayload?.sessionId || null;
        }
        else if (sessionCookie) {
            sessionId = sessionCookie;
        }
        if (!sessionId) {
            set.status = 401;
            return {
                success: false,
                error: "Unauthorized",
                message: "No valid session found"
            };
        }
        const result = await index_js_1.AuthService.validateSession(sessionId);
        if (!result) {
            set.status = 401;
            return {
                success: false,
                error: "Unauthorized",
                message: "Invalid session"
            };
        }
        return {
            success: true,
            data: {
                user: result.user,
                session: {
                    id: result.session.id,
                    expiresAt: result.session.expiresAt
                }
            }
        };
    }
    catch (error) {
        console.error('Get user error:', error);
        set.status = 500;
        return {
            success: false,
            error: "Internal Error",
            message: "Failed to get user information"
        };
    }
}, {
    response: {
        200: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            data: elysia_1.t.Object({
                user: elysia_1.t.Object({
                    id: elysia_1.t.String(),
                    email: elysia_1.t.String(),
                    username: elysia_1.t.String(),
                    displayName: elysia_1.t.String(),
                    role: elysia_1.t.String(),
                    isVerified: elysia_1.t.Boolean()
                }),
                session: elysia_1.t.Object({
                    id: elysia_1.t.String(),
                    expiresAt: elysia_1.t.Date()
                })
            })
        }),
        401: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        })
    }
})
    // Change password (requires authentication)
    .post('/change-password', async ({ body, headers, set }) => {
    try {
        // Extract and validate session
        const authHeader = headers.authorization;
        const sessionCookie = headers.cookie?.split(';')
            .find(c => c.trim().startsWith('deepweb_session='))
            ?.split('=')[1];
        let sessionId = null;
        let userId = null;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtPayload = index_js_1.AuthService.verifyJWT(token);
            if (jwtPayload) {
                sessionId = jwtPayload.sessionId;
                userId = jwtPayload.userId;
            }
        }
        else if (sessionCookie) {
            sessionId = sessionCookie;
            const result = await index_js_1.AuthService.validateSession(sessionCookie);
            if (result) {
                userId = result.user.id;
            }
        }
        if (!sessionId || !userId) {
            set.status = 401;
            return {
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            };
        }
        await index_js_1.AuthService.changePassword(userId, body);
        // Clear session cookie since all sessions are invalidated
        set.headers = {
            ...set.headers,
            'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
        };
        return {
            success: true,
            message: "Password changed successfully. Please log in again."
        };
    }
    catch (error) {
        console.error('Change password error:', error);
        if (error.message.includes('Current password is incorrect')) {
            set.status = 400;
            return {
                success: false,
                error: "Invalid Password",
                message: error.message
            };
        }
        if (error.message.includes('validation')) {
            set.status = 400;
            return {
                success: false,
                error: "Validation Error",
                message: error.message
            };
        }
        set.status = 500;
        return {
            success: false,
            error: "Change Password Failed",
            message: "An error occurred while changing password"
        };
    }
}, {
    body: elysia_1.t.Object({
        currentPassword: elysia_1.t.String({ minLength: 1 }),
        newPassword: elysia_1.t.String({ minLength: 8 })
    }),
    response: {
        200: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            message: elysia_1.t.String()
        }),
        400: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        }),
        401: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        })
    }
})
    // Refresh token
    .post('/refresh', async ({ headers, set }) => {
    try {
        const sessionCookie = headers.cookie?.split(';')
            .find(c => c.trim().startsWith('deepweb_session='))
            ?.split('=')[1];
        if (!sessionCookie) {
            set.status = 401;
            return {
                success: false,
                error: "Unauthorized",
                message: "No session found"
            };
        }
        const result = await index_js_1.AuthService.validateSession(sessionCookie);
        if (!result) {
            set.status = 401;
            return {
                success: false,
                error: "Unauthorized",
                message: "Invalid session"
            };
        }
        // Generate new JWT token
        const token = index_js_1.AuthService.generateJWT(result.user.id, result.session.id);
        return {
            success: true,
            message: "Token refreshed successfully",
            data: {
                token,
                user: result.user,
                sessionId: result.session.id
            }
        };
    }
    catch (error) {
        console.error('Refresh token error:', error);
        set.status = 500;
        return {
            success: false,
            error: "Refresh Failed",
            message: "Failed to refresh token"
        };
    }
}, {
    response: {
        200: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            message: elysia_1.t.String(),
            data: elysia_1.t.Object({
                token: elysia_1.t.String(),
                user: elysia_1.t.Object({
                    id: elysia_1.t.String(),
                    email: elysia_1.t.String(),
                    username: elysia_1.t.String(),
                    displayName: elysia_1.t.String(),
                    role: elysia_1.t.String()
                }),
                sessionId: elysia_1.t.String()
            })
        }),
        401: elysia_1.t.Object({
            success: elysia_1.t.Boolean(),
            error: elysia_1.t.String(),
            message: elysia_1.t.String()
        })
    }
});
exports.default = exports.authController;
