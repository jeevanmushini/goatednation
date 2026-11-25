import { createUser, findUserByEmail } from '../src/lib/auth/userDb';

async function main() {
  const email = process.argv[2];
  const name = process.argv[3] || 'Syndicate Administrator';
  const password = process.argv[4];

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <name> <password>');
    process.exit(1);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    console.error(`Error: User with email [${email}] already exists with role: ${existing.role}`);
    process.exit(1);
  }

  const admin = await createUser({
    name,
    email,
    password,
    role: 'ADMIN',
    provider: 'credentials',
  });

  console.log(`✔ SUCCESS: Administrator created: [${admin.email}] (${admin.id}) with role: ${admin.role}`);
}

main().catch((err) => {
  console.error('[Create Admin Error]:', err);
  process.exit(1);
});
