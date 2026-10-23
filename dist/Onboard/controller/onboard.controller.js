"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardController = void 0;
const onboard_service_1 = require("../service/onboard.service");
class OnboardController {
    /**
     * GET /api/onboard/all
     * Returns all onboard records for available countries
     */
    static async getAll(req, res) {
        try {
            const data = await onboard_service_1.OnboardService.getAll();
            res.status(200).json({
                success: true,
                message: 'Onboard records retrieved successfully.',
                data
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve onboard records.'
            });
        }
    }
    /**
     * GET /api/onboard/by-country/:countryName
     * Returns onboard record for specific country
     */
    static async getByCountryName(req, res) {
        try {
            const { countryName } = req.params;
            const data = await onboard_service_1.OnboardService.getByCountryName(countryName);
            if (!data) {
                res.status(200).json({
                    success: true,
                    message: `No onboard configuration found for ${countryName}.`,
                    data: null
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Onboard configuration for ${countryName} retrieved successfully.`,
                data
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve onboard configuration.'
            });
        }
    }
    /**
     * GET /api/onboard/:id
     * Returns onboard record by ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const data = await onboard_service_1.OnboardService.getById(id);
            if (!data) {
                res.status(404).json({
                    success: false,
                    error: 'Onboard record not found.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Onboard record retrieved successfully.',
                data
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve onboard record.'
            });
        }
    }
    /**
     * POST /api/onboard/save
     * Add or upsert onboard fee configuration
     */
    static async save(req, res) {
        try {
            const payload = req.body;
            const record = await onboard_service_1.OnboardService.save(payload);
            res.status(200).json({
                success: true,
                message: `Onboard fee for ${payload.country_name} saved successfully.`,
                data: record
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to save onboard fee.'
            });
        }
    }
    /**
     * PUT /api/onboard/update/:id
     * Update onboard fee configuration by ID
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body;
            const updated = await onboard_service_1.OnboardService.update(id, payload);
            if (!updated) {
                res.status(404).json({
                    success: false,
                    error: 'Onboard record not found to update.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Onboard fee updated successfully.',
                data: updated
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to update onboard fee.'
            });
        }
    }
    /**
     * DELETE /api/onboard/by-country/:countryName
     * Delete onboard fee by country name
     */
    static async deleteByCountryName(req, res) {
        try {
            const { countryName } = req.params;
            const deleted = await onboard_service_1.OnboardService.deleteByCountryName(countryName);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: `No onboard configuration found for ${countryName}.`
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Onboard fee for ${countryName} deleted successfully.`
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to delete onboard fee.'
            });
        }
    }
    /**
     * DELETE /api/onboard/:id
     * Delete onboard record by ID
     */
    static async deleteById(req, res) {
        try {
            const { id } = req.params;
            const deleted = await onboard_service_1.OnboardService.deleteById(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Onboard record not found to delete.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Onboard fee record deleted successfully.'
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to delete onboard record.'
            });
        }
    }
}
exports.OnboardController = OnboardController;
