import bcrypt from 'bcrypt';
import { pool } from './db';

export async function seedUsers() {
  const client = await pool.connect();
  try {
    console.log('[Seed] Seeding sample users for Postman testing...');

    const sampleUsers = [
      {
        email: 'manikandan.dev.it@gmail.com',
        password: 'Admin@123',
        firstName: 'Manikandan',
        lastName: 'Dev',
        role: 'superadmin'
      },
      {
        email: 'superadmin@icomply.in',
        password: 'SuperAdmin@123',
        firstName: 'Master',
        lastName: 'Admin',
        role: 'superadmin'
      },
      {
        email: 'companyadmin@icomply.in',
        password: 'CompanyAdmin@123',
        firstName: 'Apex',
        lastName: 'Admin',
        role: 'companyadmin'
      },
      {
        email: 'user@icomply.in',
        password: 'User@123',
        firstName: 'Compliance',
        lastName: 'Officer',
        role: 'user'
      },
      {
        email: 'employee@icomply.in',
        password: 'Employee@123',
        firstName: 'Ramesh',
        lastName: 'Kumar',
        role: 'employee'
      }
    ];

    for (const u of sampleUsers) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) 
         DO UPDATE SET password_hash = $2, role = $5, is_active = true`,
        [u.email, passwordHash, u.firstName, u.lastName, u.role]
      );
      console.log(`[Seed] User ensured: ${u.email} (Role: ${u.role})`);
    }

    console.log('[Seed] All sample users created successfully!');
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
