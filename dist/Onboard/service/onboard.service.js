"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardService = void 0;
const onboard_model_1 = require("../model/onboard.model");
class OnboardService {
    static async getAll() {
        return await onboard_model_1.OnboardModel.getAll();
    }
    static async getByCountryName(countryName) {
        if (!countryName || !countryName.trim()) {
            throw new Error('Country name parameter is required.');
        }
        return await onboard_model_1.OnboardModel.getByCountryName(countryName);
    }
    static async getById(id) {
        if (!id || !id.trim()) {
            throw new Error('ID parameter is required.');
        }
        return await onboard_model_1.OnboardModel.getById(id);
    }
    static async save(payload) {
        if (!payload.country_name || !payload.country_name.trim()) {
            throw new Error('Country name is required.');
        }
        if (!payload.currency || !payload.currency.trim()) {
            throw new Error('Currency is required.');
        }
        if (payload.amount === undefined || payload.amount === null || payload.amount === '') {
            throw new Error('Onboard amount is required.');
        }
        return await onboard_model_1.OnboardModel.upsert(payload);
    }
    static async update(id, payload) {
        if (!id || !id.trim()) {
            throw new Error('ID parameter is required.');
        }
        return await onboard_model_1.OnboardModel.update(id, payload);
    }
    static async deleteById(id) {
        if (!id || !id.trim()) {
            throw new Error('ID parameter is required.');
        }
        return await onboard_model_1.OnboardModel.deleteById(id);
    }
    static async deleteByCountryName(countryName) {
        if (!countryName || !countryName.trim()) {
            throw new Error('Country name parameter is required.');
        }
        return await onboard_model_1.OnboardModel.deleteByCountryName(countryName);
    }
}
exports.OnboardService = OnboardService;
