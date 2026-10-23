import bcrypt from 'bcrypt';
import { pool } from './db';

export async function seedUsers() {
  const client = await pool.connect();
  try {
    const superadmin = {
      email: 'superadmin@icomply.in',
      password: 'SuperAdmin@123',
      firstName: 'Master',
      lastName: 'Admin',
      role: 'superadmin'
    };

    // Remove any unwanted users
    await client.query("DELETE FROM users WHERE email != 'superadmin@icomply.in'");

    const passwordHash = await bcrypt.hash(superadmin.password, 10);
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) 
       DO UPDATE SET password_hash = $2, role = $5, is_active = true`,
      [superadmin.email, passwordHash, superadmin.firstName, superadmin.lastName, superadmin.role]
    );
    console.log(`[Seed] Superadmin ensured: ${superadmin.email} (Role: ${superadmin.role})`);
    console.log('[Seed] Only Superadmin is kept in users table.');
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('seed-users')) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
