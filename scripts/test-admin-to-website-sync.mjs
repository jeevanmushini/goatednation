import fs from 'fs';
import path from 'path';

async function testAdminToWebsiteSync() {
  console.log('================================================================');
  console.log('   E2E TEST: ADMIN PANEL CHANGES REFLECTING ON LIVE STOREFRONT   ');
  console.log('================================================================\n');

  // Generate unique random test IDs to ensure we are testing fresh values
  const runId = Math.floor(Math.random() * 10000);
  const testAnnouncementHighlight = `TEST PREPAID 25% OFF [RUN-${runId}]`;
  const testAnnouncementText = `USE CODE GOATED${runId} AT CHECKOUT`;
  const testHeroTitle = `CHERRY BLOSSOM SAMURAI HOODIE [RUN-${runId}]`;
  const testHeroPrice = `Rs. 2,349`;
  const testHeroBadge = `EXCLUSIVE DROP`;
  const testHeroImage = `https://res.cloudinary.com/bu4oxldy/image/upload/v1794905970/test-hoodie-silhouette/lrn6izbcrjnckvwo8ofc.png`;
  const testStackTitle = `MODULAR TACTICAL CHEST RIG [RUN-${runId}]`;
  const testStackSubtitle = `MIL-SPEC CORDURA // WATERPROOF`;
  const testStackImage = `https://res.cloudinary.com/bu4oxldy/image/upload/v1794905974/1794905972462-sample-admin-upload/ivzrhhkgclzcfedgmiiu.png`;
  const testEditorialFollowers = `185K ACTIVE FOLLOWERS [RUN-${runId}]`;
  const testEditorialImage = `https://res.cloudinary.com/bu4oxldy/image/upload/v1794905935/goated-verify/qink9szeudtruz55w5mr.png`;

  console.log('--- Step 1: Fetching current published CMS state ---');
  const initialRes = await fetch('http://localhost:3000/api/cms');
  const initialJson = await initialRes.json();
  if (!initialJson.success) {
    throw new Error('Failed to fetch initial CMS state');
  }
  console.log('Initial published state loaded. Source:', initialJson.source);

  console.log('\n--- Step 2: Simulating Admin Panel edits across all homepage sections ---');
  const payload = {
    announcement: {
      ...initialJson.data.announcement,
      highlightText: testAnnouncementHighlight,
      text: testAnnouncementText,
      ctaText: 'ORDER NOW',
      countdownDays: 3,
    },
    heroBottoms: initialJson.data.heroBottoms.map((b, idx) => {
      // Edit slot 4 (the cherry blossom slot user mentioned)
      if (idx === 3) {
        return {
          ...b,
          name: testHeroTitle,
          price: testHeroPrice,
          badge: testHeroBadge,
          image: testHeroImage,
        };
      }
      return b;
    }),
    stackCards: initialJson.data.stackCards.map((c, idx) => {
      if (idx === 0) {
        return {
          ...c,
          title: testStackTitle,
          subtitle: testStackSubtitle,
          image: testStackImage,
        };
      }
      return c;
    }),
    editorialBanner: {
      ...initialJson.data.editorialBanner,
      followersText: testEditorialFollowers,
      image: testEditorialImage,
    },
  };

  console.log('Publishing updated CMS state via POST /api/cms ...');
  const publishRes = await fetch('http://localhost:3000/api/cms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const publishJson = await publishRes.json();
  console.log('Publish Result:', publishJson);

  if (!publishJson.success) {
    throw new Error('POST /api/cms failed to publish data');
  }

  console.log('\n--- Step 3: Verifying persistence in /api/cms endpoint ---');
  const verifyApiRes = await fetch('http://localhost:3000/api/cms');
  const verifyApiJson = await verifyApiRes.json();
  const apiData = verifyApiJson.data;

  const apiAnnMatch = apiData.announcement.highlightText === testAnnouncementHighlight;
  const apiHeroMatch = apiData.heroBottoms[3].name === testHeroTitle && apiData.heroBottoms[3].image === testHeroImage;
  const apiStackMatch = apiData.stackCards[0].title === testStackTitle && apiData.stackCards[0].image === testStackImage;
  const apiEditorialMatch = apiData.editorialBanner.followersText === testEditorialFollowers;

  console.log('API Announcement Highlight Updated:', apiAnnMatch ? 'PASS [OK]' : 'FAIL');
  console.log('API Hero Bottom Slot 4 Updated:', apiHeroMatch ? 'PASS [OK]' : 'FAIL');
  console.log('API 3D Stack Card 1 Updated:', apiStackMatch ? 'PASS [OK]' : 'FAIL');
  console.log('API Editorial Banner Updated:', apiEditorialMatch ? 'PASS [OK]' : 'FAIL');

  if (!apiAnnMatch || !apiHeroMatch || !apiStackMatch || !apiEditorialMatch) {
    throw new Error('API verification failed: Data did not persist accurately.');
  }

  console.log('\n--- Step 4: Verifying LIVE STOREFRONT HOMEPAGE (http://localhost:3000/) ---');
  const storefrontRes = await fetch('http://localhost:3000/', { cache: 'no-store' });
  const storefrontHtml = await storefrontRes.text();

  const htmlHasAnnouncement = storefrontHtml.includes(testAnnouncementHighlight);
  const htmlHasHeroTitle = storefrontHtml.includes(testHeroTitle);
  const htmlHasHeroImage = storefrontHtml.includes(testHeroImage);
  const htmlHasStackTitle = storefrontHtml.includes(testStackTitle);
  const htmlHasStackImage = storefrontHtml.includes(testStackImage);
  const htmlHasEditorial = storefrontHtml.includes(testEditorialFollowers);
  const htmlHasEditorialImage = storefrontHtml.includes(testEditorialImage);

  console.log('Live Storefront renders Announcement text:', htmlHasAnnouncement ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders Hero Silhouette Title:', htmlHasHeroTitle ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders Hero Cloudinary Image:', htmlHasHeroImage ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders 3D Stack Card Title:', htmlHasStackTitle ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders 3D Stack Cloudinary Image:', htmlHasStackImage ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders Editorial Followers Text:', htmlHasEditorial ? 'PASS [OK]' : 'FAIL');
  console.log('Live Storefront renders Editorial Cloudinary Image:', htmlHasEditorialImage ? 'PASS [OK]' : 'FAIL');

  const allPassed =
    htmlHasAnnouncement &&
    htmlHasHeroTitle &&
    htmlHasHeroImage &&
    htmlHasStackTitle &&
    htmlHasStackImage &&
    htmlHasEditorial &&
    htmlHasEditorialImage;

  console.log('\n================================================================');
  if (allPassed) {
    console.log('>>> ALL VERIFICATION CHECKS PASSED PERFECTLY! <<<');
    console.log('Admin Panel text & Cloudinary image edits update the live website immediately!');
  } else {
    console.error('>>> SOME STOREFRONT CHECKS FAILED! <<<');
    process.exit(1);
  }
  console.log('================================================================\n');
}

testAdminToWebsiteSync().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
