import { pool } from '../../database/db';
import bcrypt from 'bcrypt';
import { CompanyRecord, CreateCompanyDto, UpdateCompanyDto } from '../types/company.types';

export class CompanyModel {
  private static tableInitialized = false;

  public static async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;
    const query = `
      -- 1. Create Companies Table
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        country VARCHAR(100) NOT NULL,
        logo TEXT,
        plan VARCHAR(50) DEFAULT 'Free Plan',
        users INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'Active',
        address_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        tax_compliance_info JSONB NOT NULL DEFAULT '{}'::jsonb,
        plan_details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Performance Indexes
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(LOWER(name));
      CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

      -- 3. Extend users table for company association & phone
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
    `;
    await pool.query(query);
    this.tableInitialized = true;
  }

  /**
   * Create Company + Company Admin User atomically in a transaction
   */
  public static async createCompany(dto: CreateCompanyDto): Promise<CompanyRecord> {
    await this.ensureTableExists();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const addressInfo = {
        streetAddress: dto.streetAddress || '',
        city: dto.city || '',
        state: dto.state || '',
        country: dto.country || '',
        pincode: dto.pincode || ''
      };

      const taxInfo = {
        pan: dto.pan || '',
        gst: dto.gst || '',
        uen: dto.uen || '',
        companyType: dto.companyType || ''
      };

      const planDetails = {
        operatingCountries: dto.operatingCountries || [dto.country],
        countryUserCounts: dto.countryUserCounts || {},
        countryAmounts: dto.countryAmounts || {},
        includeOnboarding: Boolean(dto.includeOnboarding),
        totalUsers: dto.users || 1
      };

      // 1. Insert Company
      const insertCompanySql = `
        INSERT INTO companies (
          name, email, phone, country, logo, plan, users, status,
          address_info, tax_compliance_info, plan_details, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *;
      `;
      const companyRes = await client.query(insertCompanySql, [
        dto.name.trim(),
        dto.email.trim(),
        dto.phone?.trim() || null,
        dto.country.trim(),
        dto.logo || null,
        dto.plan || 'Free Plan',
        dto.users || 1,
        dto.status || 'Active',
        JSON.stringify(addressInfo),
        JSON.stringify(taxInfo),
        JSON.stringify(planDetails)
      ]);

      const company = companyRes.rows[0];

      // 2. Insert Company Admin User into `users` table
      if (dto.email && dto.password) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        
        // Check if user already exists
        const checkUserSql = 'SELECT id FROM users WHERE LOWER(email) = LOWER($1);';
        const existingUser = await client.query(checkUserSql, [dto.email.trim()]);

        if (existingUser.rowCount && existingUser.rowCount > 0) {
          // Link existing user to this company
          await client.query(
            `UPDATE users 
             SET company_id = $1, role = 'companyadmin', phone = COALESCE($2, phone), updated_at = NOW()
             WHERE id = $3;`,
            [company.id, dto.phone?.trim() || null, existingUser.rows[0].id]
          );
        } else {
          // Create new company admin user
          await client.query(
            `INSERT INTO users (
               email, password_hash, first_name, last_name, phone, role, company_id, is_active, created_at, updated_at
             ) VALUES ($1, $2, $3, $4, $5, 'companyadmin', $6, true, NOW(), NOW());`,
            [
              dto.email.trim(),
              passwordHash,
              dto.firstName?.trim() || '',
              dto.lastName?.trim() || '',
              dto.phone?.trim() || null,
              company.id
            ]
          );
        }
      }

      await client.query('COMMIT');
      return company;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get all companies with search, status filtering, and linked admin details
   */
  public static async getAllCompanies(options: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; companies: CompanyRecord[] }> {
    await this.ensureTableExists();

    const { search, status, limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (search && search.trim()) {
      conditions.push(`(LOWER(c.name) LIKE $${idx} OR LOWER(c.email) LIKE $${idx} OR LOWER(c.country) LIKE $${idx})`);
      values.push(`%${search.trim().toLowerCase()}%`);
      idx++;
    }

    if (status && status !== 'all') {
      conditions.push(`c.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total Count
    const countSql = `SELECT COUNT(*) as total FROM companies c ${whereClause};`;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Data query with linked admin details
    const dataSql = `
      SELECT 
        c.*,
        u.id as admin_id,
        u.first_name as admin_first_name,
        u.last_name as admin_last_name,
        u.email as admin_email,
        u.phone as admin_phone
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id AND u.role = 'companyadmin'
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    const dataRes = await pool.query(dataSql, [...values, limit, offset]);

    const companies = dataRes.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      logo: row.logo,
      plan: row.plan,
      users: row.users,
      status: row.status,
      address_info: row.address_info || {},
      tax_compliance_info: row.tax_compliance_info || {},
      plan_details: row.plan_details || {},
      admin: row.admin_id ? {
        id: row.admin_id,
        firstName: row.admin_first_name,
        lastName: row.admin_last_name,
        email: row.admin_email,
        phone: row.admin_phone
      } : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return { total, companies };
  }

  /**
   * Get single company by ID with full details + admin user details
   */
  public static async getCompanyById(id: string): Promise<CompanyRecord | null> {
    await this.ensureTableExists();

    const sql = `
      SELECT 
        c.*,
        u.id as admin_id,
        u.first_name as admin_first_name,
        u.last_name as admin_last_name,
        u.email as admin_email,
        u.phone as admin_phone
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id AND u.role = 'companyadmin'
      WHERE c.id = $1
      LIMIT 1;
    `;
    const res = await pool.query(sql, [id]);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      logo: row.logo,
      plan: row.plan,
      users: row.users,
      status: row.status,
      address_info: row.address_info || {},
      tax_compliance_info: row.tax_compliance_info || {},
      plan_details: row.plan_details || {},
      admin: row.admin_id ? {
        id: row.admin_id,
        firstName: row.admin_first_name,
        lastName: row.admin_last_name,
        email: row.admin_email,
        phone: row.admin_phone
      } : undefined,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Update Company details and optional Admin user details (High-speed single client transaction)
   */
  public static async updateCompany(id: string, dto: UpdateCompanyDto): Promise<CompanyRecord | null> {
    await this.ensureTableExists();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingRes = await client.query(
        'SELECT address_info, tax_compliance_info, plan_details FROM companies WHERE id = $1;',
        [id]
      );
      if (!existingRes.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const existing = existingRes.rows[0];

      const mergedAddress = {
        ...(existing.address_info || {}),
        ...(dto.streetAddress !== undefined && { streetAddress: dto.streetAddress }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode })
      };

      const mergedTax = {
        ...(existing.tax_compliance_info || {}),
        ...(dto.pan !== undefined && { pan: dto.pan }),
        ...(dto.gst !== undefined && { gst: dto.gst }),
        ...(dto.uen !== undefined && { uen: dto.uen }),
        ...(dto.companyType !== undefined && { companyType: dto.companyType })
      };

      const mergedPlan = {
        ...(existing.plan_details || {}),
        ...((dto as any).plan_details || {}),
        ...(dto.operatingCountries !== undefined && { operatingCountries: dto.operatingCountries }),
        ...(dto.countryUserCounts !== undefined && { countryUserCounts: dto.countryUserCounts }),
        ...(dto.countryAmounts !== undefined && { countryAmounts: dto.countryAmounts }),
        ...(dto.includeOnboarding !== undefined && { includeOnboarding: dto.includeOnboarding }),
        ...(dto.users !== undefined && { totalUsers: dto.users })
      };

      const updateCompanySql = `
        UPDATE companies
        SET 
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          country = COALESCE($4, country),
          logo = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE logo END,
          plan = COALESCE($6, plan),
          users = COALESCE($7, users),
          status = COALESCE($8, status),
          address_info = $9,
          tax_compliance_info = $10,
          plan_details = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *;
      `;

      const updatedRes = await client.query(updateCompanySql, [
        dto.name?.trim() || null,
        dto.email?.trim() || null,
        dto.phone?.trim() || null,
        dto.country?.trim() || null,
        dto.logo !== undefined ? dto.logo : null,
        dto.plan || null,
        dto.users || null,
        dto.status || null,
        JSON.stringify(mergedAddress),
        JSON.stringify(mergedTax),
        JSON.stringify(mergedPlan),
        id
      ]);

      // Update linked Admin user if personal info provided
      if (dto.firstName || dto.lastName || dto.email || dto.password || dto.phone) {
        if (dto.password && dto.password.trim()) {
          const passHash = await bcrypt.hash(dto.password.trim(), 10);
          await client.query(
            `UPDATE users 
             SET 
               first_name = COALESCE($1, first_name),
               last_name = COALESCE($2, last_name),
               email = COALESCE($3, email),
               phone = COALESCE($4, phone),
               password_hash = $5,
               updated_at = NOW()
             WHERE company_id = $6 AND role = 'companyadmin';`,
            [dto.firstName || null, dto.lastName || null, dto.email || null, dto.phone || null, passHash, id]
          );
        } else {
          await client.query(
            `UPDATE users 
             SET 
               first_name = COALESCE($1, first_name),
               last_name = COALESCE($2, last_name),
               email = COALESCE($3, email),
               phone = COALESCE($4, phone),
               updated_at = NOW()
             WHERE company_id = $5 AND role = 'companyadmin';`,
            [dto.firstName || null, dto.lastName || null, dto.email || null, dto.phone || null, id]
          );
        }
      }

      await client.query('COMMIT');

      const updatedRow = updatedRes.rows[0];
      return {
        id: updatedRow.id,
        name: updatedRow.name,
        email: updatedRow.email,
        phone: updatedRow.phone,
        country: updatedRow.country,
        logo: updatedRow.logo,
        plan: updatedRow.plan,
        users: updatedRow.users,
        status: updatedRow.status,
        address_info: updatedRow.address_info || {},
        tax_compliance_info: updatedRow.tax_compliance_info || {},
        plan_details: updatedRow.plan_details || {},
        created_at: updatedRow.created_at,
        updated_at: updatedRow.updated_at
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Dedicated method to update company user allocation and countryUserCounts
   */
  public static async updateUserAllocation(
    id: string,
    users: number,
    countryUserCounts: Record<string, string>
  ): Promise<CompanyRecord | null> {
    await this.ensureTableExists();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existingRes = await client.query(
        'SELECT plan_details FROM companies WHERE id = $1;',
        [id]
      );
      if (!existingRes.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const existingPlan = existingRes.rows[0].plan_details || {};
      const updatedPlan = {
        ...existingPlan,
        countryUserCounts: {
          ...(existingPlan.countryUserCounts || {}),
          ...countryUserCounts
        },
        totalUsers: users
      };

      const res = await client.query(
        `UPDATE companies 
         SET users = $1, plan_details = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *;`,
        [users, JSON.stringify(updatedPlan), id]
      );

      await client.query('COMMIT');
      return res.rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update Company Status (Active / Inactive toggle)
   */
  public static async updateStatus(id: string, status: 'Active' | 'Inactive'): Promise<boolean> {
    await this.ensureTableExists();
    const res = await pool.query(
      'UPDATE companies SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id;',
      [status, id]
    );

    // Cascade Inactive to all subcompanies if parent company is set to Inactive
    if (status === 'Inactive') {
      try {
        await pool.query(
          "UPDATE subcompanies SET status = 'Inactive', updated_at = NOW() WHERE parent_company_id = $1;",
          [id]
        );
      } catch (subErr) {
        console.error('[Cascade Inactive Error]:', subErr);
      }
    }

    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Delete company and its associated companyadmin user
   */
  public static async deleteCompany(id: string): Promise<boolean> {
    await this.ensureTableExists();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM users WHERE company_id = $1;', [id]);
      const res = await client.query('DELETE FROM companies WHERE id = $1;', [id]);
      await client.query('COMMIT');
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
