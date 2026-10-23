"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyRoutes = void 0;
const express_1 = require("express");
const company_controller_1 = require("../controller/company.controller");
const router = (0, express_1.Router)();
// Create Company + Admin User
router.post('/', company_controller_1.CompanyController.createCompany);
// List All Companies with search, filter, pagination
router.get('/', company_controller_1.CompanyController.getAllCompanies);
// Get Single Company details by ID
router.get('/:id', company_controller_1.CompanyController.getCompanyById);
// Update Company details
router.put('/:id', company_controller_1.CompanyController.updateCompany);
// Toggle Company Active / Inactive status
router.patch('/:id/status', company_controller_1.CompanyController.updateStatus);
// Update Company User Allocation & Breakdown
router.patch('/:id/users', company_controller_1.CompanyController.updateUserAllocation);
// Delete Company
router.delete('/:id', company_controller_1.CompanyController.deleteCompany);
exports.companyRoutes = router;
