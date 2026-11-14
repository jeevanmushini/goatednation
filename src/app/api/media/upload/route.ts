import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Allowed MIME types and extensions
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'products';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided in request body.' },
        { status: 400 }
      );
    }

    // --- Validate MIME type ---
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF, GIF, SVG.`,
        },
        { status: 422 }
      );
    }

    // --- Validate file size ---
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`,
        },
        { status: 422 }
      );
    }

    // --- Sanitize filename ---
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(originalName) || '.jpg';
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${baseName}${ext}`.toLowerCase();

    // --- Prepare buffer and determine storage strategy ---
    const buffer = Buffer.from(await file.arrayBuffer());
    let publicUrl = '';

    try {
      // 1. Attempt writing to public/uploads (local development or writable disk)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, safeFileName);
      await writeFile(filePath, buffer);
      publicUrl = `/uploads/${safeFileName}`;
    } catch (diskError) {
      // 2. Fallback to inline Base64 Data URL for serverless/read-only runtimes (e.g. Vercel)
      console.warn(
        '[Media Upload] Local filesystem read-only or unwritable. Falling back to base64 Data URL:',
        diskError
      );
      publicUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    }

    const sizeKb = (file.size / 1024).toFixed(0);
    const sizeLabel = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${sizeKb} KB`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: baseName + ext,
      originalName: file.name,
      size: sizeLabel,
      category,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('[Media Upload] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error while uploading file.',
      },
      { status: 500 }
    );
  }
}

