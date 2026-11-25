import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only image files (JPG, PNG, WEBP, AVIF) are accepted.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum 10MB limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Try Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(buffer, file.type, 'tickets', file.name);
        return NextResponse.json({
          success: true,
          url: cloudinaryUrl,
        });
      } catch (err) {
        console.warn('[Ticket Upload] Cloudinary upload failed, falling back to local storage:', err);
      }
    }

    // 2. Local public fallback
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tickets');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || '.jpg';
    const uniqueFilename = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);
    const publicUrl = `/uploads/tickets/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: unknown) {
    console.error('[Ticket Upload API] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
