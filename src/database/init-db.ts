import { pool } from './db';

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('[DB] Connecting to PostgreSQL / Supabase...');

    await client.query('BEGIN');

    // 1. Create user_role ENUM type if it doesn't already exist
    const enumCheck = await client.query(`
      SELECT 1 FROM pg_type WHERE typname = 'user_role';
    `);

    if (enumCheck.rowCount === 0) {
      console.log('[DB] Creating user_role ENUM...');
      await client.query(`
        CREATE TYPE user_role AS ENUM ('superadmin', 'companyadmin', 'user', 'employee');
      `);
    } else {
      console.log('[DB] user_role ENUM already exists.');
    }

    // 2. Create Users Table with role ENUM
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role user_role NOT NULL DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[DB] users table verified.');

    // 4. Create Refresh Tokens Table (for RTR)
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        family_id UUID NOT NULL,
        device_info VARCHAR(255),
        ip_address VARCHAR(50),
        revoked BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[DB] refresh_tokens table verified.');

    // 5. Create Token Blacklist Table (for instant logout revocation)
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        jti VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[DB] token_blacklist table verified.');

    // 6. Create Password Resets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        used BOOLEAN DEFAULT false,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[DB] password_resets table verified.');

    // 6. Create Login Audit Logs Table (Device, IP & Status tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        ip_address VARCHAR(50),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        latitude NUMERIC(10, 6),
        longitude NUMERIC(10, 6),
        device_type VARCHAR(50),
        device_model VARCHAR(100),
        os_name VARCHAR(50),
        os_version VARCHAR(50),
        browser_name VARCHAR(50),
        browser_version VARCHAR(50),
        user_agent TEXT,
        failure_reason VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE login_audit_logs 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100),
      ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6),
      ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6),
      ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS device_model VARCHAR(100),
      ADD COLUMN IF NOT EXISTS os_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS os_version VARCHAR(50),
      ADD COLUMN IF NOT EXISTS browser_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS browser_version VARCHAR(50);
    `);
    console.log('[DB] login_audit_logs table verified with extended Geo/Device columns.');

    // 7. Performance Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);
      CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
      CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit_logs(user_id);
    `);
    console.log('[DB] Indexes verified.');

    await client.query('COMMIT');
    console.log('[DB] All database schema migrations successfully completed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Migration Error]:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Execute migration if run directly
if (process.argv[1]?.includes('init-db')) {
  initDatabase()
    .then(() => {
      console.log('Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}
