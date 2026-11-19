import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const envFile = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envFile, 'utf8');
const match = envContent.match(/DATABASE_URL="?([^"\r\n]+)"?/);
const sql = neon(match[1]);

const usersFile = path.join(process.cwd(), '.users_data.json');
const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

console.log(`Syncing ${users.length} users to Neon Postgres...`);

for (const u of users) {
  await sql`
    INSERT INTO app_users (id, name, email, role, avatar, provider, salt, password_hash, created_at)
    VALUES (
      ${u.id},
      ${u.name},
      ${u.email.toLowerCase().trim()},
      ${u.role},
      ${u.avatar || ''},
      ${u.provider || 'credentials'},
      ${u.salt || null},
      ${u.passwordHash || null},
      ${u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()}
    )
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      avatar = EXCLUDED.avatar,
      provider = EXCLUDED.provider,
      salt = COALESCE(EXCLUDED.salt, app_users.salt),
      password_hash = COALESCE(EXCLUDED.password_hash, app_users.password_hash);
  `;
}

const count = await sql`SELECT count(*) FROM app_users;`;
console.log('Successfully synced users to Neon Postgres! Total count:', count[0].count);
