import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Read .env.local if not already in process.env
const envFile = path.join(process.cwd(), '.env.local');
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  const match = content.match(/DATABASE_URL="?([^"\r\n]+)"?/);
  if (match) dbUrl = match[1];
}

console.log('Testing Neon connection with URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'NONE');

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = neon(dbUrl);

try {
  const result = await sql`SELECT NOW() as now, version() as version, current_database() as database, current_user as user;`;
  console.log('SUCCESS! Neon Postgres connected successfully:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('FAILED to connect to Neon Postgres:', error);
  process.exit(1);
}
