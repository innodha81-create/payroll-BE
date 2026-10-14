import { pool } from '../../database/db';
import { OnboardRecord, SaveOnboardPayload, UpdateOnboardPayload } from '../types/onboard.types';

export class OnboardModel {
  private static tableInitialized = false;

  public static async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;
    const query = `
      CREATE TABLE IF NOT EXISTS country_onboarding (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        fees JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    this.tableInitialized = true;
  }

  public static async getAll(): Promise<OnboardRecord[]> {
    await this.ensureTableExists();
    const query = `SELECT fees FROM country_onboarding WHERE id = 'default' LIMIT 1;`;
    const res = await pool.query(query);
    if (!res.rows[0] || !res.rows[0].fees) return [];

    const feesObj: Record<string, any> = res.rows[0].fees;

    // Filter to only include countries that currently exist in master countries table
    const countriesRes = await pool.query('SELECT name FROM countries;');
    const validCountryNames = new Set(
      countriesRes.rows.map((r: any) => r.name.toLowerCase())
    );

    const list: OnboardRecord[] = [];
    for (const [countryName, detail] of Object.entries(feesObj)) {
      if (validCountryNames.has(countryName.toLowerCase())) {
        list.push({
          id: countryName,
          country_name: countryName,
          currency: detail?.currency || 'USD',
          amount: detail?.amount || '0.00',
          updated_at: detail?.updated_at
        });
      }
    }

    return list.sort((a, b) => a.country_name.localeCompare(b.country_name));
  }

  public static async getByCountryName(countryName: string): Promise<OnboardRecord | null> {
    await this.ensureTableExists();
    const query = `SELECT fees FROM country_onboarding WHERE id = 'default' LIMIT 1;`;
    const res = await pool.query(query);
    if (!res.rows[0] || !res.rows[0].fees) return null;

    const feesObj: Record<string, any> = res.rows[0].fees;
    const norm = countryName.trim().toLowerCase();

    for (const [k, detail] of Object.entries(feesObj)) {
      if (k.toLowerCase() === norm) {
        return {
          id: k,
          country_name: k,
          currency: detail?.currency || 'USD',
          amount: detail?.amount || '0.00',
          updated_at: detail?.updated_at
        };
      }
    }

    return null;
  }

  public static async getById(id: string): Promise<OnboardRecord | null> {
    return await this.getByCountryName(id);
  }

  public static async upsert(payload: SaveOnboardPayload): Promise<OnboardRecord> {
    await this.ensureTableExists();
    const {
      country_name,
      currency,
      amount
    } = payload;

    const cleanAmount = typeof amount === 'string'
      ? (parseFloat(amount.replace(/,/g, '')) || 0).toFixed(2)
      : (Number(amount) || 0).toFixed(2);

    const feeDetail = {
      currency: currency.trim(),
      amount: cleanAmount,
      updated_at: new Date().toISOString()
    };

    const query = `
      INSERT INTO country_onboarding (id, fees, updated_at)
      VALUES ('default', jsonb_build_object($1::text, $2::jsonb), CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        fees = country_onboarding.fees || jsonb_build_object($1::text, $2::jsonb),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    await pool.query(query, [country_name.trim(), JSON.stringify(feeDetail)]);

    return {
      id: country_name.trim(),
      country_name: country_name.trim(),
      currency: currency.trim(),
      amount: cleanAmount,
      updated_at: feeDetail.updated_at
    };
  }

  public static async update(id: string, payload: UpdateOnboardPayload): Promise<OnboardRecord | null> {
    const existing = await this.getByCountryName(id);
    if (!existing) return null;

    return await this.upsert({
      country_name: existing.country_name,
      currency: payload.currency || existing.currency,
      amount: payload.amount !== undefined ? payload.amount : existing.amount
    });
  }

  public static async deleteByCountryName(countryName: string): Promise<boolean> {
    await this.ensureTableExists();
    const query = `
      UPDATE country_onboarding
      SET fees = fees - $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default';
    `;
    const res = await pool.query(query, [countryName.trim()]);
    return (res.rowCount || 0) > 0;
  }

  public static async deleteById(id: string): Promise<boolean> {
    return await this.deleteByCountryName(id);
  }
}

