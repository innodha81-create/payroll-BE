import { pool } from '../../database/db';
import { UserRecord } from '../types/login.types';

export class LoginModel {
  static async findUserByEmail(email: string): Promise<UserRecord | null> {
    const res = await pool.query(
      `SELECT u.*, c.status as company_status 
       FROM users u 
       LEFT JOIN companies c ON c.id = u.company_id 
       WHERE LOWER(u.email) = LOWER($1) 
       LIMIT 1;`,
      [email]
    );
    return res.rows[0] || null;
  }

  static async findUserById(id: string): Promise<UserRecord | null> {
    const res = await pool.query(
      `SELECT u.*, c.status as company_status 
       FROM users u 
       LEFT JOIN companies c ON c.id = u.company_id 
       WHERE u.id = $1 
       LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
  }

  static async saveRefreshToken(
    userId: string,
    tokenHash: string,
    familyId: string,
    deviceInfo: string,
    ip: string,
    expiresAt: Date
  ): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (
        user_id, token_hash, family_id, device_info, ip_address, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, tokenHash, familyId, deviceInfo, ip, expiresAt]
    );
  }

  static async findRefreshTokenByHash(tokenHash: string): Promise<{
    id: string;
    user_id: string;
    family_id: string;
    revoked: boolean;
    expires_at: Date;
  } | null> {
    const res = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  static async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE family_id = $1',
      [familyId]
    );
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [userId]
    );
  }

  static async addTokenToBlacklist(
    jti: string,
    userId: string | null,
    expiresAt: Date
  ): Promise<void> {
    await pool.query(
      `INSERT INTO token_blacklist (jti, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (jti) DO NOTHING`,
      [jti, userId, expiresAt]
    );
  }

  static async savePasswordReset(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await pool.query(
      'UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false',
      [userId]
    );

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  static async findValidPasswordReset(tokenHash: string): Promise<{
    id: string;
    user_id: string;
    expires_at: Date;
  } | null> {
    const res = await pool.query(
      `SELECT id, user_id, expires_at FROM password_resets
       WHERE token_hash = $1 AND used = false AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  static async markPasswordResetAsUsed(id: string): Promise<void> {
    await pool.query(
      'UPDATE password_resets SET used = true WHERE id = $1',
      [id]
    );
  }

  static async getLoginAuditLogs(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; logs: any[] }> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (params?.status && params.status !== 'All') {
        conditions.push(`l.status = $${idx++}`);
        values.push(params.status);
      }

      if (params?.search && params.search.trim()) {
        const q = `%${params.search.trim()}%`;
        conditions.push(`(
          l.email ILIKE $${idx} OR 
          l.ip_address ILIKE $${idx} OR 
          l.city ILIKE $${idx} OR 
          l.country ILIKE $${idx} OR 
          l.browser_name ILIKE $${idx} OR 
          l.os_name ILIKE $${idx}
        )`);
        values.push(q);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = params?.limit || 50;
      const offset = params?.offset || 0;

      const countSql = `SELECT COUNT(*) as total FROM login_audit_logs l ${whereClause};`;
      const countRes = await pool.query(countSql, values);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      const dataSql = `
        SELECT 
          l.*,
          u.first_name,
          u.last_name,
          u.role
        FROM login_audit_logs l
        LEFT JOIN users u ON u.id = l.user_id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++};
      `;
      const dataRes = await pool.query(dataSql, [...values, limit, offset]);

      return { total, logs: dataRes.rows };
    } catch (err) {
      console.error('[LoginModel.getLoginAuditLogs Error]:', err);
      return { total: 0, logs: [] };
    }
  }
}
