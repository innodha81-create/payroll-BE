import { pool } from '../../database/db';
import { CountryRecord } from '../types/country.types';

export class CountryModel {
  private static tableInitialized = false;

  public static async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;
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
    await pool.query(query);
    this.tableInitialized = true;
  }

  public static async getAllCountries(): Promise<CountryRecord[]> {
    await this.ensureTableExists();
    const query = 'SELECT * FROM countries ORDER BY name ASC';
    const res = await pool.query(query);
    return res.rows;
  }

  public static async findByName(name: string): Promise<CountryRecord | null> {
    await this.ensureTableExists();
    const query = 'SELECT * FROM countries WHERE LOWER(name) = LOWER($1) LIMIT 1';
    const res = await pool.query(query, [name.trim()]);
    return res.rows[0] || null;
  }

  public static async findById(id: string): Promise<CountryRecord | null> {
    await this.ensureTableExists();
    const query = 'SELECT * FROM countries WHERE id = $1 LIMIT 1';
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  public static async createCountry(
    name: string,
    code?: string,
    phone_code?: string,
    created_by?: string,
    updated_by?: string
  ): Promise<CountryRecord> {
    await this.ensureTableExists();
    const query = `
      INSERT INTO countries (name, code, phone_code, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await pool.query(query, [
      name.trim(),
      code ? code.trim().toUpperCase() : null,
      phone_code ? phone_code.trim() : null,
      created_by ? created_by.trim() : 'superadmin',
      updated_by ? updated_by.trim() : (created_by ? created_by.trim() : 'superadmin')
    ]);
    return res.rows[0];
  }

  public static async deleteCountry(id: string): Promise<boolean> {
    await this.ensureTableExists();
    const query = 'DELETE FROM countries WHERE id = $1 RETURNING id;';
    const res = await pool.query(query, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
