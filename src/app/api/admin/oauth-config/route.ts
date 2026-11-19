import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyJwt } from '../../../../lib/auth/jwt';
import { getSettingFromNeon, saveSettingToNeon } from '../../../../lib/db/neon';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const payload = token ? verifyJwt(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin clearance required.' }, { status: 403 });
    }

    const neonClientId = await getSettingFromNeon('GOOGLE_CLIENT_ID');
    const neonClientSecret = await getSettingFromNeon('GOOGLE_CLIENT_SECRET');

    const effectiveClientId = neonClientId || process.env.GOOGLE_CLIENT_ID || '';
    const hasSecret = !!(neonClientSecret || process.env.GOOGLE_CLIENT_SECRET);

    return NextResponse.json({
      success: true,
      google: {
        configured: !!(effectiveClientId && hasSecret),
        clientId: effectiveClientId,
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

    // 1. Persist to Neon Postgres app_settings (works in serverless and preserves state across deploys)
    if (googleClientId !== undefined && googleClientId.trim() !== '') {
      await saveSettingToNeon('GOOGLE_CLIENT_ID', googleClientId.trim());
      process.env.GOOGLE_CLIENT_ID = googleClientId.trim();
    }
    if (googleClientSecret !== undefined && googleClientSecret.trim() !== '') {
      await saveSettingToNeon('GOOGLE_CLIENT_SECRET', googleClientSecret.trim());
      process.env.GOOGLE_CLIENT_SECRET = googleClientSecret.trim();
    }

    // 2. Also update local .env.local if filesystem is writable (development)
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        const updateEnvVar = (key: string, val: string | undefined) => {
          if (!val) return;
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        };

        if (googleClientId) updateEnvVar('GOOGLE_CLIENT_ID', googleClientId);
        if (googleClientSecret) updateEnvVar('GOOGLE_CLIENT_SECRET', googleClientSecret);

        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
      }
    } catch (fsErr) {
      // In read-only serverless filesystems, Neon Postgres is the authoritative source
      console.warn('[OAuth Config] File system is read-only, saved directly to Neon database:', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Google OAuth credentials updated successfully in Neon database.',
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update credentials';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
