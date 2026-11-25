import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../src/app/api/auth/register/route';

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 POLICIES & MANDATORY STATUTORY CONSENT VERIFICATION MATRIX');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // --- TEST 1: Backend rejects registration when agreedToTerms is omitted ---
  try {
    const testEmail1 = `test_noconsent_${Date.now()}@example.com`;
    const req1 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Consent Tester',
        email: testEmail1,
        password: 'Password123!',
      }),
    });

    const res1 = await registerHandler(req1);
    const data1 = await res1.json();

    assert(
      res1.status === 400 &&
      data1.success === false &&
      typeof data1.error === 'string' &&
      data1.error.includes('DPDP Act 2023'),
      'TC-CONSENT-01: POST /api/auth/register rejects request with HTTP 400 when agreedToTerms is omitted'
    );
  } catch (err) {
    assert(false, `TC-CONSENT-01 threw error: ${err}`);
  }

  // --- TEST 2: Backend rejects registration when agreedToTerms is false ---
  try {
    const testEmail2 = `test_falseconsent_${Date.now()}@example.com`;
    const req2 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'False Consent Tester',
        email: testEmail2,
        password: 'Password123!',
        agreedToTerms: false,
      }),
    });

    const res2 = await registerHandler(req2);
    const data2 = await res2.json();

    assert(
      res2.status === 400 &&
      data2.success === false &&
      data2.error.includes('DPDP Act 2023'),
      'TC-CONSENT-02: POST /api/auth/register rejects request with HTTP 400 when agreedToTerms is false'
    );
  } catch (err) {
    assert(false, `TC-CONSENT-02 threw error: ${err}`);
  }

  // --- TEST 3: Backend accepts registration when agreedToTerms is true ---
  try {
    const testEmail3 = `consent_user_${Date.now()}@example.com`;
    const req3 = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Consenting User',
        email: testEmail3,
        password: 'Password123!',
        agreedToTerms: true,
      }),
    });

    const res3 = await registerHandler(req3);
    const data3 = await res3.json();

    assert(
      res3.status === 200 &&
      data3.success === true &&
      data3.user?.email === testEmail3 &&
      data3.user?.role === 'CUSTOMER',
      'TC-CONSENT-03: POST /api/auth/register creates user account when agreedToTerms is true'
    );
  } catch (err) {
    assert(false, `TC-CONSENT-03 threw error: ${err}`);
  }

  // --- TEST 4: Verify all 6 statutory policy routes and layout exist ---
  try {
    const policyFiles = [
      'src/app/policies/layout.tsx',
      'src/app/policies/privacy-policy/page.tsx',
      'src/app/policies/terms-of-service/page.tsx',
      'src/app/policies/refund-and-exchange/page.tsx',
      'src/app/policies/shipping-and-delivery/page.tsx',
      'src/app/policies/grievance-redressal/page.tsx',
      'src/app/policies/legal-metrology/page.tsx',
    ];

    const allExist = policyFiles.every((f) => fs.existsSync(path.resolve(process.cwd(), f)));
    assert(allExist, 'TC-CONSENT-04: All 6 statutory policy routes and layout.tsx exist under src/app/policies/');
  } catch (err) {
    assert(false, `TC-CONSENT-04 threw error: ${err}`);
  }

  // --- TEST 5: Verify ZeninFooter has synced policy URLs ---
  try {
    const footerContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/zenin/ZeninFooter.tsx'),
      'utf-8'
    );

    const hasRefund = footerContent.includes('/policies/refund-and-exchange');
    const hasPrivacy = footerContent.includes('/policies/privacy-policy');
    const hasTerms = footerContent.includes('/policies/terms-of-service');
    const hasShipping = footerContent.includes('/policies/shipping-and-delivery');
    const hasGrievance = footerContent.includes('/policies/grievance-redressal');

    assert(
      hasRefund && hasPrivacy && hasTerms && hasShipping && hasGrievance,
      'TC-CONSENT-05: ZeninFooter.tsx correctly links to all 5 required statutory policy URLs'
    );
  } catch (err) {
    assert(false, `TC-CONSENT-05 threw error: ${err}`);
  }

  // --- TEST 6: Verify Register Page contains mandatory checkbox & DPDP compliance text ---
  try {
    const registerContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/register/page.tsx'),
      'utf-8'
    );

    const hasAgreedState = registerContent.includes('agreedToPolicies');
    const hasCheckbox = registerContent.includes('type="checkbox"');
    const hasTermsLink = registerContent.includes('/policies/terms-of-service');
    const hasPrivacyLink = registerContent.includes('/policies/privacy-policy');
    const hasRefundLink = registerContent.includes('/policies/refund-and-exchange');
    const hasDisabledButton = registerContent.includes('!agreedToPolicies');

    assert(
      hasAgreedState && hasCheckbox && hasTermsLink && hasPrivacyLink && hasRefundLink && hasDisabledButton,
      'TC-CONSENT-06: Register page contains mandatory DPDP consent checkbox, links, and disabled submit guard'
    );
  } catch (err) {
    assert(false, `TC-CONSENT-06 threw error: ${err}`);
  }

  console.log(`\n======================================================================`);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`======================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
