import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '../../../../../types/auth';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const searchParams = req.nextUrl.searchParams;
  const targetRole = (searchParams.get('role') as UserRole) || 'CUSTOMER';
  const redirectTo = searchParams.get('redirect') || (targetRole === 'ADMIN' ? '/admin' : '/');
  const siteUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  if (provider !== 'google') {
    return NextResponse.redirect(`${siteUrl}/login?error=UnsupportedProvider`);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!googleClientId || !googleClientSecret) {
    console.warn('[OAuth] Google Client ID or Secret missing in .env.local');
    return NextResponse.redirect(`${siteUrl}/login?error=GoogleCredentialsMissing`);
  }

  // Allow optional override from .env.local if developer configured a different path in Google Console
  const customCallback = process.env.GOOGLE_CALLBACK_URL?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
  const redirectUri = customCallback || `${siteUrl}/api/auth/oauth/callback`;

  // Encode state securely to preserve role, redirect path, and exact redirectUri used
  const stateObj = { provider: 'google', role: targetRole, redirect: redirectTo, redirectUri };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    googleClientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account&state=${state}`;

  return NextResponse.redirect(googleAuthUrl);
}
