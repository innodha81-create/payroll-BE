"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcompanyService = void 0;
const subcompany_model_1 = require("../model/subcompany.model");
class SubcompanyService {
    static async createSubcompany(dto) {
        if (!dto.name || !dto.name.trim()) {
            throw new Error('Subcompany name is required.');
        }
        if (!dto.email || !dto.email.trim()) {
            throw new Error('Subcompany email is required.');
        }
        if (!dto.parent_company_id) {
            throw new Error('Parent company ID is required.');
        }
        return await subcompany_model_1.SubcompanyModel.createSubcompany(dto);
    }
    static async getSubcompaniesByParent(parentCompanyId) {
        return await subcompany_model_1.SubcompanyModel.getSubcompaniesByParent(parentCompanyId);
    }
    static async getSubcompanyById(id) {
        return await subcompany_model_1.SubcompanyModel.getSubcompanyById(id);
    }
    static async updateSubcompany(id, dto) {
        return await subcompany_model_1.SubcompanyModel.updateSubcompany(id, dto);
    }
    static async updateStatus(id, status) {
        return await subcompany_model_1.SubcompanyModel.updateStatus(id, status);
    }
    static async deleteSubcompany(id) {
        return await subcompany_model_1.SubcompanyModel.deleteSubcompany(id);
    }
}
exports.SubcompanyService = SubcompanyService;
