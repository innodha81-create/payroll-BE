"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcompanyController = void 0;
const subcompany_service_1 = require("../service/subcompany.service");
class SubcompanyController {
    static async create(req, res) {
        try {
            const parentId = req.body.parent_company_id || req.user?.companyId || req.user?.company_id;
            if (!parentId) {
                res.status(400).json({ success: false, error: 'Parent company ID is required.' });
                return;
            }
            const subcompany = await subcompany_service_1.SubcompanyService.createSubcompany({
                ...req.body,
                parent_company_id: parentId
            });
            res.status(201).json({
                success: true,
                message: 'Subcompany created successfully.',
                data: subcompany
            });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message || 'Failed to create subcompany.' });
        }
    }
    static async getByParent(req, res) {
        try {
            const parentId = req.query.parent_company_id || req.user?.companyId || req.user?.company_id;
            if (!parentId) {
                res.status(400).json({ success: false, error: 'Parent company ID is required.' });
                return;
            }
            const list = await subcompany_service_1.SubcompanyService.getSubcompaniesByParent(parentId);
            res.status(200).json({
                success: true,
                data: list
            });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message || 'Failed to fetch subcompanies.' });
        }
    }
    static async getById(req, res) {
        try {
            const subcompany = await subcompany_service_1.SubcompanyService.getSubcompanyById(req.params.id);
            if (!subcompany) {
                res.status(404).json({ success: false, error: 'Subcompany not found.' });
                return;
            }
            res.status(200).json({ success: true, data: subcompany });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message || 'Failed to fetch subcompany.' });
        }
    }
    static async update(req, res) {
        try {
            const updated = await subcompany_service_1.SubcompanyService.updateSubcompany(req.params.id, req.body);
            if (!updated) {
                res.status(404).json({ success: false, error: 'Subcompany not found.' });
                return;
            }
            res.status(200).json({ success: true, message: 'Subcompany updated successfully.', data: updated });
        }
        catch (err) {
            res.status(400).json({ success: false, error: err.message || 'Failed to update subcompany.' });
        }
    }
    static async toggleStatus(req, res) {
        try {
            const { status } = req.body;
            if (status !== 'Active' && status !== 'Inactive') {
                res.status(400).json({ success: false, error: 'Status must be Active or Inactive.' });
                return;
            }
            const success = await subcompany_service_1.SubcompanyService.updateStatus(req.params.id, status);
            if (!success) {
                res.status(404).json({ success: false, error: 'Subcompany not found.' });
                return;
            }
            res.status(200).json({ success: true, message: `Status updated to ${status}.` });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message || 'Failed to update status.' });
        }
    }
    static async remove(req, res) {
        try {
            const success = await subcompany_service_1.SubcompanyService.deleteSubcompany(req.params.id);
            if (!success) {
                res.status(404).json({ success: false, error: 'Subcompany not found.' });
                return;
            }
            res.status(200).json({ success: true, message: 'Subcompany deleted successfully.' });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message || 'Failed to delete subcompany.' });
        }
    }
}
exports.SubcompanyController = SubcompanyController;
