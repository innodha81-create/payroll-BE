"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const company_model_1 = require("../model/company.model");
class CompanyService {
    static async createCompany(dto) {
        if (!dto.name || !dto.name.trim()) {
            throw new Error('Company Legal Name is required.');
        }
        if (!dto.country || !dto.country.trim()) {
            throw new Error('Country is required.');
        }
        if (!dto.email || !dto.email.trim()) {
            throw new Error('Company Admin Email is required.');
        }
        return await company_model_1.CompanyModel.createCompany(dto);
    }
    static async getAllCompanies(options = {}) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 50));
        const offset = (page - 1) * limit;
        const { total, companies } = await company_model_1.CompanyModel.getAllCompanies({
            search: options.search,
            status: options.status,
            limit,
            offset
        });
        return { total, page, limit, companies };
    }
    static async getCompanyById(id) {
        if (!id)
            throw new Error('Company ID is required.');
        return await company_model_1.CompanyModel.getCompanyById(id);
    }
    static async updateCompany(id, dto) {
        if (!id)
            throw new Error('Company ID is required.');
        return await company_model_1.CompanyModel.updateCompany(id, dto);
    }
    static async updateUserAllocation(id, users, countryUserCounts) {
        if (!id)
            throw new Error('Company ID is required.');
        if (typeof users !== 'number' || users < 1) {
            throw new Error('Total users must be at least 1.');
        }
        return await company_model_1.CompanyModel.updateUserAllocation(id, users, countryUserCounts);
    }
    static async updateStatus(id, status) {
        if (!id)
            throw new Error('Company ID is required.');
        if (status !== 'Active' && status !== 'Inactive') {
            throw new Error("Status must be either 'Active' or 'Inactive'.");
        }
        return await company_model_1.CompanyModel.updateStatus(id, status);
    }
    static async deleteCompany(id) {
        if (!id)
            throw new Error('Company ID is required.');
        return await company_model_1.CompanyModel.deleteCompany(id);
    }
}
exports.CompanyService = CompanyService;
