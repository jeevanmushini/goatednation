import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyJwt } from '../../../../lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const payload = token ? verifyJwt(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin clearance required.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      google: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_CLIENT_ID || '',
      },
      callbackUrl: `${process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/oauth/callback`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const payload = token ? verifyJwt(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin clearance required.' }, { status: 403 });
    }

    const body = await req.json();
    const { googleClientId, googleClientSecret } = body;

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const updateEnvVar = (key: string, val: string | undefined) => {
      if (val === undefined) return;
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
      process.env[key] = val;
    };

    if (googleClientId !== undefined) updateEnvVar('GOOGLE_CLIENT_ID', googleClientId);
    if (googleClientSecret !== undefined) updateEnvVar('GOOGLE_CLIENT_SECRET', googleClientSecret);

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Google OAuth credentials updated successfully.',
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update credentials';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
