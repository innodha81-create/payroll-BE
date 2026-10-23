"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const login_service_1 = require("../service/login.service");
const login_model_1 = require("../model/login.model");
const audit_utils_1 = require("../utils/audit.utils");
class LoginController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required.'
                });
                return;
            }
            const clientDetails = (0, audit_utils_1.parseClientDetails)(req);
            const result = await login_service_1.LoginService.login({ email, password }, clientDetails);
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    tokenType: result.tokens.tokenType,
                    expiresIn: result.tokens.expiresIn
                }
            });
        }
        catch (err) {
            res.status(401).json({
                success: false,
                error: err.message || 'Login failed.'
            });
        }
    }
    static async logout(req, res) {
        try {
            const authHeader = req.headers['authorization'];
            const accessToken = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : null;
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || null;
            const clientDetails = (0, audit_utils_1.parseClientDetails)(req);
            const result = await login_service_1.LoginService.logout(accessToken, refreshToken, clientDetails);
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            res.status(200).json({
                success: true,
                message: result.message
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Logout failed.'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    error: 'Refresh token is required.'
                });
                return;
            }
            const clientDetails = (0, audit_utils_1.parseClientDetails)(req);
            const result = await login_service_1.LoginService.rotateRefreshToken(refreshToken, clientDetails);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({
                success: true,
                message: 'Token rotated successfully.',
                data: {
                    accessToken: result.accessToken,
                    tokenType: 'Bearer',
                    expiresIn: result.expiresIn
                }
            });
        }
        catch (err) {
            res.status(401).json({
                success: false,
                error: err.message || 'Failed to refresh token.'
            });
        }
    }
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email address is required.'
                });
                return;
            }
            const clientDetails = (0, audit_utils_1.parseClientDetails)(req);
            const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
            const result = await login_service_1.LoginService.forgotPassword({ email }, clientDetails, origin);
            res.status(200).json({
                success: true,
                message: result.message
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to process request.'
            });
        }
    }
    static async resetPassword(req, res) {
        try {
            const { token, newPassword, confirmPassword } = req.body;
            if (!token || !newPassword || !confirmPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Token, new password, and confirm password are required.'
                });
                return;
            }
            const clientDetails = (0, audit_utils_1.parseClientDetails)(req);
            const result = await login_service_1.LoginService.resetPassword({ token, newPassword, confirmPassword }, clientDetails);
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    expiresIn: result.tokens.expiresIn
                }
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to reset password.'
            });
        }
    }
    static async getLoginAuditLogs(req, res) {
        try {
            const { search, status, limit, offset } = req.query;
            const data = await login_model_1.LoginModel.getLoginAuditLogs({
                search: search ? String(search) : undefined,
                status: status ? String(status) : undefined,
                limit: limit ? parseInt(String(limit), 10) : 50,
                offset: offset ? parseInt(String(offset), 10) : 0
            });
            res.status(200).json({
                success: true,
                data: data.logs,
                total: data.total
            });
        }
        catch (err) {
            console.error('[LoginController.getLoginAuditLogs Error]:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to fetch login audit logs.',
                data: []
            });
        }
    }
}
exports.LoginController = LoginController;
