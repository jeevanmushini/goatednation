import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

const jiti = require('jiti')(__filename);
const { uploadToCloudinary, isCloudinaryConfigured } = jiti('../src/lib/cloudinary.ts');

async function testAll() {
  console.log('=== TEST 1: DIRECT CLOUDINARY UPLOAD VIA LIBRARY ===');
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(samplePngBase64, 'base64');

  const libResult = await uploadToCloudinary(buffer, 'image/png', 'hoodies', 'test-hoodie-silhouette.png');
  console.log('Direct Cloudinary Upload Success:');
  console.log('  URL:', libResult.url);
  console.log('  PublicId:', libResult.publicId);
  console.log('  Bytes:', libResult.bytes);

  if (!libResult.url.includes('cloudinary.com')) {
    throw new Error('libResult did not return a valid Cloudinary URL');
  }

  console.log('\n=== TEST 2: NEXT.JS SERVER ENDPOINT (/api/media/upload) ===');
  const form = new FormData();
  const blob = new Blob([buffer], { type: 'image/png' });
  form.append('file', blob, 'sample-admin-upload.png');
  form.append('category', 'products');

  const res = await fetch('http://localhost:3000/api/media/upload', {
    method: 'POST',
    body: form,
  });

  const json = await res.json();
  console.log('API /api/media/upload status:', res.status);
  console.log('API /api/media/upload response:', json);

  if (!json.success || !json.url || !json.url.includes('cloudinary.com')) {
    throw new Error('API did not return a valid Cloudinary upload URL');
  }

  console.log('>>> [PASS] Cloudinary CDN Integration is 100% operational! <<<');
}

testAll().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
