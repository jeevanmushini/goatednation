import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPublishedCmsData, savePublishedCmsData, PublishedCmsData } from '../../../lib/cms/serverCms';
import { verifyJwt } from '../../../lib/auth/jwt';

export async function GET() {
  try {
    const { data, source } = await getPublishedCmsData();
    return NextResponse.json({ success: true, data, source });
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
    // Enforce Administrator Authorization (Cookie or Bearer Token)
    const cookieToken =
      req.cookies.get('auth_token')?.value ||
      req.cookies.get('gn_auth_token')?.value;
    const headerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const token = headerToken || cookieToken;
    const payload = token ? verifyJwt(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      const isLocalDev =
        process.env.NODE_ENV !== 'production' &&
        (req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1');

      if (!isLocalDev) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Administrator clearance required to publish CMS data.' },
          { status: 401 }
        );
      }
    }

    const body = (await req.json()) as Partial<PublishedCmsData>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid CMS data payload' },
        { status: 400 }
      );
    }

    const { savedToNeon, savedToKv, savedToFile } = await savePublishedCmsData(body);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/collections', 'page');
      revalidatePath('/collections/[slug]', 'page');
      revalidatePath('/products/[slug]', 'page');
      revalidatePath('/admin/products', 'page');
      revalidatePath('/admin/homepage', 'page');
    } catch {
      // Revalidation warning ignored in test/isolated environments
    }

    const dbUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL || '';
    const dbName = dbUrl.includes('aivencloud.com') ? 'aiven-postgres' : 'neon-postgres';

    return NextResponse.json({
      success: true,
      message: 'CMS data successfully published across devices!',
      storageTarget: savedToNeon ? dbName : savedToKv ? 'vercel-kv' : savedToFile ? 'local-file' : 'server-memory',
    });
  } catch (error) {
    console.error('[CMS API] Error publishing CMS data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save and publish CMS data' },
      { status: 500 }
    );
  }
}
