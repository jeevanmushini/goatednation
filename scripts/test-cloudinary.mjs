import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

console.log('=== TESTING CLOUDINARY INTEGRATION & CREDENTIAL RESOLUTION ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

const jiti = require('jiti')(__filename);
const { getCloudinaryCredentials, isCloudinaryConfigured } = jiti('../src/lib/cloudinary.ts');

// Test 1: Fallback when no keys present
console.log('Test 1: Unconfigured State Handling');
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;
delete process.env.CLOUDINARY_URL;

assert(isCloudinaryConfigured() === false, 'isCloudinaryConfigured() returns false when no env vars set');

// Test 2: Standard env vars resolution
console.log('\nTest 2: Explicit Environment Variables Resolution');
process.env.CLOUDINARY_CLOUD_NAME = 'goated_cloud';
process.env.CLOUDINARY_API_KEY = '987654321';
process.env.CLOUDINARY_API_SECRET = 'sample_secret_key_123';

const creds = getCloudinaryCredentials();
assert(creds.cloudName === 'goated_cloud', 'cloudName resolved correctly');
assert(creds.apiKey === '987654321', 'apiKey resolved correctly');
assert(creds.apiSecret === 'sample_secret_key_123', 'apiSecret resolved correctly');
assert(isCloudinaryConfigured() === true, 'isCloudinaryConfigured() returns true when env vars are present');

// Test 3: Connection String CLOUDINARY_URL resolution
console.log('\nTest 3: CLOUDINARY_URL URL String Parsing');
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;
process.env.CLOUDINARY_URL = 'cloudinary://1122334455:my_super_secret@production_cloud';

const urlCreds = getCloudinaryCredentials();
assert(urlCreds.cloudName === 'production_cloud', 'CLOUDINARY_URL parses cloudName hostname');
assert(urlCreds.apiKey === '1122334455', 'CLOUDINARY_URL parses apiKey username');
assert(urlCreds.apiSecret === 'my_super_secret', 'CLOUDINARY_URL parses apiSecret password');
assert(isCloudinaryConfigured() === true, 'isCloudinaryConfigured() returns true with CLOUDINARY_URL');

// Reset
delete process.env.CLOUDINARY_URL;

console.log(`\n=== SUMMARY: Passed: ${passed} | Failed: ${failed} ===`);
if (failed === 0) {
  console.log(`>>> CLOUDINARY ENGINE VERIFIED READY FOR PRODUCTION! <<<\n`);
} else {
  process.exit(1);
}
