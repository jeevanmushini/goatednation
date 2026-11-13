import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateOAuthUser } from '../../../../../lib/auth/userDb';
import { signJwt } from '../../../../../lib/auth/jwt';
import { UserRole } from '../../../../../types/auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (errorParam) {
    console.error('[OAuth Callback] Provider returned error:', errorParam);
    return NextResponse.redirect(
      `${siteUrl}/login?error=OAuthFailed&details=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=OAuthCodeMissing`);
  }

  // Parse state data
  let role: UserRole = 'CUSTOMER';
  let redirectTo = '/';
  let matchedRedirectUri = '';

  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (parsed.role === 'ADMIN' || parsed.role === 'CUSTOMER') {
        role = parsed.role;
      }
      if (parsed.redirect && typeof parsed.redirect === 'string') {
        redirectTo = parsed.redirect;
      }
      if (parsed.redirectUri && typeof parsed.redirectUri === 'string') {
        matchedRedirectUri = parsed.redirectUri;
      }
    } catch {
      // Ignore parse error, use defaults
    }
  }

  // Fallback to query params if state wasn't present
  if (searchParams.get('role')) {
    role = (searchParams.get('role') as UserRole) || role;
  }
  if (searchParams.get('redirect')) {
    redirectTo = searchParams.get('redirect') || redirectTo;
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    
    // Use the exact redirectUri that initiated the authorization flow
    const customCallback = process.env.GOOGLE_CALLBACK_URL?.trim() || process.env.GOOGLE_REDIRECT_URI?.trim();
    const redirectUri =
      matchedRedirectUri ||
      customCallback ||
      `${siteUrl}${req.nextUrl.pathname}`;

    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Google OAuth] Token exchange error:', tokenData);
      throw new Error(
        tokenData.error_description || tokenData.error || 'Failed to exchange Google authorization code'
      );
    }

    // 2. Fetch authenticated user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const email = userData.email;
    const name = userData.name || userData.email.split('@')[0];
    const avatar = userData.picture || '';

    if (!email) {
      return NextResponse.redirect(`${siteUrl}/login?error=EmailNotFound`);
    }

    // 3. Find or create user in user database
    const user = findOrCreateOAuthUser({
      email,
      name,
      avatar,
      provider: 'google',
      defaultRole: role,
    });

    // 4. Generate signed JWT token
    const token = signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    });

    // 5. Create redirect response and set secure auth_token cookie
    const targetUrl =
      redirectTo && !redirectTo.startsWith('/login')
        ? redirectTo
        : user.role === 'ADMIN'
        ? '/admin'
        : '/';

    const response = NextResponse.redirect(new URL(targetUrl, siteUrl));

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during Google OAuth';
    console.error('[Google OAuth Callback Error]', message);
    return NextResponse.redirect(
      `${siteUrl}/login?error=OAuthFailed&details=${encodeURIComponent(message)}`
    );
  }
}
