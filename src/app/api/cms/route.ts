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

    const isDev = process.env.NODE_ENV !== 'production';
    const host = req.headers.get('host') || '';
    const isLocalNetwork =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.includes('192.168.') ||
      host.includes('10.') ||
      host.includes('172.');

    if (!payload || payload.role !== 'ADMIN') {
      // In development or on local network (e.g. mobile testing on Wi-Fi), allow publishing without strict JWT barrier
      if (!isDev && !isLocalNetwork) {
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

    const { savedToKv, savedToFile } = await savePublishedCmsData(body);

    try {
      revalidatePath('/', 'page');
      revalidatePath('/collections', 'page');
      revalidatePath('/admin/products', 'page');
      revalidatePath('/admin/homepage', 'page');
    } catch {
      // Revalidation warning ignored in test/isolated environments
    }

    return NextResponse.json({
      success: true,
      message: 'CMS data successfully published across devices!',
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
