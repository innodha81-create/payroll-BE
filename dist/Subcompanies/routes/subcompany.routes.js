"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subcompany_controller_1 = require("../controller/subcompany.controller");
const login_middleware_1 = require("../../Login/middleware/login.middleware");
const router = (0, express_1.Router)();
// Subcompanies CRUD endpoints
router.post('/', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.create);
router.get('/', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.getByParent);
router.get('/:id', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.getById);
router.put('/:id', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.update);
router.patch('/:id/status', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.toggleStatus);
router.delete('/:id', login_middleware_1.authenticateToken, subcompany_controller_1.SubcompanyController.remove);
exports.default = router;
