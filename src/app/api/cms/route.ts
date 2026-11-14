import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  INITIAL_HERO_SLIDES,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_BRAND_STORY,
  INITIAL_NEWSLETTER,
  INITIAL_SECTIONS,
  INITIAL_SETTINGS,
  INITIAL_NAVIGATION,
  INITIAL_MEDIA,
  INITIAL_HERO_BOTTOMS,
  INITIAL_STACK_ITEMS,
  INITIAL_EDITORIAL_BANNER,
  INITIAL_ANNOUNCEMENT,
} from '../../../lib/cms/initialCmsData';
import { PRODUCTS } from '../../../data/products';

const CMS_STORAGE_FILE = path.join(process.cwd(), '.cms_published_data.json');

const DEFAULT_STATE = {
  heroSlides: INITIAL_HERO_SLIDES,
  categories: INITIAL_CATEGORIES,
  products: PRODUCTS,
  banners: INITIAL_BANNERS,
  brandStory: INITIAL_BRAND_STORY,
  newsletter: INITIAL_NEWSLETTER,
  sections: INITIAL_SECTIONS,
  settings: INITIAL_SETTINGS,
  navigation: INITIAL_NAVIGATION,
  media: INITIAL_MEDIA,
  heroBottoms: INITIAL_HERO_BOTTOMS,
  stackCards: INITIAL_STACK_ITEMS,
  editorialBanner: INITIAL_EDITORIAL_BANNER,
  announcement: INITIAL_ANNOUNCEMENT,
  lastPublishedAt: new Date().toISOString(),
};

// Global memory cache for serverless environments
const globalForCms = globalThis as unknown as {
  __SERVER_PUBLISHED_CMS__?: Record<string, unknown>;
};

async function getFromKvStore(): Promise<Record<string, unknown> | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/goatednation_cms_published`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    }
  } catch (err) {
    console.warn('[CMS API] KV fetch failed:', err);
  }
  return null;
}

async function saveToKvStore(data: Record<string, unknown>): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return false;

  try {
    const res = await fetch(`${kvUrl}/set/goatednation_cms_published`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(data)),
    });
    return res.ok;
  } catch (err) {
    console.warn('[CMS API] KV save failed:', err);
    return false;
  }
}

export async function GET() {
  try {
    // 1. Try Vercel KV / Upstash Redis if configured
    const kvData = await getFromKvStore();
    if (kvData) {
      return NextResponse.json({ success: true, data: kvData, source: 'kv' });
    }

    // 2. Try Local File Storage
    if (fs.existsSync(CMS_STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(CMS_STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return NextResponse.json({ success: true, data: parsed, source: 'file' });
        }
      } catch (err) {
        console.warn('[CMS API] Failed to parse local CMS storage file:', err);
      }
    }

    // 3. Try In-Memory Server Cache
    if (globalForCms.__SERVER_PUBLISHED_CMS__) {
      return NextResponse.json({
        success: true,
        data: globalForCms.__SERVER_PUBLISHED_CMS__,
        source: 'memory',
      });
    }

    // 4. Default Seed State
    return NextResponse.json({ success: true, data: DEFAULT_STATE, source: 'default' });
  } catch (error) {
    console.error('[CMS API] Error loading CMS data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve published CMS data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid CMS data payload' },
        { status: 400 }
      );
    }

    const payload = {
      ...body,
      lastPublishedAt: new Date().toISOString(),
    };

    // 1. Update in-memory server cache
    globalForCms.__SERVER_PUBLISHED_CMS__ = payload;

    // 2. Save to Vercel KV if available
    const savedToKv = await saveToKvStore(payload);

    // 3. Save to local disk if writable
    let savedToFile = false;
    try {
      fs.writeFileSync(CMS_STORAGE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      savedToFile = true;
    } catch {
      // In read-only serverless environment, local disk write is safely ignored
    }

    return NextResponse.json({
      success: true,
      message: 'CMS data successfully published across devices!',
      lastPublishedAt: payload.lastPublishedAt,
      storageTarget: savedToKv ? 'vercel-kv' : savedToFile ? 'local-file' : 'server-memory',
    });
  } catch (error) {
    console.error('[CMS API] Error publishing CMS data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save and publish CMS data' },
      { status: 500 }
    );
  }
}
