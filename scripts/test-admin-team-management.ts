import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET as getTeamHandler } from '../src/app/api/admin/team/route';
import { PATCH as updateRoleHandler } from '../src/app/api/admin/team/role/route';
import { signJwt } from '../src/lib/auth/jwt';
import { createUser, findUserByEmail } from '../src/lib/auth/userDb';

async function runTestSuite() {
  console.log('====================================================');
  console.log('GOATED NATION: In-Console Staff Access Management Tests');
  console.log('====================================================');

  let passed = 0;

  // Setup sample test user
  const testStaffEmail = `staff_candidate_${Date.now()}@goatednation.com`;
  await createUser({
    name: 'Staff Candidate',
    email: testStaffEmail,
    password: 'CandidatePass123!',
    role: 'CUSTOMER',
    provider: 'credentials',
  });

  const adminToken = signJwt({
    id: 'usr_admin_001',
    email: 'admin@goatednation.com',
    name: 'SYNDICATE ADMIN',
    role: 'ADMIN',
    provider: 'credentials',
  });

  const customerToken = signJwt({
    id: 'usr_cust_002',
    email: 'customer@goatednation.com',
    name: 'Regular Customer',
    role: 'CUSTOMER',
    provider: 'credentials',
  });

  // 1. TC-TEAM-01: GET /api/admin/team rejects unauthenticated / customer callers
  const unauthReq = new NextRequest('http://localhost:3000/api/admin/team', { method: 'GET' });
  const unauthRes = await getTeamHandler(unauthReq);
  assert.strictEqual(unauthRes.status, 401, 'TC-TEAM-01 FAIL: Unauthenticated GET must return 401');

  const customerReq = new NextRequest('http://localhost:3000/api/admin/team', {
    method: 'GET',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const customerRes = await getTeamHandler(customerReq);
  assert.strictEqual(customerRes.status, 403, 'TC-TEAM-01 FAIL: Customer GET must return 403 Forbidden');
  console.log('✔ PASS: TC-TEAM-01: Unauthorized & Customer access blocked from /api/admin/team');
  passed++;

  // 2. TC-TEAM-02: GET /api/admin/team returns accurate metrics and user list for Admin
  const adminGetReq = new NextRequest('http://localhost:3000/api/admin/team', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminGetRes = await getTeamHandler(adminGetReq);
  assert.strictEqual(adminGetRes.status, 200, 'TC-TEAM-02 FAIL: Admin GET must return 200');
  const teamData = await adminGetRes.json();
  assert.strictEqual(teamData.success, true, 'TC-TEAM-02 FAIL: Result success must be true');
  assert(teamData.metrics.totalUsers >= 2, 'TC-TEAM-02 FAIL: totalUsers metric invalid');
  assert(teamData.metrics.totalAdmins >= 1, 'TC-TEAM-02 FAIL: totalAdmins metric invalid');
  assert(Array.isArray(teamData.users), 'TC-TEAM-02 FAIL: users must be array');

  const primaryAdmin = teamData.users.find((u: { email: string }) => u.email === 'admin@goatednation.com');
  assert(primaryAdmin, 'TC-TEAM-02 FAIL: Primary admin missing from roster');
  assert.strictEqual(primaryAdmin.isPrimaryAdmin, true, 'TC-TEAM-02 FAIL: isPrimaryAdmin must be true for super-admin');
  console.log('✔ PASS: TC-TEAM-02: Admin roster and aggregated metrics correctly returned');
  passed++;

  // 3. TC-TEAM-03: PATCH /api/admin/team/role protects Primary Super-Admin from demotion
  const attackReq1 = new NextRequest('http://localhost:3000/api/admin/team/role', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@goatednation.com',
      targetRole: 'CUSTOMER',
    }),
  });
  const attackRes1 = await updateRoleHandler(attackReq1);
  assert.strictEqual(attackRes1.status, 400, 'TC-TEAM-03 FAIL: Demoting super-admin must return 400 Bad Request');
  const attackData1 = await attackRes1.json();
  assert(
    attackData1.error.includes('Primary Syndicate Administrator'),
    'TC-TEAM-03 FAIL: Expected primary admin protection error message'
  );
  console.log('✔ PASS: TC-TEAM-03: Primary Super-Admin immutable protection enforced');
  passed++;

  // 4. TC-TEAM-04: PATCH /api/admin/team/role prevents self-demotion lockout
  const secondaryAdminEmail = `secondary_${Date.now()}@goatednation.com`;
  await createUser({
    name: 'Secondary Admin',
    email: secondaryAdminEmail,
    password: 'SecAdminPassword123!',
    role: 'ADMIN',
    provider: 'credentials',
  });
  const secondaryAdminToken = signJwt({
    id: 'usr_sec_admin',
    email: secondaryAdminEmail,
    name: 'Secondary Admin',
    role: 'ADMIN',
    provider: 'credentials',
  });

  const selfDemoteReq = new NextRequest('http://localhost:3000/api/admin/team/role', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${secondaryAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: secondaryAdminEmail,
      targetRole: 'CUSTOMER',
    }),
  });
  const selfDemoteRes = await updateRoleHandler(selfDemoteReq);
  assert.strictEqual(selfDemoteRes.status, 400, 'TC-TEAM-04 FAIL: Self-demotion must return 400');
  const selfDemoteData = await selfDemoteRes.json();
  assert(
    selfDemoteData.error.includes('cannot revoke your own administrator clearance'),
    'TC-TEAM-04 FAIL: Expected self-demotion guard message'
  );
  console.log('✔ PASS: TC-TEAM-04: Self-demotion lockout guard successfully prevented accidental lockout');
  passed++;

  // 5. TC-TEAM-05: Promote customer account to Administrator with 1-click
  const promoteReq = new NextRequest('http://localhost:3000/api/admin/team/role', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testStaffEmail,
      targetRole: 'ADMIN',
    }),
  });
  const promoteRes = await updateRoleHandler(promoteReq);
  assert.strictEqual(promoteRes.status, 200, 'TC-TEAM-05 FAIL: Promote returned non-200');
  const promoteData = await promoteRes.json();
  assert.strictEqual(promoteData.success, true);
  assert.strictEqual(promoteData.user.role, 'ADMIN');

  const verifiedUser = await findUserByEmail(testStaffEmail);
  assert.strictEqual(verifiedUser?.role, 'ADMIN', 'TC-TEAM-05 FAIL: User role in DB was not ADMIN');
  console.log('✔ PASS: TC-TEAM-05: 1-Click staff promotion from CUSTOMER to ADMIN succeeded');
  passed++;

  // 6. TC-TEAM-06: Revoke administrator clearance back to CUSTOMER
  const revokeReq = new NextRequest('http://localhost:3000/api/admin/team/role', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testStaffEmail,
      targetRole: 'CUSTOMER',
    }),
  });
  const revokeRes = await updateRoleHandler(revokeReq);
  assert.strictEqual(revokeRes.status, 200, 'TC-TEAM-06 FAIL: Revoke returned non-200');
  const revokeData = await revokeRes.json();
  assert.strictEqual(revokeData.success, true);
  assert.strictEqual(revokeData.user.role, 'CUSTOMER');

  const revokedUser = await findUserByEmail(testStaffEmail);
  assert.strictEqual(revokedUser?.role, 'CUSTOMER', 'TC-TEAM-06 FAIL: User role in DB was not CUSTOMER');
  console.log('✔ PASS: TC-TEAM-06: 1-Click clearance revocation back to CUSTOMER succeeded');
  passed++;

  // 7. TC-TEAM-07: Admin layout navigation includes Team Clearance link
  const adminLayoutContent = fs.readFileSync(
    path.join(process.cwd(), 'src/app/admin/layout.tsx'),
    'utf-8'
  );
  assert(
    adminLayoutContent.includes('/admin/team') && adminLayoutContent.includes('Team Clearance'),
    'TC-TEAM-07 FAIL: admin/layout.tsx does not contain Team Clearance navigation link'
  );
  console.log('✔ PASS: TC-TEAM-07: Admin layout navigation properly integrates /admin/team link');
  passed++;

  console.log('====================================================');
  console.log(`Total staff access tests passed: ${passed}/${passed}`);
  console.log('====================================================');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
