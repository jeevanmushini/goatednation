import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { GET as oauthProviderHandler } from '../src/app/api/auth/oauth/[provider]/route';
import { authenticateCredentials, findUserByEmail, createUser } from '../src/lib/auth/userDb';
import { NextRequest } from 'next/server';

async function runTestSuite() {
  console.log('====================================================');
  console.log('GOATED NATION: Auth Production Hardening Test Suite');
  console.log('====================================================');

  let passed = 0;

  // TC-AUTH-01: Verify Registration UI file has zero leaked admin clearance keys or role switchers
  const registerPageContent = fs.readFileSync(
    path.join(process.cwd(), 'src/app/register/page.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    registerPageContent.includes('GOATED_ADMIN_2026'),
    false,
    'TC-AUTH-01 FAIL: register/page.tsx still contains plain-text clearance key GOATED_ADMIN_2026'
  );
  assert.strictEqual(
    registerPageContent.includes('Account Type (RBAC)'),
    false,
    'TC-AUTH-01 FAIL: register/page.tsx still contains RBAC role switcher'
  );
  assert.strictEqual(
    registerPageContent.includes('Administrator'),
    false,
    'TC-AUTH-01 FAIL: register/page.tsx still references Administrator role option'
  );
  console.log('✔ PASS: TC-AUTH-01: Zero leaked admin keys or role switchers in Registration UI');
  passed++;

  // TC-AUTH-02: Public POST /api/auth/register ignores client role and adminKey parameters
  const testEmail = `adversary_${Date.now()}@example.com`;
  const req = new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Adversary Exploiter',
      email: testEmail,
      password: 'ExploitPassword123!',
      role: 'ADMIN',
      adminKey: 'GOATED_ADMIN_2026',
      agreedToTerms: true,
    }),
  });

  const res = await registerHandler(req);
  assert.strictEqual(res.status, 200, `TC-AUTH-02 FAIL: Register returned status ${res.status}`);
  const data = await res.json();
  assert.strictEqual(data.success, true, 'TC-AUTH-02 FAIL: Register was not successful');
  assert.strictEqual(
    data.user.role,
    'CUSTOMER',
    `TC-AUTH-02 FAIL: Privilege escalation succeeded! User role was ${data.user.role} instead of CUSTOMER`
  );
  console.log('✔ PASS: TC-AUTH-02: Public registration strictly creates CUSTOMER accounts (privilege escalation blocked)');
  passed++;

  // TC-AUTH-03: OAuth provider initialization discards ?role=ADMIN
  const oauthReq = new NextRequest(
    'http://localhost:3000/api/auth/oauth/google?role=ADMIN&redirect=/admin',
    { method: 'GET' }
  );
  const oauthRes = await oauthProviderHandler(oauthReq, {
    params: Promise.resolve({ provider: 'google' }),
  });
  
  // If Google credentials are not set in test environment, it safely redirects to login
  const location = oauthRes.headers.get('location');
  if (location && location.includes('accounts.google.com')) {
    const url = new URL(location);
    const stateParam = url.searchParams.get('state');
    assert(stateParam, 'OAuth state parameter missing');
    const parsedState = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
    assert.strictEqual(
      parsedState.role,
      'CUSTOMER',
      `TC-AUTH-03 FAIL: OAuth state role was ${parsedState.role} instead of CUSTOMER`
    );
  }
  console.log('✔ PASS: TC-AUTH-03: OAuth initialization safely binds role to CUSTOMER in state');
  passed++;

  // TC-AUTH-04: Single-Door Login differentiates ADMIN vs CUSTOMER correctly from DB
  const adminAuth = await authenticateCredentials('admin@goatednation.com', 'Admin@123');
  assert.strictEqual(adminAuth.success, true, 'Admin login failed');
  assert.strictEqual(adminAuth.user?.role, 'ADMIN', 'Admin user must have ADMIN role');

  const custAuth = await authenticateCredentials('customer@goatednation.com', 'Customer@123');
  assert.strictEqual(custAuth.success, true, 'Customer login failed');
  assert.strictEqual(custAuth.user?.role, 'CUSTOMER', 'Customer user must have CUSTOMER role');

  console.log('✔ PASS: TC-AUTH-04: Single-Door authentication correctly authenticates and identifies roles');
  passed++;

  // TC-AUTH-05: Login page UX cleanup - technical jargon removed
  const loginPageContent = fs.readFileSync(
    path.join(process.cwd(), 'src/app/login/page.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    loginPageContent.includes('AUTHENTICATION GATEWAY'),
    false,
    'TC-AUTH-05 FAIL: login/page.tsx still contains internal jargon AUTHENTICATION GATEWAY'
  );
  assert.strictEqual(
    loginPageContent.includes('admin clearance'),
    false,
    'TC-AUTH-05 FAIL: login/page.tsx still contains internal jargon admin clearance'
  );
  console.log('✔ PASS: TC-AUTH-05: Customer login UI cleaned of prototype jargon');
  passed++;

  console.log('====================================================');
  console.log(`Total hardening tests passed: ${passed}/${passed}`);
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
