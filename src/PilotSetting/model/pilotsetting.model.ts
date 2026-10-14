import { pool } from '../../database/db';
import {
  PilotCredentialRecord,
  CreatePilotCredentialDto,
  UpdatePilotCredentialDto
} from '../types/pilotsetting.types';

const DEFAULT_COMPANY_UUID = '00000000-0000-0000-0000-000000000000';

export class PilotSettingModel {
  private static tableInitialized = false;

  public static async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;
    const query = `
      -- 1. Pilot Settings with JSONB credentials store
      CREATE TABLE IF NOT EXISTS pilot_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Fast unique index per company
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pilot_settings_company 
        ON pilot_settings(COALESCE(company_id, '${DEFAULT_COMPANY_UUID}'::uuid));
    `;
    await pool.query(query);
    this.tableInitialized = true;
  }

  /**
   * Helper to resolve company UUID
   */
  private static getEffectiveCompanyId(companyId?: string | null): string | null {
    if (!companyId || companyId === 'null' || companyId === 'undefined') {
      return null;
    }
    return companyId;
  }

  /**
   * Get raw credentials JSON array for a company
   */
  public static async getCredentialsArray(
    companyId?: string | null
  ): Promise<{ rowId: string; credentials: PilotCredentialRecord[] }> {
    await this.ensureTableExists();

    const effectiveId = this.getEffectiveCompanyId(companyId);
    let selectQuery: string;
    let values: any[];

    if (effectiveId) {
      selectQuery = `
        SELECT id, credentials 
        FROM pilot_settings 
        WHERE company_id = $1 
        LIMIT 1;
      `;
      values = [effectiveId];
    } else {
      selectQuery = `
        SELECT id, credentials 
        FROM pilot_settings 
        WHERE company_id IS NULL OR company_id = '${DEFAULT_COMPANY_UUID}'::uuid
        LIMIT 1;
      `;
      values = [];
    }

    const { rows } = await pool.query(selectQuery, values);

    if (rows.length > 0) {
      const list = Array.isArray(rows[0].credentials) ? rows[0].credentials : [];
      return { rowId: rows[0].id, credentials: list };
    }

    // Initialize row if not found
    const insertQuery = `
      INSERT INTO pilot_settings (company_id, credentials, created_at, updated_at)
      VALUES ($1, '[]'::jsonb, NOW(), NOW())
      RETURNING id, credentials;
    `;
    const insertRes = await pool.query(insertQuery, [effectiveId]);
    return {
      rowId: insertRes.rows[0].id,
      credentials: []
    };
  }

  /**
   * Save updated credentials JSON array back to PostgreSQL
   */
  private static async saveCredentialsArray(
    rowId: string,
    credentials: PilotCredentialRecord[]
  ): Promise<void> {
    const query = `
      UPDATE pilot_settings
      SET credentials = $1::jsonb, updated_at = NOW()
      WHERE id = $2;
    `;
    await pool.query(query, [JSON.stringify(credentials), rowId]);
  }

  /**
   * Check if credentials for the given platform already exist in JSON format
   */
  public static async findByPlatform(
    platform: string,
    companyId?: string | null
  ): Promise<PilotCredentialRecord | null> {
    const { credentials } = await this.getCredentialsArray(companyId);
    const target = platform.toLowerCase();
    const found = credentials.find((c) => c.platform.toLowerCase() === target);
    return found || null;
  }

  /**
   * Create new credential inside the JSONB array
   */
  public static async create(
    dto: CreatePilotCredentialDto
  ): Promise<PilotCredentialRecord> {
    const { rowId, credentials } = await this.getCredentialsArray(dto.companyId);

    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newRecord: PilotCredentialRecord = {
      id: `cred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      companyId: this.getEffectiveCompanyId(dto.companyId),
      platform: dto.platform.toLowerCase() as any,
      clientId: dto.clientId.trim(),
      clientSecret: dto.clientSecret.trim(),
      isActive: true,
      createdAt: dateFormatted,
      updatedAt: new Date().toISOString()
    };

    const updatedList = [newRecord, ...credentials];
    await this.saveCredentialsArray(rowId, updatedList);

    return newRecord;
  }

  /**
   * Find credential by ID from JSON array
   */
  public static async findById(id: string): Promise<PilotCredentialRecord | null> {
    await this.ensureTableExists();

    const query = `
      SELECT ps.id as row_id, elem
      FROM pilot_settings ps,
      LATERAL jsonb_array_elements(ps.credentials) elem
      WHERE elem->>'id' = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;

    return rows[0].elem as PilotCredentialRecord;
  }

  /**
   * Get all credentials from JSONB array
   */
  public static async getAll(companyId?: string | null): Promise<PilotCredentialRecord[]> {
    const { credentials } = await this.getCredentialsArray(companyId);
    return credentials;
  }

  /**
   * Update credential inside JSONB array
   */
  public static async update(
    id: string,
    dto: UpdatePilotCredentialDto
  ): Promise<PilotCredentialRecord | null> {
    await this.ensureTableExists();

    // Find the row containing this credential ID
    const findQuery = `
      SELECT id, credentials 
      FROM pilot_settings 
      WHERE credentials @> $1::jsonb 
      LIMIT 1;
    `;
    const searchJson = JSON.stringify([{ id }]);
    const { rows } = await pool.query(findQuery, [searchJson]);

    let rowId: string;
    let list: PilotCredentialRecord[];

    if (rows.length > 0) {
      rowId = rows[0].id;
      list = rows[0].credentials;
    } else {
      // Fallback: search across all rows
      const fallback = await pool.query(`SELECT id, credentials FROM pilot_settings LIMIT 1;`);
      if (fallback.rows.length === 0) return null;
      rowId = fallback.rows[0].id;
      list = fallback.rows[0].credentials || [];
    }

    const index = list.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updatedRecord: PilotCredentialRecord = {
      ...existing,
      platform: dto.platform ? (dto.platform.toLowerCase() as any) : existing.platform,
      clientId: dto.clientId !== undefined ? dto.clientId.trim() : existing.clientId,
      clientSecret: dto.clientSecret !== undefined ? dto.clientSecret.trim() : existing.clientSecret,
      isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      accessToken: dto.accessToken !== undefined ? dto.accessToken : existing.accessToken,
      authorUrn: dto.authorUrn !== undefined ? dto.authorUrn : existing.authorUrn,
      authorName: dto.authorName !== undefined ? dto.authorName : existing.authorName,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedRecord;
    await this.saveCredentialsArray(rowId, list);

    return updatedRecord;
  }

  /**
   * Delete credential from JSONB array
   */
  public static async delete(id: string): Promise<boolean> {
    await this.ensureTableExists();

    const findQuery = `
      SELECT id, credentials 
      FROM pilot_settings 
      WHERE credentials @> $1::jsonb 
      LIMIT 1;
    `;
    const searchJson = JSON.stringify([{ id }]);
    let { rows } = await pool.query(findQuery, [searchJson]);

    if (rows.length === 0) {
      const allRows = await pool.query(`SELECT id, credentials FROM pilot_settings;`);
      const matched = allRows.rows.filter((r) =>
        Array.isArray(r.credentials) && r.credentials.some((c: any) => c.id === id)
      );
      if (matched.length === 0) return false;
      rows = matched;
    }

    const rowId = rows[0].id;
    const list: PilotCredentialRecord[] = rows[0].credentials || [];
    const filtered = list.filter((c) => c.id !== id);

    await this.saveCredentialsArray(rowId, filtered);
    return true;
  }
}
