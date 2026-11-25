async function checkRoutes() {
  console.log('======================================================================');
  console.log('🌐 OFFLINE LIVE HTTP SMOKE TEST (localhost:3000)');
  console.log('======================================================================\n');

  const routes = [
    { path: '/', name: 'Storefront Homepage' },
    { path: '/policies/privacy-policy', name: 'Privacy Policy (DPDP Act 2023)' },
    { path: '/policies/terms-of-service', name: 'Terms of Service' },
    { path: '/policies/refund-and-exchange', name: 'Refund & Exchange Policy' },
    { path: '/policies/shipping-and-delivery', name: 'Shipping & Delivery Policy' },
    { path: '/policies/grievance-redressal', name: 'Grievance Redressal Disclosures' },
    { path: '/policies/legal-metrology', name: 'Legal Metrology Declarations' },
    { path: '/register', name: 'Customer Registration (Mandatory Consent)' },
    { path: '/login', name: 'Single-Door Login Portal' },
    { path: '/cart', name: 'Cart & 1-Click Recovery' },
    { path: '/support', name: 'Customer Support Portal' },
    { path: '/track', name: 'AWB Order Tracking' },
    { path: '/settings', name: 'Customer Account Settings' },
  ];

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const url = `http://localhost:3000${r.path}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'OfflineSmokeTester/1.0' } });
      const text = await res.text();

      if (res.status === 200 && text.length > 500) {
        console.log(`✅ [200 OK] ${r.name.padEnd(42)} -> ${url} (${text.length} bytes)`);
        passed++;
      } else {
        console.error(`❌ [HTTP ${res.status}] ${r.name.padEnd(42)} -> ${url}`);
        failed++;
      }
    } catch (err: unknown) {
      console.error(`❌ [EXCEPTION] ${r.name.padEnd(42)} -> ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log('\n======================================================================');
  console.log(`TOTAL ROUTES CHECKED: ${routes.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

checkRoutes();
