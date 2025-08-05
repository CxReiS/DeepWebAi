"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.sql = void 0;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getCurrentBranch = getCurrentBranch;
exports.getComputeSettings = getComputeSettings;
// Enhanced Neon client with branch and compute configuration
const serverless_1 = require("@neondatabase/serverless");
const neon_config_js_1 = require("../../../database/neon-config.js");
// Configure Neon with branch and compute settings
(0, neon_config_js_1.configureNeon)();
// Get environment-specific configuration
const config = (0, neon_config_js_1.getCurrentNeonConfig)();
// Create SQL client
exports.sql = (0, serverless_1.neon)(config.databaseUrl);
// Create connection pool for heavy operations
exports.pool = new serverless_1.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});
// Health check function
async function checkDatabaseHealth() {
    try {
        const result = await (0, exports.sql) `SELECT 1 as health`;
        return result.length > 0;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
// Branch information
function getCurrentBranch() {
    return config.branchName || 'main';
}
// Compute settings
function getComputeSettings() {
    return {
        size: config.computeSize,
        autoSuspend: config.autoSuspend,
        minCu: config.minCu,
        maxCu: config.maxCu
    };
}
