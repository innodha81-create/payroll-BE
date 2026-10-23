"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const pricing_model_1 = require("../model/pricing.model");
class PricingService {
    /**
     * Get all pricing records grouped by Root Country
     * Also returns individual raw records
     */
    static async getAllPricings() {
        const records = await pricing_model_1.PricingModel.getAllPricings();
        const summaries = records.map((r) => {
            const pricesObj = r.prices || {};
            return {
                root_country_name: r.root_country_name,
                currency: r.currency,
                total_targets: Object.keys(pricesObj).length,
                prices: pricesObj,
                updated_at: r.updated_at
            };
        });
        return {
            summaries,
            records
        };
    }
    /**
     * Get pricing details for a specific Root Country
     */
    static async getPricingByRootCountry(rootCountryName) {
        return await pricing_model_1.PricingModel.getByRootCountry(rootCountryName);
    }
    /**
     * Bulk Save / Upsert pricing configuration
     */
    static async savePricing(payload) {
        if (!payload.root_country_name || !payload.root_country_name.trim()) {
            throw new Error('Root country name is required.');
        }
        if (!payload.currency || !payload.currency.trim()) {
            throw new Error('Currency is required.');
        }
        const hasPrices = Array.isArray(payload.prices)
            ? payload.prices.length > 0
            : payload.prices && Object.keys(payload.prices).length > 0;
        if (!hasPrices) {
            throw new Error('At least one country price must be provided.');
        }
        return await pricing_model_1.PricingModel.upsertPrices(payload);
    }
    /**
     * Delete pricing by root country
     */
    static async deleteByRootCountry(rootCountryName) {
        const deletedCount = await pricing_model_1.PricingModel.deleteByRootCountry(rootCountryName);
        return deletedCount > 0;
    }
    /**
     * Delete a single pricing record by ID or Country Name
     */
    static async deleteById(id) {
        return await pricing_model_1.PricingModel.deleteById(id);
    }
}
exports.PricingService = PricingService;
