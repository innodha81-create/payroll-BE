"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const pricing_service_1 = require("../service/pricing.service");
class PricingController {
    /**
     * GET /api/pricing/all
     * Returns all pricing summaries and records for Left Card Table
     */
    static async getAllPricings(req, res) {
        try {
            const data = await pricing_service_1.PricingService.getAllPricings();
            res.status(200).json({
                success: true,
                message: 'Pricing records retrieved successfully.',
                data
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve pricing records.'
            });
        }
    }
    /**
     * GET /api/pricing/by-root/:countryName
     * Returns prices for a specific Root Country
     */
    static async getByRootCountry(req, res) {
        try {
            const { countryName } = req.params;
            if (!countryName) {
                res.status(400).json({ success: false, error: 'Country name parameter is required.' });
                return;
            }
            const data = await pricing_service_1.PricingService.getPricingByRootCountry(countryName);
            if (!data) {
                res.status(200).json({
                    success: true,
                    message: `No pricing found for ${countryName}.`,
                    data: null
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Pricing for ${countryName} retrieved successfully.`,
                data
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to retrieve pricing for root country.'
            });
        }
    }
    /**
     * POST /api/pricing/save
     * Save or update pricing matrix
     */
    static async savePricing(req, res) {
        try {
            const payload = req.body;
            const records = await pricing_service_1.PricingService.savePricing(payload);
            res.status(200).json({
                success: true,
                message: `Pricing for ${payload.root_country_name} saved successfully.`,
                data: records
            });
        }
        catch (err) {
            res.status(400).json({
                success: false,
                error: err.message || 'Failed to save pricing.'
            });
        }
    }
    /**
     * DELETE /api/pricing/by-root/:countryName
     * Delete all pricing for a root country
     */
    static async deleteByRootCountry(req, res) {
        try {
            const { countryName } = req.params;
            const deleted = await pricing_service_1.PricingService.deleteByRootCountry(countryName);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: `No pricing found to delete for ${countryName}.`
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Pricing for ${countryName} deleted successfully.`
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to delete pricing.'
            });
        }
    }
    /**
     * DELETE /api/pricing/:id
     * Delete a single pricing record by ID
     */
    static async deleteById(req, res) {
        try {
            const { id } = req.params;
            const deleted = await pricing_service_1.PricingService.deleteById(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Pricing record not found.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Pricing record deleted successfully.'
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error: err.message || 'Failed to delete pricing record.'
            });
        }
    }
}
exports.PricingController = PricingController;
