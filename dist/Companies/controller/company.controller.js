"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const company_service_1 = require("../service/company.service");
class CompanyController {
    /**
     * POST /api/companies
     * Create Company + Admin User
     */
    static async createCompany(req, res) {
        try {
            const dto = req.body;
            const data = await company_service_1.CompanyService.createCompany(dto);
            res.status(201).json({
                success: true,
                message: 'Company and Admin User registered successfully.',
                data
            });
        }
        catch (err) {
            console.error('[CompanyController.createCompany Error]:', err);
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to create company.'
            });
        }
    }
    /**
     * GET /api/companies
     * List all companies with search, pagination, and filter
     */
    static async getAllCompanies(req, res) {
        try {
            const search = req.query.search;
            const status = req.query.status;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const result = await company_service_1.CompanyService.getAllCompanies({ search, status, page, limit });
            res.status(200).json({
                success: true,
                message: 'Companies retrieved successfully.',
                total: result.total,
                page: result.page,
                limit: result.limit,
                data: result.companies
            });
        }
        catch (err) {
            console.error('[CompanyController.getAllCompanies Error]:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve companies.'
            });
        }
    }
    /**
     * GET /api/companies/:id
     * Get single company details with linked admin
     */
    static async getCompanyById(req, res) {
        try {
            const { id } = req.params;
            const data = await company_service_1.CompanyService.getCompanyById(id);
            if (!data) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Company details retrieved successfully.',
                data
            });
        }
        catch (err) {
            console.error('[CompanyController.getCompanyById Error]:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve company details.'
            });
        }
    }
    /**
     * PUT /api/companies/:id
     * Update company details
     */
    static async updateCompany(req, res) {
        try {
            const { id } = req.params;
            const dto = req.body;
            const data = await company_service_1.CompanyService.updateCompany(id, dto);
            if (!data) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found to update.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Company updated successfully.',
                data
            });
        }
        catch (err) {
            console.error('[CompanyController.updateCompany Error]:', err);
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to update company.'
            });
        }
    }
    /**
     * PATCH /api/companies/:id/status
     * Toggle Active / Inactive status
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const success = await company_service_1.CompanyService.updateStatus(id, status);
            if (!success) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Company status updated to ${status}.`
            });
        }
        catch (err) {
            console.error('[CompanyController.updateStatus Error]:', err);
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to update company status.'
            });
        }
    }
    /**
     * PATCH /api/companies/:id/users
     * Update company user allocation and country user breakdown
     */
    static async updateUserAllocation(req, res) {
        try {
            const { id } = req.params;
            const { users, countryUserCounts } = req.body;
            if (users === undefined || isNaN(parseInt(users))) {
                res.status(400).json({
                    success: false,
                    error: 'Valid users count is required.'
                });
                return;
            }
            const data = await company_service_1.CompanyService.updateUserAllocation(id, parseInt(users, 10), countryUserCounts || {});
            if (!data) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found to update users.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Company user allocation updated successfully in database.',
                data
            });
        }
        catch (err) {
            console.error('[CompanyController.updateUserAllocation Error]:', err);
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to update user allocation.'
            });
        }
    }
    /**
     * DELETE /api/companies/:id
     * Delete company
     */
    static async deleteCompany(req, res) {
        try {
            const { id } = req.params;
            const success = await company_service_1.CompanyService.deleteCompany(id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found to delete.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Company deleted successfully.'
            });
        }
        catch (err) {
            console.error('[CompanyController.deleteCompany Error]:', err);
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to delete company.'
            });
        }
    }
}
exports.CompanyController = CompanyController;
