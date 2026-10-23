"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRoles = requireRoles;
const token_utils_1 = require("../utils/token.utils");
const db_1 = require("../../database/db");
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;
    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Access denied. No authentication token provided.'
        });
        return;
    }
    try {
        const payload = (0, token_utils_1.verifyAccessToken)(token);
        // Instant Blacklist Check (Logout Revocation)
        const blacklistCheck = await db_1.pool.query('SELECT 1 FROM token_blacklist WHERE jti = $1 AND expires_at > NOW()', [payload.jti]);
        if (blacklistCheck.rowCount && blacklistCheck.rowCount > 0) {
            res.status(401).json({
                success: false,
                error: 'Token has been revoked/blacklisted. Please log in again.'
            });
            return;
        }
        req.user = payload;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token has expired. Please refresh your session.'
            });
            return;
        }
        res.status(403).json({
            success: false,
            error: 'Invalid or tampered authentication token.'
        });
    }
}
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: `Forbidden. Requires one of the following roles: ${roles.join(', ')}`
            });
            return;
        }
        next();
    };
}
