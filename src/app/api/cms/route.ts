import { NextRequest, NextResponse } from 'next/server';
import { getPublishedCmsData, savePublishedCmsData, PublishedCmsData } from '../../../lib/cms/serverCms';

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
    const body = (await req.json()) as Partial<PublishedCmsData>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid CMS data payload' },
        { status: 400 }
      );
    }

    const { savedToKv, savedToFile } = await savePublishedCmsData(body);

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
