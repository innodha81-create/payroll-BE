"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingModel = void 0;
const db_1 = require("../../database/db");
class PricingModel {
    static tableInitialized = false;
    static async ensureTableExists() {
        if (this.tableInitialized)
            return;
        const query = `
      CREATE TABLE IF NOT EXISTS country_pricings (
        root_country_name VARCHAR(150) PRIMARY KEY,
        currency VARCHAR(30) NOT NULL,
        prices JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_by VARCHAR(150),
        updated_by VARCHAR(150),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_country_pricings_root ON country_pricings(LOWER(root_country_name));
    `;
        await db_1.pool.query(query);
        this.tableInitialized = true;
    }
    static async getAllPricings() {
        await this.ensureTableExists();
        const query = `
      SELECT cp.* FROM country_pricings cp
      WHERE cp.root_country_name IN (SELECT name FROM countries)
      ORDER BY cp.root_country_name ASC;
    `;
        const res = await db_1.pool.query(query);
        return res.rows;
    }
    static async getByRootCountry(rootCountryName) {
        await this.ensureTableExists();
        const query = `
      SELECT cp.* FROM country_pricings cp
      WHERE LOWER(cp.root_country_name) = LOWER($1)
      LIMIT 1;
    `;
        const res = await db_1.pool.query(query, [rootCountryName.trim()]);
        return res.rows[0] || null;
    }
    static async upsertPrices(payload) {
        await this.ensureTableExists();
        const { root_country_name, currency, prices, created_by, updated_by } = payload;
        const pricesObj = {};
        if (Array.isArray(prices)) {
            for (const item of prices) {
                if (!item.target_country_name)
                    continue;
                const cleanAmount = typeof item.amount === 'string'
                    ? parseFloat(item.amount.replace(/,/g, '')) || 0
                    : item.amount || 0;
                pricesObj[item.target_country_name.trim()] = cleanAmount.toFixed(2);
            }
        }
        else if (prices && typeof prices === 'object') {
            for (const [targetName, val] of Object.entries(prices)) {
                const cleanAmount = typeof val === 'string'
                    ? parseFloat(val.replace(/,/g, '')) || 0
                    : (typeof val === 'number' ? val : 0);
                pricesObj[targetName.trim()] = cleanAmount.toFixed(2);
            }
        }
        const query = `
      INSERT INTO country_pricings (
        root_country_name,
        currency,
        prices,
        created_by,
        updated_by,
        updated_at
      ) VALUES ($1, $2, $3::jsonb, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (root_country_name)
      DO UPDATE SET
        currency = EXCLUDED.currency,
        prices = EXCLUDED.prices,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
        const values = [
            root_country_name.trim(),
            currency.trim(),
            JSON.stringify(pricesObj),
            created_by || 'superadmin',
            updated_by || 'superadmin'
        ];
        const res = await db_1.pool.query(query, values);
        return res.rows[0];
    }
    static async deleteByRootCountry(rootCountryName) {
        await this.ensureTableExists();
        const query = `
      DELETE FROM country_pricings
      WHERE LOWER(root_country_name) = LOWER($1);
    `;
        const res = await db_1.pool.query(query, [rootCountryName.trim()]);
        return res.rowCount || 0;
    }
    static async deleteById(rootCountryName) {
        await this.ensureTableExists();
        const query = `
      DELETE FROM country_pricings
      WHERE LOWER(root_country_name) = LOWER($1);
    `;
        const res = await db_1.pool.query(query, [rootCountryName.trim()]);
        return (res.rowCount || 0) > 0;
    }
}
exports.PricingModel = PricingModel;
