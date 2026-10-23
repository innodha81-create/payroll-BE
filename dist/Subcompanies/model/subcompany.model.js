"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubcompanyModel = void 0;
const db_1 = require("../../database/db");
class SubcompanyModel {
    static tableInitialized = false;
    static async ensureTableExists() {
        if (this.tableInitialized)
            return;
        const query = `
      CREATE TABLE IF NOT EXISTS subcompanies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_company_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        country VARCHAR(100) NOT NULL,
        logo TEXT,
        status VARCHAR(20) DEFAULT 'Active',
        address_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        tax_compliance_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        admin_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_subcompanies_parent ON subcompanies(parent_company_id);
      CREATE INDEX IF NOT EXISTS idx_subcompanies_name ON subcompanies(LOWER(name));
      CREATE INDEX IF NOT EXISTS idx_subcompanies_status ON subcompanies(status);
    `;
        await db_1.pool.query(query);
        this.tableInitialized = true;
    }
    static async createSubcompany(dto) {
        await this.ensureTableExists();
        const addressInfo = {
            streetAddress: dto.streetAddress || '',
            city: dto.city || '',
            state: dto.state || '',
            country: dto.country || '',
            pincode: dto.pincode || ''
        };
        const taxComplianceInfo = {
            uen: dto.uen || '',
            companyType: dto.companyType || '',
            pan: dto.pan || '',
            gst: dto.gst || ''
        };
        const adminInfo = {
            firstName: dto.firstName || '',
            lastName: dto.lastName || '',
            email: dto.adminEmail || dto.email || '',
            phone: dto.adminPhone || dto.phone || ''
        };
        const sql = `
      INSERT INTO subcompanies (
        parent_company_id, name, email, phone, country, logo, status,
        address_info, tax_compliance_info, admin_info, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `;
        const res = await db_1.pool.query(sql, [
            dto.parent_company_id,
            dto.name.trim(),
            dto.email.trim(),
            dto.phone ? dto.phone.trim() : null,
            dto.country.trim(),
            dto.logo || null,
            dto.status || 'Active',
            JSON.stringify(addressInfo),
            JSON.stringify(taxComplianceInfo),
            JSON.stringify(adminInfo)
        ]);
        return res.rows[0];
    }
    static async getSubcompaniesByParent(parentCompanyId) {
        await this.ensureTableExists();
        const sql = `
      SELECT * FROM subcompanies
      WHERE parent_company_id = $1
      ORDER BY created_at DESC;
    `;
        const res = await db_1.pool.query(sql, [parentCompanyId]);
        return res.rows;
    }
    static async getSubcompanyById(id) {
        await this.ensureTableExists();
        const sql = `SELECT * FROM subcompanies WHERE id = $1 LIMIT 1;`;
        const res = await db_1.pool.query(sql, [id]);
        return res.rows[0] || null;
    }
    static async updateSubcompany(id, dto) {
        await this.ensureTableExists();
        const existingRes = await db_1.pool.query('SELECT * FROM subcompanies WHERE id = $1', [id]);
        if (!existingRes.rows[0])
            return null;
        const existing = existingRes.rows[0];
        const existingAddr = existing.address_info || {};
        const existingTax = existing.tax_compliance_info || {};
        const existingAdmin = existing.admin_info || {};
        const addressInfo = {
            streetAddress: dto.streetAddress ?? existingAddr.streetAddress,
            city: dto.city ?? existingAddr.city,
            state: dto.state ?? existingAddr.state,
            country: dto.country ?? existingAddr.country,
            pincode: dto.pincode ?? existingAddr.pincode
        };
        const taxComplianceInfo = {
            uen: dto.uen ?? existingTax.uen,
            companyType: dto.companyType ?? existingTax.companyType,
            pan: dto.pan ?? existingTax.pan,
            gst: dto.gst ?? existingTax.gst
        };
        const adminInfo = {
            firstName: dto.firstName ?? existingAdmin.firstName,
            lastName: dto.lastName ?? existingAdmin.lastName,
            email: dto.adminEmail ?? existingAdmin.email,
            phone: dto.adminPhone ?? existingAdmin.phone
        };
        const sql = `
      UPDATE subcompanies
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        country = COALESCE($4, country),
        logo = COALESCE($5, logo),
        status = COALESCE($6, status),
        address_info = $7,
        tax_compliance_info = $8,
        admin_info = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `;
        const res = await db_1.pool.query(sql, [
            dto.name ? dto.name.trim() : null,
            dto.email ? dto.email.trim() : null,
            dto.phone ? dto.phone.trim() : null,
            dto.country ? dto.country.trim() : null,
            dto.logo || null,
            dto.status || null,
            JSON.stringify(addressInfo),
            JSON.stringify(taxComplianceInfo),
            JSON.stringify(adminInfo),
            id
        ]);
        return res.rows[0] || null;
    }
    static async updateStatus(id, status) {
        await this.ensureTableExists();
        const res = await db_1.pool.query('UPDATE subcompanies SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id;', [status, id]);
        return (res.rowCount ?? 0) > 0;
    }
    static async deleteSubcompany(id) {
        await this.ensureTableExists();
        const res = await db_1.pool.query('DELETE FROM subcompanies WHERE id = $1;', [id]);
        return (res.rowCount ?? 0) > 0;
    }
    static async cascadeInactiveByParent(parentCompanyId) {
        await this.ensureTableExists();
        const res = await db_1.pool.query("UPDATE subcompanies SET status = 'Inactive', updated_at = NOW() WHERE parent_company_id = $1;", [parentCompanyId]);
        return res.rowCount ?? 0;
    }
}
exports.SubcompanyModel = SubcompanyModel;
