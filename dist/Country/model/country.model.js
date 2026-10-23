"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountryModel = void 0;
const db_1 = require("../../database/db");
class CountryModel {
    static tableInitialized = false;
    static async ensureTableExists() {
        if (this.tableInitialized)
            return;
        const query = `
      CREATE TABLE IF NOT EXISTS countries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL UNIQUE,
        code VARCHAR(10),
        phone_code VARCHAR(15),
        created_by VARCHAR(150),
        updated_by VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE countries ADD COLUMN IF NOT EXISTS phone_code VARCHAR(15);
      ALTER TABLE countries ADD COLUMN IF NOT EXISTS created_by VARCHAR(150);
      ALTER TABLE countries ADD COLUMN IF NOT EXISTS updated_by VARCHAR(150);
    `;
        await db_1.pool.query(query);
        this.tableInitialized = true;
    }
    static async getAllCountries() {
        await this.ensureTableExists();
        const query = 'SELECT * FROM countries ORDER BY name ASC';
        const res = await db_1.pool.query(query);
        return res.rows;
    }
    static async findByName(name) {
        await this.ensureTableExists();
        const query = 'SELECT * FROM countries WHERE LOWER(name) = LOWER($1) LIMIT 1';
        const res = await db_1.pool.query(query, [name.trim()]);
        return res.rows[0] || null;
    }
    static async findById(id) {
        await this.ensureTableExists();
        const query = 'SELECT * FROM countries WHERE id = $1 LIMIT 1';
        const res = await db_1.pool.query(query, [id]);
        return res.rows[0] || null;
    }
    static async createCountry(name, code, phone_code, created_by, updated_by) {
        await this.ensureTableExists();
        const query = `
      INSERT INTO countries (name, code, phone_code, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const res = await db_1.pool.query(query, [
            name.trim(),
            code ? code.trim().toUpperCase() : null,
            phone_code ? phone_code.trim() : null,
            created_by ? created_by.trim() : 'superadmin',
            updated_by ? updated_by.trim() : (created_by ? created_by.trim() : 'superadmin')
        ]);
        return res.rows[0];
    }
    static async deleteCountry(id) {
        await this.ensureTableExists();
        const found = await this.findById(id);
        const query = 'DELETE FROM countries WHERE id = $1 RETURNING id;';
        const res = await db_1.pool.query(query, [id]);
        if (found && found.name) {
            try {
                // 1. Delete if it is a root country
                await db_1.pool.query('DELETE FROM country_pricings WHERE LOWER(root_country_name) = LOWER($1);', [found.name.trim()]);
                // 2. Remove as target country key from JSONB in all other root countries
                await db_1.pool.query('UPDATE country_pricings SET prices = prices - $1, updated_at = CURRENT_TIMESTAMP;', [found.name.trim()]);
                // 3. Prune from country_onboarding JSONB if configured
                await db_1.pool.query('UPDATE country_onboarding SET fees = fees - $1, updated_at = CURRENT_TIMESTAMP;', [found.name.trim()]);
            }
            catch (e) {
                console.error('Error cascading country deletion:', e);
            }
        }
        return (res.rowCount ?? 0) > 0;
    }
}
exports.CountryModel = CountryModel;
