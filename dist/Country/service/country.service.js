"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryService = void 0;
const country_list_1 = __importDefault(require("country-list"));
const country_model_1 = require("../model/country.model");
// country-telephone-data CommonJS export
const { allCountries } = require('country-telephone-data');
class CountryService {
    /**
     * Get all world countries using country-list & country-telephone-data npm packages
     */
    static getWorldCountries() {
        const rawData = country_list_1.default.getData();
        return rawData
            .map((item) => {
            const phoneMatch = allCountries.find((p) => p.iso2 === item.code.toLowerCase());
            return {
                code: item.code,
                name: item.name,
                phoneCode: phoneMatch?.dialCode ? `+${phoneMatch.dialCode}` : undefined
            };
        })
            .sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * Get all active/saved countries from the database for the left table
     */
    static async getAllSavedCountries() {
        const records = await country_model_1.CountryModel.getAllCountries();
        return records.map((r) => {
            if (!r.phone_code && r.code) {
                const match = allCountries.find((c) => c.iso2 === r.code?.toLowerCase());
                if (match?.dialCode) {
                    r.phone_code = `+${match.dialCode}`;
                }
            }
            return r;
        });
    }
    /**
     * Add a new country to the database
     */
    static async addCountry(name, created_by, updated_by) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new Error('Country name is required.');
        }
        const existing = await country_model_1.CountryModel.findByName(trimmedName);
        if (existing) {
            throw new Error(`Country "${trimmedName}" is already added.`);
        }
        // Try finding ISO 2-letter code from country-list
        const code = country_list_1.default.getCode(trimmedName) || null;
        let phoneCode = null;
        if (code) {
            const match = allCountries.find((c) => c.iso2 === code.toLowerCase());
            if (match?.dialCode) {
                phoneCode = `+${match.dialCode}`;
            }
        }
        try {
            return await country_model_1.CountryModel.createCountry(trimmedName, code || undefined, phoneCode || undefined, created_by, updated_by);
        }
        catch (dbErr) {
            if (dbErr.code === '23505') {
                throw new Error(`Country "${trimmedName}" is already added.`);
            }
            throw dbErr;
        }
    }
    /**
     * Delete country by ID
     */
    static async deleteCountry(id) {
        const existing = await country_model_1.CountryModel.findById(id);
        if (!existing) {
            throw new Error('Country not found.');
        }
        const success = await country_model_1.CountryModel.deleteCountry(id);
        if (!success) {
            throw new Error('Failed to delete country.');
        }
    }
}
exports.CountryService = CountryService;
