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

    // --- Ensure uploads directory exists ---
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // --- Write file to disk ---
    const filePath = path.join(uploadsDir, safeFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;
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
      { success: false, error: 'Internal server error while uploading file.' },
      { status: 500 }
    );
  }
}

