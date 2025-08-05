"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ablyAuthRouter = void 0;
const elysia_1 = require("elysia");
const Ably = __importStar(require("ably"));
const elysia_config_1 = require("../../src/elysia.config");
const auth_service_1 = require("./auth.service"); // Assume this exists
// Ably token generation endpoint
exports.ablyAuthRouter = new elysia_1.Elysia({ name: 'ably-auth' })
    .post('/api/auth/ably-token', async ({ headers, set }) => {
    try {
        // Extract JWT token from Authorization header
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { error: 'Missing or invalid authorization header' };
        }
        const token = authHeader.substring(7);
        // Validate user session (implement this based on your auth system)
        const user = await (0, auth_service_1.getUserFromToken)(token);
        if (!user) {
            set.status = 401;
            return { error: 'Invalid token' };
        }
        // Create Ably client for token generation
        const ablyClient = new Ably.Rest({ key: elysia_config_1.config.ABLY_API_KEY });
        // Generate Ably token with user-specific capabilities
        const tokenRequest = await ablyClient.auth.createTokenRequest({
            clientId: user.id,
            capability: {
                'chat': ['publish', 'subscribe'],
                'notifications': ['subscribe'],
                'ai-status': ['subscribe'],
                'user-presence': ['publish', 'subscribe', 'presence'],
            },
            ttl: 3600000, // 1 hour
        });
        return tokenRequest;
    }
    catch (error) {
        console.error('Ably token generation error:', error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
})
    .get('/api/auth/ably-token', async ({ query, set }) => {
    // Support GET requests for simpler client integration
    const { token } = query;
    if (!token) {
        set.status = 401;
        return { error: 'Missing token parameter' };
    }
    try {
        const user = await (0, auth_service_1.getUserFromToken)(token);
        if (!user) {
            set.status = 401;
            return { error: 'Invalid token' };
        }
        const ablyClient = new Ably.Rest({ key: elysia_config_1.config.ABLY_API_KEY });
        const tokenRequest = await ablyClient.auth.createTokenRequest({
            clientId: user.id,
            capability: {
                'chat': ['publish', 'subscribe'],
                'notifications': ['subscribe'],
                'ai-status': ['subscribe'],
                'user-presence': ['publish', 'subscribe', 'presence'],
            },
            ttl: 3600000,
        });
        return tokenRequest;
    }
    catch (error) {
        console.error('Ably token generation error:', error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
});
