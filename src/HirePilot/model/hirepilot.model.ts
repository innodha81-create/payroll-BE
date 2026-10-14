import { pool } from '../../database/db.js';

export interface JobOpeningRecord {
  id: string;
  company_id?: string | null;
  employee_name: string;
  job_title: string;
  last_apply_date: string;
  description: string;
  poster_data: any;
  shared_platforms: string[];
  status: string;
  created_at: string;
}

export class HirePilotModel {
  private static tableInitialized = false;

  public static async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;
    const query = `
      CREATE TABLE IF NOT EXISTS job_openings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        employee_name VARCHAR(255),
        job_title VARCHAR(255) NOT NULL,
        last_apply_date VARCHAR(50),
        description TEXT,
        poster_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        shared_platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_job_openings_company ON job_openings(company_id);
      CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);
    `;
    await pool.query(query);
    this.tableInitialized = true;
  }

  public static async createOpening(data: {
    companyId?: string | null;
    employeeName: string;
    jobTitle: string;
    lastApplyDate: string;
    description: string;
    posterData: any;
    sharedPlatforms: string[];
  }): Promise<JobOpeningRecord> {
    await this.ensureTableExists();

    const query = `
      INSERT INTO job_openings (
        company_id,
        employee_name,
        job_title,
        last_apply_date,
        description,
        poster_data,
        shared_platforms
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
      RETURNING *;
    `;

    const values = [
      data.companyId || null,
      data.employeeName,
      data.jobTitle,
      data.lastApplyDate,
      data.description,
      JSON.stringify(data.posterData || {}),
      JSON.stringify(data.sharedPlatforms || [])
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  public static async getOpenings(companyId?: string | null): Promise<JobOpeningRecord[]> {
    await this.ensureTableExists();
    let query = 'SELECT * FROM job_openings';
    const values: any[] = [];

    if (companyId) {
      query += ' WHERE company_id = $1';
      values.push(companyId);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  public static async getStats(companyId?: string | null): Promise<{
    activeJobs: number;
    totalCandidates: number;
    aiShortlisted: number;
    avgAts: string;
  }> {
    await this.ensureTableExists();
    let countQuery = "SELECT COUNT(*) as count FROM job_openings WHERE status = 'Active'";
    const values: any[] = [];

    if (companyId) {
      countQuery += ' AND company_id = $1';
      values.push(companyId);
    }

    const res = await pool.query(countQuery, values);
    const activeJobs = parseInt(res.rows[0]?.count || '0', 10);

    return {
      activeJobs,
      totalCandidates: 0,
      aiShortlisted: 0,
      avgAts: '0%'
    };
  }
}
