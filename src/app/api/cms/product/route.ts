import { NextRequest, NextResponse } from 'next/server';
import { getPublishedProductBySlug } from '../../../../lib/cms/serverCms';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('id');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug or id is required' },
        { status: 400 }
      );
    }

    const product = await getPublishedProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('[CMS Product API] Error resolving product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error resolving product' },
      { status: 500 }
    );
  }
}
