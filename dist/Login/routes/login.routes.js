"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_controller_1 = require("../controller/login.controller");
const login_middleware_1 = require("../middleware/login.middleware");
const router = (0, express_1.Router)();
// Public Authentication Endpoints
router.post('/login', login_controller_1.LoginController.login);
router.post('/logout', login_controller_1.LoginController.logout);
router.post('/refresh-token', login_controller_1.LoginController.refreshToken);
router.post('/forgot-password', login_controller_1.LoginController.forgotPassword);
router.post('/reset-password', login_controller_1.LoginController.resetPassword);
// Login Audit Logs Endpoint
router.get('/audit-logs', login_controller_1.LoginController.getLoginAuditLogs);
const login_model_1 = require("../model/login.model");
// Protected Verification Endpoint
router.get('/me', login_middleware_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user?.sub ? await login_model_1.LoginModel.findUserById(req.user.sub) : null;
        res.status(200).json({
            success: true,
            message: 'Session is active and valid.',
            data: {
                user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        role: user.role,
                        companyId: user.subcompany_id || user.company_id || null,
                        companyName: user.company_name || null,
                        companyLogo: user.company_logo || null,
                        subcompanyId: user.subcompany_id || null,
                        isSubcompany: Boolean(user.is_subcompany || user.subcompany_id)
                    }
                    : req.user
            }
        });
    }
    catch {
        res.status(200).json({
            success: true,
            message: 'Session is active and valid.',
            data: {
                user: req.user
            }
        });
    }
});
exports.default = router;
