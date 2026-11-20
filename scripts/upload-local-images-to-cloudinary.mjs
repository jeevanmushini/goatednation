import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const jiti = require('jiti')(__filename);
const { uploadToCloudinary } = jiti('../src/lib/cloudinary.ts');

const localImages = [
  { path: 'public/images/editorial/editorial-banner.jpg', name: 'editorial-banner', mime: 'image/jpeg', folder: 'editorial' },
  { path: 'public/images/hero/berserk-hoodie.jpg', name: 'berserk-hoodie', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/black-hoodie.webp', name: 'black-hoodie', mime: 'image/webp', folder: 'hero' },
  { path: 'public/images/hero/cherry-blossom-waffle.jpg', name: 'cherry-blossom-waffle', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/grey-hoodie.webp', name: 'grey-hoodie', mime: 'image/webp', folder: 'hero' },
  { path: 'public/images/hero/ryujin-jacket.jpg', name: 'ryujin-jacket', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/sukuna-jacket.jpg', name: 'sukuna-jacket', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/tactical-vest.jpg', name: 'tactical-vest', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/valhalla-bomber.jpg', name: 'valhalla-bomber', mime: 'image/jpeg', folder: 'hero' },
  { path: 'public/images/hero/white-hoodie.webp', name: 'white-hoodie', mime: 'image/webp', folder: 'hero' },
  { path: 'public/images/hero/zoro-crossbody.jpg', name: 'zoro-crossbody', mime: 'image/jpeg', folder: 'hero' },
];

async function uploadLocalImages() {
  console.log('Uploading 11 local hero/editorial assets to Cloudinary...');
  const uploadedMap = {};

  for (const item of localImages) {
    const fullPath = path.join(__dirname, '..', item.path);
    if (!fs.existsSync(fullPath)) continue;

    const buffer = fs.readFileSync(fullPath);
    try {
      const res = await uploadToCloudinary(buffer, item.mime, item.folder, item.name);
      uploadedMap[item.path.replace('public', '')] = res.url;
      console.log(`Uploaded ${item.name} -> ${res.url}`);
    } catch (err) {
      console.warn(`Failed to upload ${item.name}:`, err.message);
    }
  }

  const outPath = path.join(__dirname, 'local_cloudinary_map.json');
  fs.writeFileSync(outPath, JSON.stringify(uploadedMap, null, 2), 'utf-8');
  console.log('Local Cloudinary map saved to:', outPath);
}

uploadLocalImages().catch(console.error);
